import express from 'express';
import cors from 'cors';
import { Innertube, UniversalCache } from 'youtubei.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize InnerTube with Android client (stable)
let yt = null;
let lastInitError = null;

async function getYT() {
    if (yt) return yt;
    try {
        const { Innertube, UniversalCache } = await import('youtubei.js');
        yt = await Innertube.create({
            cache: new UniversalCache(false),
            client_type: 'ANDROID', // Most stable for metadata
            generate_session_locally: true
        });
        console.log('✅ YouTube InnerTube Client Initialized');
        lastInitError = null;
        return yt;
    } catch (e) {
        console.error('❌ Failed to initialize InnerTube:', e);
        lastInitError = e.message;
        return null;
    }
}

// Node server listener (local development)
if (!process.env.NETLIFY && !process.env.LAMBDA_TASK_ROOT) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// --- YouTube Music API Logic ---

// Raw Metadata for Client-Side Extraction (Hybrid Mode)
app.get('/youtube/player/:videoId', async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) return res.status(400).send({ error: 'Video ID required' });
    const ytClient = await getYT();
    try {
        if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });

        console.log(`[Player] Fetching metadata for ID: ${videoId} using shared ANDROID session`);
        const info = await ytClient.getInfo(videoId);
        const player = ytClient.session.player;

        if (!info.streaming_data) {
            return res.status(403).send({
                error: 'Metadata extraction failed',
                videoId: videoId,
                message: 'Streaming data missing. YouTube is still restricting this track on the server.',
                basicInfo: info.basic_info
            });
        }

        const playerUrl = player.url.startsWith('http') ? player.url : `https://www.youtube.com${player.url}`;

        res.send({
            videoId: videoId,
            streamingData: info.streaming_data,
            playerUrl: playerUrl,
            signatureTimestamp: player.sts,
            basicInfo: info.basic_info
        });
    } catch (error) {
        console.error('[Player] Error:', error.message);
        res.status(500).send({
            error: 'Failed to fetch player metadata',
            message: error.message,
            suggestion: 'The server IP might be flagged. Try again in a few minutes or use the desktop app.'
        });
    }
});

// YouTube Music Search Suggestions
app.get('/youtube/suggestions', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).send({ error: 'Query parameter is required' });
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready',
        details: lastInitError,
        tip: 'This can happen on the first request (cold start). Please refresh in a few seconds.'
    });
    try {
        const suggestions = await ytClient.music.getSearchSuggestions(query);
        res.send(suggestions);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch suggestions', message: error.message });
    }
});

// YouTube Music Search
app.get('/youtube/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).send({ error: 'Query parameter required' });
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready', details: lastInitError
    });
    try {
        const results = await ytClient.music.search(query, { type: 'song' });
        res.send({ items: results.songs?.contents || [] });
    } catch (e) { res.status(500).send({ error: e.message }); }
});

// Simplified Song Search (Requested)
app.get('/youtube/songs', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).send({ error: 'Query parameter required' });
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready', details: lastInitError
    });
    try {
        const results = await ytClient.music.search(query, { type: 'song' });
        const songs = results.songs?.contents || [];

        const simplifiedSongs = songs.map(song => ({
            id: song.id,
            name: song.title,
            singers: song.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
            album: song.album?.name || 'Single',
            duration: song.duration?.text || 'Unknown',
            image: song.thumbnail?.contents?.[0]?.url || song.thumbnails?.[0]?.url,
            // Extra metadata helpful for clients
            isExplicit: song.is_explicit || false
        }));

        res.send({ items: simplifiedSongs });
    } catch (e) { res.status(500).send({ error: e.message }); }
});

// Legacy search endpoint (now YouTube only)
app.get('/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).send({ error: 'Query parameter is required' });
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready',
        details: lastInitError,
        tip: 'This can happen on the first request (cold start). Please refresh in a few seconds.'
    });
    try {
        const results = await ytClient.music.search(query, { type: 'song' });
        const songs = results.songs?.contents || [];
        res.send({ youtube: { items: songs } });
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch search results', message: error.message });
    }
});

// YouTube Music stream extraction
app.get('/stream/youtube/:videoId', async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) return res.status(400).send({ error: 'Video ID is required' });

    try {
        const { Innertube, UniversalCache } = await import('youtubei.js');
        const ytClient = await Innertube.create({
            cache: new UniversalCache(false),
            client_type: 'WEB' // WEB is best for deciphering official tracks
        });

        const info = await ytClient.getInfo(videoId);
        const bestFormat = info.chooseFormat({ type: 'audio', quality: 'best' });

        if (!bestFormat) {
            return res.status(404).send({ error: 'No audio formats found' });
        }

        let audioUrl = '';
        try {
            audioUrl = bestFormat.decipher(ytClient.session.player);
        } catch (e) {
            audioUrl = bestFormat.url;
        }

        if (!audioUrl) {
            return res.status(404).send({ error: 'Could not extract playable URL. YouTube is blocking this server.' });
        }

        res.send({
            videoId: videoId,
            title: info.basic_info.title,
            audioUrl: audioUrl,
            quality: 'High',
            note: 'This link is valid for 6 hours.'
        });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Browsing & Content
app.get('/youtube/home', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready',
        details: lastInitError,
        tip: 'This can happen on the first request (cold start). Please refresh in a few seconds.'
    });
    try {
        const home = await ytClient.music.getHomeFeed();
        res.send(home);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/youtube/explore', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready',
        details: lastInitError,
        tip: 'This can happen on the first request (cold start). Please refresh in a few seconds.'
    });
    try {
        const explore = await ytClient.music.getExplore();
        res.send(explore);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/youtube/moods', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready',
        details: lastInitError,
        tip: 'This can happen on the first request (cold start). Please refresh in a few seconds.'
    });
    try {
        const moods = await ytClient.music.getExplore();
        res.send(moods);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

// Details & Metadata
app.get('/youtube/album/:id', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready',
        details: lastInitError,
        tip: 'This can happen on the first request (cold start). Please refresh in a few seconds.'
    });
    try {
        const album = await ytClient.music.getAlbum(req.params.id);
        res.send(album);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/youtube/playlist/:id', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready',
        details: lastInitError,
        tip: 'This can happen on the first request (cold start). Please refresh in a few seconds.'
    });
    try {
        const playlist = await ytClient.music.getPlaylist(req.params.id);
        res.send(playlist);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/youtube/artist/:id', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready',
        details: lastInitError,
        tip: 'This can happen on the first request (cold start). Please refresh in a few seconds.'
    });
    try {
        const artist = await ytClient.music.getArtist(req.params.id);
        res.send(artist);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

// Interactive Features
app.get('/youtube/lyrics/:videoId', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready',
        details: lastInitError,
        tip: 'This can happen on the first request (cold start). Please refresh in a few seconds.'
    });
    try {
        const lyrics = await ytClient.music.getLyrics(req.params.videoId);
        res.send(lyrics || { error: 'No lyrics found for this song' });
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/youtube/related/:videoId', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready',
        details: lastInitError,
        tip: 'This can happen on the first request (cold start). Please refresh in a few seconds.'
    });
    try {
        const related = await ytClient.music.getRelated(req.params.videoId);
        res.send(related);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/youtube/upnext/:videoId', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({
        error: 'YouTube client not ready',
        details: lastInitError,
        tip: 'This can happen on the first request (cold start). Please refresh in a few seconds.'
    });
    try {
        const queue = await ytClient.music.getUpNext(req.params.videoId);
        res.send(queue);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/', (req, res) => {
    res.send({
        message: 'Nirvay YouTube Music API (Netlify Serverless Exclusive)',
        endpoints: [
            '/youtube/home', '/youtube/songs?query=...', '/youtube/search?query=...',
            '/youtube/suggestions?query=...', '/youtube/explore', '/youtube/moods',
            '/stream/youtube/:videoId', '/youtube/album/:id', '/youtube/playlist/:id',
            '/youtube/artist/:id', '/youtube/lyrics/:videoId', '/youtube/related/:videoId',
            '/youtube/upnext/:videoId'
        ]
    });
});

// Port occupied by Netlify logic, moved above

// Export for serverless (Netlify)
export default app;

process.on('uncaughtException', (err) => console.error('Caught exception:', err));

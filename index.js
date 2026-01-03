const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Innertube, UniversalCache } = require('youtubei.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize InnerTube with Android client (stable)
let yt = null;
async function getYT() {
    if (yt) return yt;
    try {
        yt = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true,
            device_category: 'mobile',
            client_type: 'ANDROID'
        });
        console.log('✅ YouTube InnerTube Client Initialized (Android Mode)');
        return yt;
    } catch (e) {
        console.error('❌ Failed to initialize InnerTube:', e);
        return null;
    }
}

// Global initialization for local development
if (require.main === module) {
    getYT();
}

// --- YouTube Music API Logic ---

// YouTube Music Search Suggestions
app.get('/youtube/suggestions', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).send({ error: 'Query parameter is required' });
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });
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
    if (!query) return res.status(400).send({ error: 'Query parameter is required' });
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });
    try {
        const results = await ytClient.music.search(query, { type: 'song' });
        // The results usually have a 'songs' property with contents
        const songs = results.songs?.contents || [];
        res.send({ items: songs });
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch search results', message: error.message });
    }
});

// Legacy search endpoint (now YouTube only)
app.get('/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).send({ error: 'Query parameter is required' });
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });
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
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });

    try {
        const info = await ytClient.getBasicInfo(videoId);
        let bestFormat = null;
        try {
            bestFormat = info.chooseFormat({ type: 'audio', quality: 'best' });
        } catch (e) { }

        if (!bestFormat) {
            const formats = info.streaming_data?.formats.concat(info.streaming_data.adaptive_formats) || [];
            const audioFormats = formats.filter(f => f.mime_type.includes('audio'));
            if (audioFormats.length > 0) {
                audioFormats.sort((a, b) => b.bitrate - a.bitrate);
                bestFormat = audioFormats[0];
            }
        }

        if (!bestFormat) return res.status(404).send({ error: 'No audio streams found' });

        let url = null;
        try {
            url = bestFormat.decipher(ytClient.session.player);
        } catch (e) { }

        if (!url || typeof url !== 'string') url = bestFormat.url;
        if (!url) return res.status(404).send({ error: 'Failed to extract audio URL' });

        res.send({
            videoId: videoId,
            title: info.basic_info.title,
            artist: info.basic_info.author,
            duration: info.basic_info.duration,
            thumbnail: info.basic_info.thumbnail?.[0]?.url,
            audioUrl: url,
            quality: { bitrate: bestFormat.bitrate, mime: bestFormat.mime_type },
            source: 'YouTube (InnerTube/Android)'
        });
    } catch (error) {
        res.status(500).send({ error: 'Failed to extract stream', message: error.message });
    }
});

// Browsing & Content
app.get('/youtube/home', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });
    try {
        const home = await ytClient.music.getHomeFeed();
        res.send(home);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/youtube/explore', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });
    try {
        const explore = await ytClient.music.getExplore();
        res.send(explore);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/youtube/moods', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });
    try {
        const moods = await ytClient.music.getExplore();
        res.send(moods);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

// Details & Metadata
app.get('/youtube/album/:id', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });
    try {
        const album = await ytClient.music.getAlbum(req.params.id);
        res.send(album);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/youtube/playlist/:id', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });
    try {
        const playlist = await ytClient.music.getPlaylist(req.params.id);
        res.send(playlist);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/youtube/artist/:id', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });
    try {
        const artist = await ytClient.music.getArtist(req.params.id);
        res.send(artist);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

// Interactive Features
app.get('/youtube/lyrics/:videoId', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });
    try {
        const lyrics = await ytClient.music.getLyrics(req.params.videoId);
        res.send(lyrics || { error: 'No lyrics found for this song' });
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/youtube/related/:videoId', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });
    try {
        const related = await ytClient.music.getRelated(req.params.videoId);
        res.send(related);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/youtube/upnext/:videoId', async (req, res) => {
    const ytClient = await getYT();
    if (!ytClient) return res.status(503).send({ error: 'YouTube client not ready' });
    try {
        const queue = await ytClient.music.getUpNext(req.params.videoId);
        res.send(queue);
    } catch (e) { res.status(500).send({ error: e.message }); }
});

app.get('/', (req, res) => {
    res.send({
        message: 'Bloomee YouTube Music API (Netlify Serverless Exclusive)',
        endpoints: [
            '/youtube/home', '/youtube/search?query=...', '/youtube/suggestions?query=...',
            '/youtube/explore', '/youtube/moods', '/stream/youtube/:videoId',
            '/youtube/album/:id', '/youtube/playlist/:id', '/youtube/artist/:id',
            '/youtube/lyrics/:videoId', '/youtube/related/:videoId', '/youtube/upnext/:videoId'
        ]
    });
});

// Node server listener (local development)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export for serverless (Netlify)
module.exports = app;

process.on('uncaughtException', (err) => console.error('Caught exception:', err));

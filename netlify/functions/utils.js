// Shared utilities for all serverless functions
import axios from 'axios';

const YTM_API_KEY = 'AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30';
const YTM_BASE_URL = 'https://music.youtube.com/youtubei/v1';
const SAAVN_BASE_URL = 'https://www.jiosaavn.com/api.php?_format=json&_marker=0&cc=in&includeMetaTags=1';

// CORS headers
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Time string to seconds converter
export function timeStringToSeconds(time) {
    if (!time) return 0;
    const parts = time.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    return parts[0];
}

// Send YouTube Music API request
export async function sendYtmRequest(endpoint, body) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    body.context = body.context || {
        client: {
            clientName: 'WEB_REMIX',
            clientVersion: `1.${date}.01.00`,
            hl: 'en',
            gl: 'US',
        }
    };

    const response = await axios.post(
        `${YTM_BASE_URL}/${endpoint}?key=${YTM_API_KEY}`,
        body,
        {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://music.youtube.com',
            }
        }
    );

    return response.data;
}

// Parse YouTube Music item
export function parseYtmItem(renderer, isCard = false) {
    let videoId;
    if (isCard) {
        videoId = renderer.buttons?.[0]?.buttonRenderer?.command?.watchEndpoint?.videoId;
    } else {
        videoId = renderer.playlistItemData?.videoId;
    }

    if (!videoId) return null;

    let title;
    if (isCard) {
        title = renderer.title?.runs?.[0]?.text;
    } else {
        const flexColumns = renderer.flexColumns;
        if (flexColumns && flexColumns.length > 0) {
            title = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
        }
    }

    let runs;
    if (isCard) {
        runs = renderer.subtitle?.runs || [];
    } else {
        const flexColumns = renderer.flexColumns;
        if (flexColumns && flexColumns.length > 1) {
            runs = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        }
    }

    let artist, artistId, album, albumId, year, duration;

    for (const run of runs) {
        const text = run.text?.toString() || '';
        const endpoint = run.navigationEndpoint?.browseEndpoint;
        const pageType = endpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;

        if (text.trim() === '•' || text.trim() === '·') continue;

        if (pageType === 'MUSIC_PAGE_TYPE_ARTIST') {
            artist = artist ? `${artist}, ${text}` : text;
            artistId = artistId || endpoint.browseId;
        } else if (pageType === 'MUSIC_PAGE_TYPE_ALBUM') {
            album = text;
            albumId = endpoint.browseId;
        } else if (text.includes(':')) {
            duration = text;
        } else if (/^\d{4}$/.test(text)) {
            year = text;
        } else if (!artist && !['Song', 'Video', 'Single', 'Playlist', 'Album'].includes(text.trim())) {
            artist = text;
        }
    }

    const thumbnails = renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
    const image = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : '';

    const explicit = renderer.badges?.some(b =>
        b.musicInlineBadgeRenderer?.icon?.iconType === 'MUSIC_EXPLICIT_BADGE'
    ) || false;

    return {
        id: videoId,
        title: title || 'Unknown',
        name: title || 'Unknown',
        artist: artist || 'Unknown',
        artistId,
        singers: artist || 'Unknown',
        album: album || 'YouTube Music',
        albumId,
        year,
        duration: timeStringToSeconds(duration).toString(),
        image: image.replace('w60-h60', 'w400-h400').replace('w120-h120', 'w400-h400'),
        explicit,
        provider: 'youtube',
    };
}

// Fetch JioSaavn data
export async function fetchSaavn(params) {
    const url = new URL(SAAVN_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    const response = await axios.get(url.toString(), {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
    });

    return response.data;
}

// Decode HTML entities
export function decodeHtml(html) {
    if (!html) return '';
    return html
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ');
}

// Format JioSaavn song
export function formatSaavnSong(song) {
    const id = song.id;
    const audioUrl = `/.netlify/functions/saavn-audio?id=${id}`;

    return {
        id,
        name: decodeHtml(song.song || song.title),
        title: decodeHtml(song.song || song.title),
        singers: decodeHtml(song.singers || song.primary_artists),
        artist: decodeHtml(song.singers || song.primary_artists),
        artistId: song.primary_artists_id || song.singers_id,
        album: decodeHtml(song.album),
        albumId: song.albumid,
        duration: song.duration?.toString() || '0',
        year: song.year?.toString(),
        language: song.language?.toString(),
        image: song.image?.toString().replace('150x150', '500x500') || '',
        explicit: song.explicit_content?.toString() === '1' || song.explicit?.toString() === 'true',
        audioUrl,
        provider: 'saavn'
    };
}

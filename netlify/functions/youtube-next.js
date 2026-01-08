// YouTube "Up Next" recommendations
import { corsHeaders, sendYtmRequest, timeStringToSeconds } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    const id = event.queryStringParameters?.id || event.path.split('/').pop();

    if (!id) {
        return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing video ID' })
        };
    }

    try {
        const data = await sendYtmRequest('next', { videoId: id });

        const items = [];
        const results = data.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents || [];

        // Skip the first item (current playing song) and parse the rest
        for (let i = 1; i < results.length; i++) {
            const item = results[i];
            const renderer = item.playlistPanelVideoRenderer;
            if (!renderer) continue;

            const title = renderer.title?.runs?.[0]?.text;
            const videoId = renderer.videoId;
            if (!videoId) continue;

            const runs = renderer.longBylineText?.runs || renderer.shortBylineText?.runs || [];

            let artist, artistId, album, albumId, duration;
            for (const run of runs) {
                const text = run.text?.toString() || '';
                const endpoint = run.navigationEndpoint?.browseEndpoint;
                const pageType = endpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;

                if (pageType === 'MUSIC_PAGE_TYPE_ARTIST') {
                    artist = artist ? `${artist}, ${text}` : text;
                    artistId = artistId || endpoint?.browseId;
                } else if (pageType === 'MUSIC_PAGE_TYPE_ALBUM') {
                    album = text;
                    albumId = endpoint?.browseId;
                } else if (text.includes(':')) {
                    duration = text;
                }
            }

            const thumbnails = renderer.thumbnail?.thumbnails || [];
            const image = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : '';

            items.push({
                id: videoId,
                title,
                name: title,
                artist: artist || 'Unknown',
                artistId,
                singers: artist || 'Unknown',
                album: album || 'Up Next',
                albumId,
                duration: timeStringToSeconds(duration).toString(),
                image: image.replace('w60-h60', 'w400-h400').replace('w120-h120', 'w400-h400'),
                provider: 'youtube'
            });
        }

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}


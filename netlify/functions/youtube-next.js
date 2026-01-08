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

        for (const item of results) {
            const renderer = item.playlistPanelVideoRenderer;
            if (!renderer) continue;

            const title = renderer.title?.runs?.[0]?.text;
            const videoId = renderer.videoId;
            const runs = renderer.longBylineText?.runs || renderer.shortBylineText?.runs || [];

            let artist, album, duration;
            for (const run of runs) {
                const text = run.text?.toString() || '';
                const pageType = run.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;
                if (pageType === 'MUSIC_PAGE_TYPE_ARTIST') {
                    artist = artist ? `${artist}, ${text}` : text;
                } else if (pageType === 'MUSIC_PAGE_TYPE_ALBUM') {
                    album = text;
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
                singers: artist || 'Unknown',
                album: album || 'Up Next',
                duration: timeStringToSeconds(duration).toString(),
                image,
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

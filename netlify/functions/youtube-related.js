// YouTube related videos
import { corsHeaders, sendYtmRequest, parseYtmItem } from './utils.js';

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
        const automix = data.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer;

        if (automix) {
            const results = automix.contents || [];
            for (const item of results) {
                const renderer = item.playlistPanelVideoRenderer || item.automixPreviewVideoRenderer;
                if (!renderer) continue;

                const videoId = renderer.videoId;
                const title = renderer.title?.runs?.[0]?.text;
                const artist = renderer.longBylineText?.runs?.[0]?.text || renderer.shortBylineText?.runs?.[0]?.text;
                const thumbnails = renderer.thumbnail?.thumbnails || [];

                if (videoId && title) {
                    items.push({
                        id: videoId,
                        title,
                        name: title,
                        artist: artist || 'Unknown',
                        singers: artist || 'Unknown',
                        image: thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : '',
                        provider: 'youtube'
                    });
                }
            }
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

// YouTube lyrics
import { corsHeaders, sendYtmRequest } from './utils.js';

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
        // First get the watch page to find lyrics browse ID
        const watchData = await sendYtmRequest('next', { videoId: id });

        const tabs = watchData.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs || [];
        let lyricsId = null;

        for (const tab of tabs) {
            const tabRenderer = tab.tabRenderer;
            if (tabRenderer?.title?.runs?.[0]?.text === 'Lyrics') {
                lyricsId = tabRenderer.endpoint?.browseEndpoint?.browseId;
                break;
            }
        }

        if (!lyricsId) {
            return {
                statusCode: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Lyrics not available for this video' })
            };
        }

        // Get lyrics
        const lyricsData = await sendYtmRequest('browse', { browseId: lyricsId });
        const lyricsRenderer = lyricsData.contents?.sectionListRenderer?.contents?.[0]?.musicDescriptionShelfRenderer;

        const lyrics = lyricsRenderer?.description?.runs?.map(r => r.text).join('') || '';
        const source = lyricsRenderer?.footer?.runs?.[0]?.text || '';

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ lyrics, source })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

// YouTube album details
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
            body: JSON.stringify({ error: 'Missing album ID' })
        };
    }

    try {
        const data = await sendYtmRequest('browse', { browseId: id });

        const header = data.header?.musicDetailHeaderRenderer;
        const album = {
            title: header?.title?.runs?.[0]?.text || 'Unknown',
            artist: header?.subtitle?.runs?.[0]?.text || 'Unknown',
            year: header?.subtitle?.runs?.[2]?.text || '',
            thumbnails: header?.thumbnail?.croppedSquareThumbnailRenderer?.thumbnail?.thumbnails || []
        };

        const items = [];
        const results = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicShelfRenderer?.contents || [];

        for (const item of results) {
            const renderer = item.musicResponsiveListItemRenderer;
            if (!renderer) continue;
            const parsed = parseYtmItem(renderer);
            if (parsed) items.push(parsed);
        }

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ album, items })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

// YouTube playlist
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
            body: JSON.stringify({ error: 'Missing playlist ID' })
        };
    }

    try {
        const browseId = id.startsWith('PL') || id.startsWith('VL') ? id : `VL${id}`;
        const data = await sendYtmRequest('browse', { browseId });

        const items = [];
        const results = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicPlaylistShelfRenderer?.contents || [];

        for (const item of results) {
            const renderer = item.musicResponsiveListItemRenderer;
            if (!renderer) continue;
            const parsed = parseYtmItem(renderer);
            if (parsed) items.push(parsed);
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

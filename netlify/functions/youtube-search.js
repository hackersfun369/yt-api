// YouTube Music search
import { corsHeaders, sendYtmRequest, parseYtmItem } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    const query = event.queryStringParameters?.query;
    const filter = event.queryStringParameters?.filter || 'song';
    const limit = parseInt(event.queryStringParameters?.n || event.queryStringParameters?.limit || '20');

    let params = 'EgWKAQIIAWoKEAkQAxAEEAkQBRgA'; // Songs
    if (filter === 'video') params = 'EgWKAQIQAWoKEAkQAxAEEAkQBRgA';
    else if (filter === 'album') params = 'EgWKAQIYAWoKEAkQAxAEEAkQBRgA';
    else if (filter === 'artist') params = 'EgWKAQI4AWoKEAkQAxAEEAkQBRgA';

    try {
        const data = await sendYtmRequest('search', { query: query || '', params });

        const items = [];
        const sections = data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
        for (const section of sections) {
            const shelf = section.musicShelfRenderer;
            if (!shelf) continue;
            const shelfItems = shelf.contents || [];
            for (const item of shelfItems) {
                const renderer = item.musicResponsiveListItemRenderer;
                if (!renderer) continue;
                const parsed = parseYtmItem(renderer, false);
                if (parsed) items.push(parsed);
            }
        }

        const limited = items.slice(0, limit);

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: limited })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

// YouTube trending/charts
import { corsHeaders, sendYtmRequest, parseYtmItem } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    try {
        const data = await sendYtmRequest('browse', { browseId: 'FEmusic_trending' });

        const items = [];
        const sections = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

        for (const section of sections) {
            const shelf = section.musicCarouselShelfRenderer || section.musicShelfRenderer;
            if (!shelf) continue;

            const shelfItems = shelf.contents || [];
            for (const item of shelfItems) {
                const renderer = item.musicResponsiveListItemRenderer ||
                    item.musicTwoColumnItemRenderer ||
                    item.musicTwoRowItemRenderer;
                if (!renderer) continue;

                const parsed = parseYtmItem(renderer);
                if (parsed) items.push(parsed);
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


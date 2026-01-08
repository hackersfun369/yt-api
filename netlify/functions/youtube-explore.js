// YouTube explore page
import { corsHeaders, sendYtmRequest, parseYtmItem } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    try {
        const data = await sendYtmRequest('browse', { browseId: 'FEmusic_explore' });

        const sections = [];
        const contents = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

        for (const section of contents) {
            const shelf = section.musicCarouselShelfRenderer;
            if (!shelf) continue;

            const title = shelf.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text || 'Unknown';

            const items = [];
            const shelfItems = shelf.contents || [];
            for (const item of shelfItems) {
                const renderer = item.musicTwoRowItemRenderer || item.musicResponsiveListItemRenderer;
                if (!renderer) continue;
                const parsed = parseYtmItem(renderer);
                if (parsed) items.push(parsed);
            }

            if (items.length > 0) {
                sections.push({ title, items });
            }
        }

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ sections })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

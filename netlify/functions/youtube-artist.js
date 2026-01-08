// YouTube artist page
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
            body: JSON.stringify({ error: 'Missing artist ID' })
        };
    }

    try {
        const data = await sendYtmRequest('browse', { browseId: id });

        const header = data.header?.musicImmersiveHeaderRenderer || data.header?.musicVisualHeaderRenderer;
        const artist = {
            name: header?.title?.runs?.[0]?.text || 'Unknown',
            description: header?.description?.runs?.[0]?.text || '',
            subscribers: header?.subscriptionButton?.subscribeButtonRenderer?.subscriberCountText?.runs?.[0]?.text || '',
            thumbnails: header?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || []
        };

        const sections = [];
        const contents = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

        for (const section of contents) {
            const shelf = section.musicCarouselShelfRenderer || section.musicShelfRenderer;
            if (!shelf) continue;

            const title = shelf.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text ||
                shelf.header?.musicShelfHeaderRenderer?.title?.runs?.[0]?.text || 'Unknown';

            const items = [];
            const shelfItems = shelf.contents || [];
            for (const item of shelfItems) {
                const renderer = item.musicResponsiveListItemRenderer || item.musicTwoRowItemRenderer;
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
            body: JSON.stringify({ artist, sections })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

// YouTube moods and genres
import { corsHeaders, sendYtmRequest } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    try {
        const data = await sendYtmRequest('browse', { browseId: 'FEmusic_moods_and_genres' });

        const moods = [];
        const contents = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

        for (const section of contents) {
            const grid = section.musicCarouselShelfRenderer;
            if (!grid) continue;

            const items = grid.contents || [];
            for (const item of items) {
                const renderer = item.musicNavigationButtonRenderer;
                if (!renderer) continue;

                const title = renderer.buttonText?.runs?.[0]?.text;
                const browseId = renderer.clickCommand?.browseEndpoint?.browseId;
                const color = renderer.solid?.leftStripeColor;

                if (title && browseId) {
                    moods.push({ title, browseId, color });
                }
            }
        }

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ moods })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

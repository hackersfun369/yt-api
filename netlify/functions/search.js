// Unified search across YouTube and JioSaavn
import { corsHeaders, sendYtmRequest, fetchSaavn, parseYtmItem, formatSaavnSong } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    const query = event.queryStringParameters?.query;
    if (!query) {
        return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing query parameter' })
        };
    }

    const limit = parseInt(event.queryStringParameters?.n || event.queryStringParameters?.limit || '20');

    try {
        const [saavnData, youtubeData] = await Promise.all([
            fetchSaavn({ __call: 'search.getResults', q: query, n: '20' }),
            sendYtmRequest('search', { query, params: 'EgWKAQIIAWoKEAkQAxAEEAkQBRgA' })
        ]);

        const saavnSongs = (saavnData.results || []).map(formatSaavnSong);

        const youtubeSongs = [];
        const sections = youtubeData.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
        for (const section of sections) {
            const shelf = section.musicShelfRenderer;
            if (!shelf) continue;
            const shelfItems = shelf.contents || [];
            for (const item of shelfItems) {
                const renderer = item.musicResponsiveListItemRenderer;
                if (!renderer) continue;
                const parsed = parseYtmItem(renderer);
                if (parsed) youtubeSongs.push(parsed);
            }
        }

        const combined = [...saavnSongs, ...youtubeSongs];
        const limited = combined.slice(0, limit);

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: limited })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

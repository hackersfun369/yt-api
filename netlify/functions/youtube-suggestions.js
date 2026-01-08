// YouTube search suggestions/autocomplete
import { corsHeaders, sendYtmRequest } from './utils.js';

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

    try {
        const data = await sendYtmRequest('music/get_search_suggestions', { input: query });

        const suggestions = data.contents?.[0]?.searchSuggestionsSectionRenderer?.contents || [];
        const items = [];

        for (const s of suggestions) {
            const text = s.searchSuggestionRenderer?.suggestion?.runs?.map(r => r.text).join('');
            if (text) items.push(text);
        }

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ suggestions: items })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

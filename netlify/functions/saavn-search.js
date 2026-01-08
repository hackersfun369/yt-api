// JioSaavn search
import { corsHeaders, fetchSaavn, formatSaavnSong } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    const query = event.queryStringParameters?.query;
    const limit = event.queryStringParameters?.n || event.queryStringParameters?.limit || '20';

    try {
        const data = await fetchSaavn({ __call: 'search.getResults', q: query || '', n: limit });
        const results = (data.results || []).map(formatSaavnSong);

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: results })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

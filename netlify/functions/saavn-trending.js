// JioSaavn trending/charts
import { corsHeaders, fetchSaavn, decodeHtml } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    try {
        const data = await fetchSaavn({ __call: 'content.getCharts' });
        const items = [];

        for (const chart of (Array.isArray(data) ? data : [])) {
            items.push({
                id: chart.id,
                title: decodeHtml(chart.title),
                image: chart.image?.toString().replace('150x150', '500x500') || '',
                type: 'chart'
            });
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

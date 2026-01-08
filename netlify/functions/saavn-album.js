// JioSaavn album
import { corsHeaders, fetchSaavn, formatSaavnSong, decodeHtml } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    const id = event.queryStringParameters?.id || event.path.split('/').pop();

    if (!id) {
        return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing album ID' })
        };
    }

    try {
        const data = await fetchSaavn({ __call: 'content.getAlbumDetails', albumid: id });
        const songs = data.songs || [];
        const results = songs.map(formatSaavnSong);

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: data.id,
                title: decodeHtml(data.title),
                image: data.image?.toString().replace('150x150', '500x500') || '',
                items: results
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

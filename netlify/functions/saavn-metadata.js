// JioSaavn metadata
import { corsHeaders, fetchSaavn, formatSaavnSong } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    const id = event.queryStringParameters?.id || event.path.split('/').pop();

    if (!id) {
        return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing song ID' })
        };
    }

    try {
        const data = await fetchSaavn({ __call: 'song.getDetails', pids: id });

        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            return {
                statusCode: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Song not found' })
            };
        }

        let songNode;
        if (data.songs && Array.isArray(data.songs) && data.songs.length > 0) {
            songNode = data.songs[0];
        } else {
            songNode = data[Object.keys(data)[0]];
        }

        if (!songNode || typeof songNode !== 'object') {
            return {
                statusCode: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid song data structure' })
            };
        }

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(formatSaavnSong(songNode))
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

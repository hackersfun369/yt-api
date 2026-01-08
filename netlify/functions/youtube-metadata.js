// YouTube metadata using InnerTube API
import { corsHeaders, sendYtmRequest } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    const id = event.queryStringParameters?.id || event.path.split('/').pop();

    if (!id) {
        return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing video ID' })
        };
    }

    try {
        // Use InnerTube player endpoint instead of ytdl-core
        const data = await sendYtmRequest('player', { videoId: id });

        const details = data.videoDetails;
        if (!details) {
            return {
                statusCode: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Video not found' })
            };
        }

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: details.videoId,
                title: details.title,
                author: details.author,
                duration: details.lengthSeconds,
                image: details.thumbnail?.thumbnails?.[details.thumbnail.thumbnails.length - 1]?.url || '',
                provider: 'youtube'
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

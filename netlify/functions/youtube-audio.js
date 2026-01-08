// YouTube audio stream extraction
import { corsHeaders } from './utils.js';
import ytdl from '@distube/ytdl-core';

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
        const info = await ytdl.getInfo(id, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }
        });

        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        if (audioFormats.length === 0) {
            return {
                statusCode: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'No audio stream found' })
            };
        }

        // Get highest quality audio
        const bestAudio = audioFormats.reduce((best, format) => {
            return (format.audioBitrate || 0) > (best.audioBitrate || 0) ? format : best;
        });

        return {
            statusCode: 302,
            headers: {
                ...corsHeaders,
                'Location': bestAudio.url
            },
            body: ''
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

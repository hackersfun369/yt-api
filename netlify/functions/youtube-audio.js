// YouTube audio stream extraction using InnerTube API
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
        // Use InnerTube player endpoint to get streaming data
        const data = await sendYtmRequest('player', {
            videoId: id,
            params: 'CgIQBg==', // Audio only
            playbackContext: {
                contentPlaybackContext: {
                    signatureTimestamp: Math.floor(Date.now() / 1000)
                }
            }
        });

        const streamingData = data.streamingData;
        if (!streamingData) {
            return {
                statusCode: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'No streaming data available' })
            };
        }

        // Get audio formats
        const audioFormats = streamingData.adaptiveFormats?.filter(f =>
            f.mimeType?.includes('audio')
        ) || [];

        if (audioFormats.length === 0) {
            return {
                statusCode: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'No audio stream found' })
            };
        }

        // Get highest bitrate audio
        const bestAudio = audioFormats.reduce((best, format) => {
            return (format.bitrate || 0) > (best.bitrate || 0) ? format : best;
        });

        const audioUrl = bestAudio.url;
        if (!audioUrl) {
            return {
                statusCode: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Audio URL not available' })
            };
        }

        return {
            statusCode: 302,
            headers: {
                ...corsHeaders,
                'Location': audioUrl
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

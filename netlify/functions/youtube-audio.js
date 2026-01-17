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
        const data = await sendYtmRequest('player', {
            videoId: id,
            params: 'CgIQBg==', // Update this if needed
            playbackContext: {
                contentPlaybackContext: {
                    signatureTimestamp: Math.floor(Date.now() / 1000)
                }
            }
        }, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Origin': 'https://music.youtube.com',
                'Referer': 'https://music.youtube.com/',
                'Content-Type': 'application/json',
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

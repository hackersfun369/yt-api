// YouTube audio stream extraction
import { corsHeaders } from './utils.js';
import ytdl from '@distube/ytdl-core';

// Create agent with cookie support
const createYtdlAgent = () => {
    const cookies = process.env.YT_COOKIES || '';
    return ytdl.createAgent(undefined, {
        localAddress: undefined
    });
};

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

    // Try multiple clients for better reliability
    const clients = ['ANDROID', 'IOS', 'WEB'];

    for (const client of clients) {
        try {
            const agent = createYtdlAgent();
            const cookies = process.env.YT_COOKIES || '';

            const info = await ytdl.getInfo(id, {
                agent,
                requestOptions: {
                    headers: {
                        cookie: cookies,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9'
                    }
                }
            });

            const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
            if (audioFormats.length === 0) {
                continue; // Try next client
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
            // Try next client
            if (client === clients[clients.length - 1]) {
                // Last client failed, return error
                return {
                    statusCode: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: error.message })
                };
            }
        }
    }

    return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to extract audio from all clients' })
    };
}

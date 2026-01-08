// YouTube metadata
import { corsHeaders } from './utils.js';
import ytdl from '@distube/ytdl-core';

// Create agent with cookie support
const createYtdlAgent = () => {
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

    try {
        const agent = createYtdlAgent();
        const cookies = process.env.YT_COOKIES || '';

        const info = await ytdl.getBasicInfo(id, {
            agent,
            requestOptions: {
                headers: {
                    cookie: cookies,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            }
        });

        const video = info.videoDetails;

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: video.videoId,
                title: video.title,
                author: video.author.name,
                duration: video.lengthSeconds,
                image: video.thumbnails[video.thumbnails.length - 1]?.url || '',
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


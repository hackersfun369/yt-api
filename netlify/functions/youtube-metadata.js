// YouTube metadata
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
        const info = await ytdl.getBasicInfo(id);
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

// API index/root endpoint
import { corsHeaders } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    const baseUrl = `https://${event.headers.host}/.netlify/functions`;

    const endpoints = {
        message: "Bloomee Unified Music API (Netlify Serverless)",
        endpoints: {
            unified: [
                `${baseUrl}/search?query=...`
            ],
            youtube: [
                `${baseUrl}/youtube-home`,
                `${baseUrl}/youtube-explore`,
                `${baseUrl}/youtube-moods`,
                `${baseUrl}/youtube-search?query=...`,
                `${baseUrl}/youtube-suggestions?query=...`,
                `${baseUrl}/youtube-trending`,
                `${baseUrl}/youtube-metadata?id=...`,
                `${baseUrl}/youtube-audio?id=...`,
                `${baseUrl}/youtube-album?id=...`,
                `${baseUrl}/youtube-playlist?id=...`,
                `${baseUrl}/youtube-artist?id=...`,
                `${baseUrl}/youtube-lyrics?id=...`,
                `${baseUrl}/youtube-next?id=...`,
                `${baseUrl}/youtube-related?id=...`
            ],
            saavn: [
                `${baseUrl}/saavn-home`,
                `${baseUrl}/saavn-search?query=...`,
                `${baseUrl}/saavn-trending`,
                `${baseUrl}/saavn-metadata?id=...`,
                `${baseUrl}/saavn-audio?id=...`,
                `${baseUrl}/saavn-album?id=...`,
                `${baseUrl}/saavn-playlist?id=...`,
                `${baseUrl}/saavn-artist?id=...`,
                `${baseUrl}/saavn-lyrics?id=...`,
                `${baseUrl}/saavn-next?id=...`
            ]
        }
    };

    return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(endpoints, null, 2)
    };
}

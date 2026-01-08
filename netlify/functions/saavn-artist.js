// JioSaavn artist details
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
            body: JSON.stringify({ error: 'Missing artist ID' })
        };
    }

    try {
        const data = await fetchSaavn({ __call: 'webapi.get', token: id, type: 'artist' });

        const artist = {
            id: data.artistId,
            name: decodeHtml(data.name),
            image: data.image?.replace('150x150', '500x500') || '',
            followerCount: data.follower_count || '0',
            isVerified: data.isVerified || false
        };

        const sections = [];

        // Top Songs
        if (data.topSongs) {
            sections.push({
                title: 'Top Songs',
                items: data.topSongs.map(formatSaavnSong)
            });
        }

        // Top Albums
        if (data.topAlbums) {
            sections.push({
                title: 'Top Albums',
                items: data.topAlbums.map(a => ({
                    id: a.id,
                    title: decodeHtml(a.title),
                    year: a.year,
                    image: a.image?.replace('150x150', '500x500') || '',
                    type: 'album'
                }))
            });
        }

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ artist, sections })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

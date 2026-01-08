// JioSaavn home feed
import { corsHeaders, fetchSaavn, formatSaavnSong, decodeHtml } from './utils.js';

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    try {
        const data = await fetchSaavn({ __call: 'webapi.getLaunchData' });

        const sections = [];

        // New Trending
        if (data.new_trending) {
            sections.push({
                title: 'New Trending',
                items: data.new_trending.map(formatSaavnSong)
            });
        }

        // Top Playlists
        if (data.top_playlists) {
            sections.push({
                title: 'Top Playlists',
                items: data.top_playlists.map(p => ({
                    id: p.id,
                    title: decodeHtml(p.title),
                    image: p.image?.replace('150x150', '500x500') || '',
                    type: 'playlist'
                }))
            });
        }

        // New Albums
        if (data.new_albums) {
            sections.push({
                title: 'New Albums',
                items: data.new_albums.map(a => ({
                    id: a.id,
                    title: decodeHtml(a.title),
                    artist: decodeHtml(a.music),
                    image: a.image?.replace('150x150', '500x500') || '',
                    type: 'album'
                }))
            });
        }

        return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ sections })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}

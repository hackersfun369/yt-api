# Nirvay YouTube Music API (Pro) 🚀

A high-performance, serverless-ready REST API for YouTube Music data. This API provides official data access including high-quality audio streaming, lyrics, personalized feeds, and more. Optimized for **Netlify Functions** and **Native ES Modules**.

## 🌟 Key Features

- 🎹 **Pro YouTube Music Data**: Official search results, home feeds, charts, and exploration.
- 🎧 **High-Quality Streaming**: Reliable direct audio URL extraction via Android InnerTube protocol.
- 📜 **Official Lyrics**: Fetch song lyrics directly from YouTube Music.
- 🔄 **Continuous Playback**: Up-Next/Queue suggestions to build a seamless player experience.
- ☁️ **Serverless First**: Fully compatible with Netlify Functions using `esbuild` and `serverless-http`.
- ⚡ **Native ESM**: Built with modern JavaScript (ES Modules) for speed and compatibility.

## 📦 Deployment on Netlify

This project is pre-configured for instant deployment on Netlify.

1.  **Push to GitHub**: Push your local repository to a new GitHub repo.
2.  **Import to Netlify**: Select the repository in your Netlify dashboard.
3.  **Environment Settings**: 
    - Set `NODE_VERSION` to `18`.
    - (The `netlify.toml` file will handle the rest automatically).

## 🛠️ API Reference

### 1. Music Discovery
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/youtube/home` | `GET` | Curated home feed (trending, new releases) |
| `/youtube/explore` | `GET` | Global charts and new music |
| `/youtube/moods` | `GET` | Interest-based categories (Chill, Focus, etc.) |

### 2. Search & Streaming
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/youtube/songs?query=...` | `GET` | **Simplified** song metadata (ID, Name, Singers, etc.) |
| `/youtube/search?query=...` | `GET` | Official song search results (Raw data) |
| `/youtube/suggestions?query=...`| `GET` | Real-time search query auto-completion |
| `/stream/youtube/:videoId` | `GET` | Returns Metadata + Playable Audio URL |

### 3. Song Details & Playback
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/youtube/lyrics/:videoId` | `GET` | Official song lyrics (if available) |
| `/youtube/upnext/:videoId` | `GET` | Continuous queue suggestions (Autoplay) |
| `/youtube/related/:videoId` | `GET` | Related tracks and videos |

### 4. Metadata
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/youtube/artist/:id` | `GET` | Full artist profile, albums, and top songs |
| `/youtube/album/:id` | `GET` | Full tracklist for any album/EP |
| `/youtube/playlist/:id` | `GET` | Content of any public playlist |

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start local server
npm start
```
The server will run on `http://localhost:3000`.

## 📂 Project Structure
- `index.js`: Main API logic (Native ESM).
- `functions/api.js`: Netlify serverless entry point.
- `netlify.toml`: Deployment and bundling configuration.
- `package.json`: Dependency management and Node version settings.

## 📝 License
ISC

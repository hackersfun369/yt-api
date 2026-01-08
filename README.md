# Bloomee Music API 🚀

A high-performance, unified music metadata and streaming API built with **Node.js serverless functions** for **Netlify**. This API provides seamless access to both **YouTube Music** and **JioSaavn** platforms, offering search, metadata extraction, audio streaming, and smart recommendations.

## 🌟 Features

- ✅ **Unified Search** - Search across both YouTube Music and JioSaavn simultaneously
- ✅ **High-Quality Audio** - 320kbps streams for JioSaavn, best available for YouTube
- ✅ **Smart Recommendations** - "Up Next" and "Radio" features for continuous playback
- ✅ **Rich Metadata** - Complete song information including artist IDs, album IDs, explicit flags, and high-res artwork
- ✅ **CORS Enabled** - Works from any frontend application
- ✅ **Serverless & Scalable** - Built for Netlify with auto-scaling
- ✅ **Direct Audio URLs** - Server-side stream extraction with 302 redirects
- ✅ **Zero Configuration** - No environment variables required

---

## 🚀 Quick Deploy to Netlify

### Option 1: Deploy via Netlify UI (Recommended)

1. **Fork or push to GitHub**
2. **Go to [Netlify](https://app.netlify.com/)**
3. **Click "Add new site" → "Import an existing project"**
4. **Select your repository**
5. **Deploy!** (Build settings are auto-detected from `netlify.toml`)

### Option 2: Deploy via Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

---

## 🛠️ Tech Stack

### Core Technologies
- **Runtime**: Node.js 18+
- **Platform**: Netlify Serverless Functions
- **Bundler**: esbuild (configured in netlify.toml)
- **Module System**: ES Modules (ESM)

### Dependencies
- **[@distube/ytdl-core](https://www.npmjs.com/package/@distube/ytdl-core)** - YouTube audio stream extraction
- **[axios](https://www.npmjs.com/package/axios)** - HTTP client for API requests

### Data Sources
- **YouTube Music**: InnerTube API (WEB_REMIX client) for metadata + ytdl-core for audio
- **JioSaavn**: Official JioSaavn API with token-based authentication for 320kbps streams

---

## 🏗️ How It Works

### Architecture Overview

```
Client Request (https://your-site.netlify.app/youtube/search)
     ↓
Netlify Edge (Redirect Rules)
     ↓
Serverless Function (youtube-search.js)
     ↓
┌────────────────────┬────────────────────┐
│   YouTube Music    │     JioSaavn       │
│   Handler          │     Handler        │
└────────────────────┴────────────────────┘
     ↓                        ↓
┌────────────────────┬────────────────────┐
│ InnerTube API      │ JioSaavn API       │
│ (Metadata)         │ (Metadata + Token) │
│                    │                    │
│ ytdl-core          │ Auth Token Gen     │
│ (Audio Streams)    │ (Audio Streams)    │
└────────────────────┴────────────────────┘
     ↓                        ↓
JSON Response / 302 Redirect to Audio URL
```

### YouTube Music Flow
1. **Search/Metadata**: Uses InnerTube API (`music.youtube.com/youtubei/v1`) with WEB_REMIX client
2. **Audio Extraction**: Uses `@distube/ytdl-core` for reliable stream URLs
3. **Parsing**: Custom parser extracts artist IDs, album IDs, explicit flags, and high-res thumbnails

### JioSaavn Flow
1. **Search/Metadata**: Queries JioSaavn's internal API (`jiosaavn.com/api.php`)
2. **Audio Token**: Generates authentication token via `song.generateAuthToken` endpoint
3. **Stream Delivery**: Returns 320kbps direct audio URL with valid auth token

---

## 📡 API Endpoints

### Base URL
```
https://your-site.netlify.app
```

Replace `your-site` with your actual Netlify site name.

---

### 🔍 Unified Search

#### `GET /search`
Search across both YouTube Music and JioSaavn simultaneously.

**Query Parameters:**
- `query` (required) - Search term
- `n` or `limit` (optional) - Maximum results (default: 20)

**Example:**
```bash
curl "https://your-site.netlify.app/search?query=Kesariya&n=10"
```

**Response:**
```json
{
  "results": [
    {
      "id": "S6N_X_Yh",
      "name": "Kesariya",
      "artist": "Arijit Singh",
      "artistId": "459320",
      "album": "Brahmastra",
      "albumId": "38038250",
      "duration": "267",
      "year": "2022",
      "language": "hindi",
      "image": "https://c.saavncdn.com/191/Kesariya-From-Brahmastra-Hindi-2022-20220717092820-500x500.jpg",
      "explicit": false,
      "audioUrl": "/.netlify/functions/saavn-audio?id=S6N_X_Yh",
      "provider": "saavn"
    }
  ]
}
```

---

### 🎵 JioSaavn Endpoints

#### `GET /saavn/search`
Search JioSaavn catalog.

**Query Parameters:**
- `query` (required) - Search term
- `n` or `limit` (optional) - Maximum results (default: 20)

**Example:**
```bash
curl "https://your-site.netlify.app/saavn/search?query=Hukum&n=5"
```

---

#### `GET /saavn/metadata/:id`
Get detailed metadata for a specific JioSaavn song.

**Example:**
```bash
curl "https://your-site.netlify.app/saavn/metadata/S6N_X_Yh"
```

---

#### `GET /saavn/audio/:id`
Get direct audio stream URL (302 redirect to 320kbps stream).

**Example:**
```bash
curl -L "https://your-site.netlify.app/saavn/audio/S6N_X_Yh"
```

---

#### `GET /saavn/next/:id`
Get recommended tracks based on a song (Radio/Up Next).

**Example:**
```bash
curl "https://your-site.netlify.app/saavn/next/S6N_X_Yh"
```

---

#### `GET /saavn/trending`
Get JioSaavn trending charts.

**Example:**
```bash
curl "https://your-site.netlify.app/saavn/trending"
```

---

#### `GET /saavn/album/:id`
Get all tracks from a JioSaavn album.

**Example:**
```bash
curl "https://your-site.netlify.app/saavn/album/38038250"
```

---

#### `GET /saavn/playlist/:id`
Get all tracks from a JioSaavn playlist.

**Example:**
```bash
curl "https://your-site.netlify.app/saavn/playlist/playlist_id"
```

---

#### `GET /saavn/artist/:id`
Get artist details and top songs.

**Example:**
```bash
curl "https://your-site.netlify.app/saavn/artist/459320"
```

---

#### `GET /saavn/lyrics/:id`
Get song lyrics (if available).

**Example:**
```bash
curl "https://your-site.netlify.app/saavn/lyrics/S6N_X_Yh"
```

---

#### `GET /saavn/home`
Get JioSaavn home feed with curated playlists.

**Example:**
```bash
curl "https://your-site.netlify.app/saavn/home"
```

---

### 🎬 YouTube Music Endpoints

#### `GET /youtube/search`
Search YouTube Music catalog.

**Query Parameters:**
- `query` (required) - Search term
- `filter` (optional) - Filter type: `song` (default), `video`, `album`, `artist`
- `n` or `limit` (optional) - Maximum results (default: 20)

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/search?query=Believer&filter=song&n=5"
```

---

#### `GET /youtube/metadata/:id`
Get detailed metadata for a YouTube video.

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/metadata/7wtviwvnS_0"
```

---

#### `GET /youtube/audio/:id`
Get direct audio stream URL (302 redirect to best quality audio stream).

**Example:**
```bash
curl -L "https://your-site.netlify.app/youtube/audio/7wtviwvnS_0"
```

---

#### `GET /youtube/next/:id`
Get "Up Next" queue for continuous playback.

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/next/7wtviwvnS_0"
```

---

#### `GET /youtube/suggestions`
Get real-time search autocomplete suggestions.

**Query Parameters:**
- `query` (required) - Partial search term

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/suggestions?query=belie"
```

---

#### `GET /youtube/trending`
Get YouTube Music trending charts.

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/trending"
```

---

#### `GET /youtube/playlist/:id`
Get all tracks from a YouTube Music playlist.

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/playlist/PLrEnWoR732-BHrPp_Pm8_VleD68f9s14-"
```

---

#### `GET /youtube/home`
Get YouTube Music home feed.

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/home"
```

---

#### `GET /youtube/explore`
Get YouTube Music explore page (charts, new releases).

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/explore"
```

---

#### `GET /youtube/moods`
Get mood-based playlists (Chill, Focus, Workout, etc.).

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/moods"
```

---

#### `GET /youtube/album/:id`
Get album details and tracks.

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/album/MPREb_fPFjYJYqCMd"
```

---

#### `GET /youtube/artist/:id`
Get artist details and top songs.

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/artist/UCT9zcQNlyht7fRlcjmflRSA"
```

---

#### `GET /youtube/lyrics/:id`
Get song lyrics (if available).

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/lyrics/7wtviwvnS_0"
```

---

#### `GET /youtube/related/:id`
Get related tracks and videos.

**Example:**
```bash
curl "https://your-site.netlify.app/youtube/related/7wtviwvnS_0"
```

---

## 🧪 Local Development

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bloomee_dart_api
```

2. **Install dependencies**
```bash
npm install
```

3. **Run locally with Netlify Dev**
```bash
npm run dev
```

The server will start on `http://localhost:8888`

### Testing Endpoints Locally

```bash
# Test root
curl "http://localhost:8888/"

# Test YouTube search
curl "http://localhost:8888/youtube/search?query=Believer"

# Test JioSaavn search
curl "http://localhost:8888/saavn/search?query=Kesariya"

# Test unified search
curl "http://localhost:8888/search?query=Test"
```

---

## 📦 Project Structure

```
bloomee_dart_api/
├── netlify/
│   └── functions/           # All serverless functions (27 files)
│       ├── index.js         # Root endpoint
│       ├── search.js        # Unified search
│       ├── utils.js         # Shared utilities
│       ├── youtube-*.js     # YouTube endpoints (14 files)
│       └── saavn-*.js       # JioSaavn endpoints (11 files)
├── netlify.toml             # Netlify configuration & redirects
├── package.json             # Node.js dependencies
└── README.md                # This file
```

---

## 🔧 Configuration

### Netlify Configuration (`netlify.toml`)

The `netlify.toml` file contains:
- **Build settings**: Functions directory and publish directory
- **Function settings**: esbuild bundler for optimal performance
- **Redirects**: Clean URL routing (e.g., `/youtube/search` → `/.netlify/functions/youtube-search`)

### CORS
CORS is enabled by default for all origins in `utils.js`. All endpoints support:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

---

## 📝 Response Format

All endpoints return JSON with consistent structure:

### Search/List Endpoints
```json
{
  "items": [ /* array of song objects */ ]
}
```

### Unified Search
```json
{
  "results": [ /* array of song objects from both platforms */ ]
}
```

### Song Object (JioSaavn)
```json
{
  "id": "string",
  "name": "string",
  "title": "string",
  "artist": "string",
  "artistId": "string",
  "singers": "string",
  "album": "string",
  "albumId": "string",
  "duration": "string (seconds)",
  "year": "string",
  "language": "string",
  "image": "string (URL)",
  "explicit": boolean,
  "audioUrl": "string (relative path)",
  "provider": "saavn"
}
```

### Song Object (YouTube)
```json
{
  "id": "string",
  "title": "string",
  "name": "string",
  "artist": "string",
  "artistId": "string",
  "singers": "string",
  "album": "string",
  "albumId": "string",
  "duration": "string (seconds)",
  "year": "string",
  "image": "string (URL)",
  "explicit": boolean,
  "provider": "youtube"
}
```

---

## ⚡ Performance

- **Cold Start**: < 2 seconds (Netlify serverless)
- **Average Response Time**: 300-800ms (search), 100-300ms (metadata)
- **Audio Extraction**: < 1 second (both platforms)
- **Auto-scaling**: Handled by Netlify (unlimited concurrent requests)

---

## 🎯 Use Cases

- **Music Streaming Apps** - Build full-featured music players
- **Music Discovery** - Create recommendation engines
- **Playlist Management** - Sync and manage playlists
- **Audio Analysis** - Extract metadata for ML/AI applications
- **Cross-Platform Search** - Unified search across multiple platforms
- **Mobile Apps** - Perfect for Flutter, React Native, or native apps
- **Web Apps** - CORS-enabled for browser-based applications

---

## 🔒 Legal & Disclaimer

This API is for **educational purposes only**. It interfaces with public APIs and does not host, store, or distribute any copyrighted content. Users are responsible for complying with YouTube's Terms of Service and JioSaavn's Terms of Use.

---

## 📄 License

ISC

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

## 🙏 Acknowledgments

- [Netlify](https://www.netlify.com/) - Serverless platform
- [@distube/ytdl-core](https://www.npmjs.com/package/@distube/ytdl-core) - YouTube extraction library
- [axios](https://www.npmjs.com/package/axios) - HTTP client
- YouTube Music InnerTube API
- JioSaavn API

---

**Built with ❤️ for Netlify Serverless**

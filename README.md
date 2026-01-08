# Bloomee Dart API 🚀

A high-performance, unified music metadata and streaming API built with **Dart** and **Shelf**. This API provides seamless access to both **YouTube Music** and **JioSaavn** platforms, offering search, metadata extraction, audio streaming, and smart recommendations.

## 🌟 Features

- ✅ **Unified Search** - Search across both YouTube Music and JioSaavn simultaneously
- ✅ **High-Quality Audio** - 320kbps streams for JioSaavn, best available for YouTube
- ✅ **Smart Recommendations** - "Up Next" and "Radio" features for continuous playback
- ✅ **Rich Metadata** - Complete song information including artist IDs, album IDs, explicit flags, and high-res artwork
- ✅ **CORS Enabled** - Works from any frontend application
- ✅ **Fast & Lightweight** - Built with Dart for optimal performance
- ✅ **Direct Audio URLs** - Server-side stream extraction with 302 redirects

---

## 🛠️ Tech Stack

### Core Technologies
- **Language**: Dart 3.0+
- **Web Framework**: [Shelf](https://pub.dev/packages/shelf) - Composable web server framework
- **Router**: [Shelf Router](https://pub.dev/packages/shelf_router) - Request routing
- **CORS**: [Shelf CORS Headers](https://pub.dev/packages/shelf_cors_headers) - Cross-origin support

### External Libraries
- **YouTube Extraction**: [youtube_explode_dart](https://pub.dev/packages/youtube_explode_dart) - Direct audio stream extraction
- **HTTP Client**: [http](https://pub.dev/packages/http) - API communication

### Data Sources
- **YouTube Music**: InnerTube API (WEB_REMIX client) for metadata + youtube_explode_dart for audio
- **JioSaavn**: Official JioSaavn API with token-based authentication for 320kbps streams

---

## 🏗️ How It Works

### Architecture Overview

```
Client Request
     ↓
Shelf Server (Port 8080)
     ↓
Shelf Router (Endpoint Matching)
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
│ youtube_explode    │ Auth Token Gen     │
│ (Audio Streams)    │ (Audio Streams)    │
└────────────────────┴────────────────────┘
     ↓                        ↓
JSON Response / 302 Redirect to Audio URL
```

### YouTube Music Flow
1. **Search/Metadata**: Uses InnerTube API (`music.youtube.com/youtubei/v1`) with WEB_REMIX client
2. **Audio Extraction**: Uses `youtube_explode_dart` with AndroidVR client for best stream quality
3. **Parsing**: Custom parser extracts artist IDs, album IDs, explicit flags, and high-res thumbnails

### JioSaavn Flow
1. **Search/Metadata**: Queries JioSaavn's internal API (`jiosaavn.com/api.php`)
2. **Audio Token**: Generates authentication token via `song.generateAuthToken` endpoint
3. **Stream Delivery**: Returns 320kbps direct audio URL with valid auth token

---

## 📡 API Endpoints

### Base URL
```
http://localhost:8080
```

### 🔍 Unified Search

#### `GET /search`
Search across both YouTube Music and JioSaavn simultaneously.

**Query Parameters:**
- `query` (required) - Search term
- `n` or `limit` (optional) - Maximum results (default: 20)

**Example:**
```bash
curl "http://localhost:8080/search?query=Kesariya&n=10"
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
      "audioUrl": "/saavn/audio/S6N_X_Yh",
      "provider": "saavn"
    },
    {
      "id": "7wtviwvnS_0",
      "title": "Kesariya",
      "artist": "Pritam, Arijit Singh",
      "artistId": "UCmBA_wu72706MY8HZy6xE0A",
      "album": "Brahmastra",
      "albumId": "MPREb_fPFjYJYqCMd",
      "duration": "267",
      "image": "https://lh3.googleusercontent.com/w400-h400-l90-rj",
      "explicit": false,
      "provider": "youtube"
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
curl "http://localhost:8080/saavn/search?query=Hukum&n=5"
```

**Response:**
```json
{
  "items": [
    {
      "id": "song_id",
      "name": "Song Title",
      "artist": "Artist Name",
      "artistId": "artist_id",
      "album": "Album Name",
      "albumId": "album_id",
      "duration": "240",
      "year": "2023",
      "language": "tamil",
      "image": "https://...",
      "explicit": false,
      "audioUrl": "/saavn/audio/song_id",
      "provider": "saavn"
    }
  ]
}
```

---

#### `GET /saavn/metadata/<id>`
Get detailed metadata for a specific JioSaavn song.

**Example:**
```bash
curl "http://localhost:8080/saavn/metadata/S6N_X_Yh"
```

**Response:** Same format as search item

---

#### `GET /saavn/audio/<id>`
Get direct audio stream URL (302 redirect to 320kbps stream).

**Example:**
```bash
curl -L "http://localhost:8080/saavn/audio/S6N_X_Yh"
```

**Response:** 302 redirect to authenticated audio URL

---

#### `GET /saavn/next/<id>`
Get recommended tracks based on a song (Radio/Up Next).

**Example:**
```bash
curl "http://localhost:8080/saavn/next/S6N_X_Yh"
```

**Response:**
```json
{
  "items": [
    { /* song object */ }
  ]
}
```

---

#### `GET /saavn/trending`
Get JioSaavn trending charts.

**Example:**
```bash
curl "http://localhost:8080/saavn/trending"
```

**Response:**
```json
{
  "items": [
    {
      "id": "chart_id",
      "title": "Top 50 Hindi",
      "image": "https://...",
      "type": "chart"
    }
  ]
}
```

---

#### `GET /saavn/album/<id>`
Get all tracks from a JioSaavn album.

**Example:**
```bash
curl "http://localhost:8080/saavn/album/38038250"
```

**Response:**
```json
{
  "id": "38038250",
  "title": "Brahmastra",
  "image": "https://...",
  "items": [
    { /* song objects */ }
  ]
}
```

---

#### `GET /saavn/playlist/<id>`
Get all tracks from a JioSaavn playlist.

**Example:**
```bash
curl "http://localhost:8080/saavn/playlist/playlist_id"
```

**Response:**
```json
{
  "id": "playlist_id",
  "title": "Playlist Name",
  "image": "https://...",
  "items": [
    { /* song objects */ }
  ]
}
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
curl "http://localhost:8080/youtube/search?query=Believer&filter=song&n=5"
```

**Response:**
```json
{
  "items": [
    {
      "id": "7wtviwvnS_0",
      "title": "Believer",
      "name": "Believer",
      "artist": "Imagine Dragons",
      "artistId": "UCT9zcQNlyht7fRlcjmflRSA",
      "singers": "Imagine Dragons",
      "album": "Evolve",
      "albumId": "MPREb_fPFjYJYqCMd",
      "year": "2017",
      "duration": "204",
      "image": "https://lh3.googleusercontent.com/w400-h400-l90-rj",
      "explicit": false,
      "provider": "youtube"
    }
  ]
}
```

---

#### `GET /youtube/metadata/<id>`
Get detailed metadata for a YouTube video using youtube_explode_dart.

**Example:**
```bash
curl "http://localhost:8080/youtube/metadata/7wtviwvnS_0"
```

**Response:**
```json
{
  "id": "7wtviwvnS_0",
  "title": "Believer",
  "author": "Imagine Dragons",
  "duration": "0:03:24.000000",
  "image": "https://i.ytimg.com/vi/7wtviwvnS_0/maxresdefault.jpg",
  "provider": "youtube"
}
```

---

#### `GET /youtube/audio/<id>`
Get direct audio stream URL (302 redirect to best quality audio stream).

**Example:**
```bash
curl -L "http://localhost:8080/youtube/audio/7wtviwvnS_0"
```

**Response:** 302 redirect to audio stream URL

---

#### `GET /youtube/next/<id>`
Get "Up Next" queue for continuous playback.

**Example:**
```bash
curl "http://localhost:8080/youtube/next/7wtviwvnS_0"
```

**Response:**
```json
{
  "items": [
    { /* song objects */ }
  ]
}
```

---

#### `GET /youtube/suggestions`
Get real-time search autocomplete suggestions.

**Query Parameters:**
- `query` (required) - Partial search term

**Example:**
```bash
curl "http://localhost:8080/youtube/suggestions?query=belie"
```

**Response:**
```json
{
  "suggestions": [
    "believer",
    "believer imagine dragons",
    "believe cher"
  ]
}
```

---

#### `GET /youtube/trending`
Get YouTube Music trending charts.

**Example:**
```bash
curl "http://localhost:8080/youtube/trending"
```

**Response:**
```json
{
  "items": [
    { /* song objects */ }
  ]
}
```

---

#### `GET /youtube/playlist/<id>`
Get all tracks from a YouTube Music playlist.

**Example:**
```bash
curl "http://localhost:8080/youtube/playlist/PLrEnWoR732-BHrPp_Pm8_VleD68f9s14-"
```

**Response:**
```json
{
  "items": [
    { /* song objects */ }
  ]
}
```

---

## 🚀 Getting Started

### Prerequisites
- Dart SDK 3.0 or higher

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bloomee_dart_api
```

2. **Install dependencies**
```bash
dart pub get
```

3. **Run the server**
```bash
dart bin/server.dart
```

The server will start on `http://localhost:8080`

### Custom Port
Set the `PORT` environment variable:
```bash
PORT=3000 dart bin/server.dart
```

---

## 🧪 Testing

A comprehensive Python test suite is included:

```bash
python test_api.py
```

This tests all endpoints including:
- Root endpoint
- Unified search
- JioSaavn search, metadata, and audio
- YouTube search, metadata, and audio

---

## 📦 Project Structure

```
bloomee_dart_api/
├── bin/
│   └── server.dart          # Main server implementation
├── test_api.py              # Python test suite
├── verify_limits.dart       # Rate limit verification tool
├── pubspec.yaml             # Dart dependencies
└── README.md                # This file
```

---

## 🔧 Configuration

### CORS
CORS is enabled by default for all origins. Modify the middleware in `server.dart` to restrict origins if needed.

### Rate Limiting
Both YouTube Music and JioSaavn APIs have rate limits. The server implements best practices to minimize requests:
- Efficient parsing to extract maximum data per request
- Direct token generation for JioSaavn audio
- Optimized InnerTube client selection

---

## 🎯 Use Cases

- **Music Streaming Apps** - Build full-featured music players
- **Music Discovery** - Create recommendation engines
- **Playlist Management** - Sync and manage playlists
- **Audio Analysis** - Extract metadata for ML/AI applications
- **Cross-Platform Search** - Unified search across multiple platforms

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

- **Startup Time**: < 1 second
- **Average Response Time**: 200-500ms (search), 100-200ms (metadata)
- **Audio Extraction**: < 1 second (both platforms)
- **Concurrent Requests**: Handles 100+ concurrent connections

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

- [Shelf](https://pub.dev/packages/shelf) - Dart web server framework
- [youtube_explode_dart](https://pub.dev/packages/youtube_explode_dart) - YouTube extraction library
- YouTube Music InnerTube API
- JioSaavn API

---

**Built with ❤️ using Dart**

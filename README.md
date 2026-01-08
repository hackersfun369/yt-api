# Bloomee Unified Dart API 🚀

A high-performance music metadata and stream extraction API built with Dart. Designed to power full-featured music applications with YouTube Music and JioSaavn parity.

## 📡 API Endpoints

### 🔍 Search & Suggestions
- **`GET /search?query=...`** - Unified search across YouTube & Saavn.
- **`GET /youtube/suggestions?query=...`** - YouTube Music search autocomplete.
- **`GET /youtube/search?query=...`** - Search YouTube Music only.
- **`GET /saavn/search?query=...`** - Search JioSaavn only.

---

### 🎵 Metadata & Audio
#### JioSaavn
- **`GET /saavn/metadata/:id`** - Detailed metadata for a Saavn PID.
- **`GET /saavn/audio/:id`** - Direct high-quality audio stream redirect.
- **`GET /saavn/album/:id`** - Get all tracks in a Saavn album.
- **`GET /saavn/playlist/:id`** - Get all tracks in a Saavn playlist.

#### YouTube
- **`GET /youtube/metadata/:id`** - Detailed metadata for a YouTube ID.
- **`GET /youtube/audio/:id`** - Direct high-speed audio stream redirect.
- **`GET /youtube/playlist/:id`** - Get all tracks in a YouTube playlist.

---

### 📈 Trending & Discovery
- **`GET /youtube/trending`** - Global YouTube Music charts.
- **`GET /saavn/trending`** - JioSaavn top charts.

---

### ⏭️ Smart Queue (Up Next / Radio)
- **`GET /youtube/next/:videoId`** - Get "Up Next" queue and related tracks for a YouTube song.
- **`GET /saavn/next/:id`** - Get recommended/similar tracks for a Saavn song.

---

## 🚀 Getting Started

```bash
cd bloomee_dart_api
dart pub get
dart run bin/server.dart
```

## 🧠 Mechanisms

- **YouTube**: Powered by InnerTube API orchestration for search, suggestions, and "Up Next" features. Uses `youtube_explode_dart` for optimized stream extraction.
- **JioSaavn**: Directly interfaces with JioSaavn's internal `api.php`. Reconstructs 320kbps streams from preview fragments and manages high-res thumbnails.

## 📄 License
ISC

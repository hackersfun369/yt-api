# Bloomee API - Netlify Serverless Functions

A high-performance music metadata and stream extraction API built with Node.js serverless functions. Designed to power full-featured music applications with YouTube Music and JioSaavn parity.

## 🚀 Quick Deploy to Netlify

### Option 1: Deploy via Netlify UI (Recommended)

1. **Create a GitHub repository**:
   - Go to [GitHub](https://github.com/new)
   - Repository name: `bloomee-api`
   - Make it public
   - Don't initialize with README (we already have one)
   - Click "Create repository"

2. **Push this code to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/bloomee-api.git
   git branch -M main
   git push -u origin main
   ```

3. **Deploy to Netlify**:
   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and authorize
   - Select your `bloomee-api` repository
   - Build settings will be auto-detected from `netlify.toml`
   - Click "Deploy site"

### Option 2: Deploy via Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

## 📡 API Endpoints

All endpoints are available at: `https://YOUR_SITE.netlify.app/.netlify/functions/`

### 🔍 Search & Suggestions
- **`GET /.netlify/functions/search?query=...`** - Unified search across YouTube & Saavn
- **`GET /.netlify/functions/youtube-suggestions?query=...`** - YouTube Music autocomplete
- **`GET /.netlify/functions/youtube-search?query=...`** - Search YouTube Music only
- **`GET /.netlify/functions/saavn-search?query=...`** - Search JioSaavn only

### 🎵 Metadata & Audio

#### JioSaavn
- **`GET /.netlify/functions/saavn-metadata?id=...`** - Detailed metadata
- **`GET /.netlify/functions/saavn-audio?id=...`** - Direct audio stream redirect
- **`GET /.netlify/functions/saavn-album?id=...`** - Album tracks
- **`GET /.netlify/functions/saavn-playlist?id=...`** - Playlist tracks

#### YouTube
- **`GET /.netlify/functions/youtube-metadata?id=...`** - Detailed metadata
- **`GET /.netlify/functions/youtube-audio?id=...`** - Direct audio stream redirect
- **`GET /.netlify/functions/youtube-playlist?id=...`** - Playlist tracks

### 📈 Trending & Discovery
- **`GET /.netlify/functions/youtube-trending`** - Global YouTube Music charts
- **`GET /.netlify/functions/saavn-trending`** - JioSaavn top charts

### ⏭️ Smart Queue (Up Next / Radio)
- **`GET /.netlify/functions/youtube-next?id=...`** - Get "Up Next" queue
- **`GET /.netlify/functions/saavn-next?id=...`** - Get recommended tracks

## 🧠 How It Works

- **YouTube**: Uses `@distube/ytdl-core` for stream extraction and InnerTube API for metadata
- **JioSaavn**: Directly interfaces with JioSaavn's internal API for 320kbps streams

## 🔧 Local Development

```bash
npm install
netlify dev
```

Then access endpoints at: `http://localhost:8888/.netlify/functions/`

## 📝 Environment Variables

No environment variables required! All endpoints work out of the box.

## 🌟 Features

- ✅ **Zero-config deployment** - Just push to GitHub and deploy
- ✅ **Auto-scaling** - Netlify handles all traffic automatically
- ✅ **CORS enabled** - Works from any frontend
- ✅ **Fast cold starts** - Optimized for serverless
- ✅ **High-quality audio** - 320kbps for JioSaavn, best available for YouTube

## 📄 License

ISC

---

**Note**: This is a serverless conversion of the original Dart API. All functionality has been preserved while optimizing for Netlify's serverless platform.

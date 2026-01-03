# Bloomee Tunes Node.js API

A Node.js REST API that replicates the data fetching capabilities of Bloomee Tunes, providing access to music search from JioSaavn and YouTube (via Piped).

## Features

- 🎵 **JioSaavn Integration**: Search for songs, albums, and artists
- 🎬 **YouTube Music Integration**: Search via Piped API (privacy-focused, no API key required)
- 🔄 **Unified Search**: Query multiple sources simultaneously
- 🚀 **Fast & Lightweight**: Built with Express.js
- 🌐 **CORS Enabled**: Ready for frontend integration

## Installation

```bash
npm install
```

## Usage

### Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### 1. Unified Search (Recommended)
Search across both JioSaavn and YouTube simultaneously.

```
GET /search?query=YOUR_QUERY
```

**Example:**
```bash
curl "http://localhost:3000/search?query=believer"
```

**Response:**
```json
{
  "saavn": {
    "songs": { "data": [...] },
    "albums": { "data": [...] },
    "artists": { "data": [...] }
  },
  "youtube": {
    "items": [...]
  }
}
```

### 2. JioSaavn Only

```
GET /saavn/search?query=YOUR_QUERY
```

**Example:**
```bash
curl "http://localhost:3000/saavn/search?query=arijit singh"
```

### 3. YouTube Only

```
GET /youtube/search?query=YOUR_QUERY
```

**Example:**
```bash
curl "http://localhost:3000/youtube/search?query=imagine dragons"
```

## Technical Details

### Data Sources

1. **JioSaavn**: Uses the official JioSaavn web API endpoint
   - Base URL: `https://www.jiosaavn.com/api.php`
   - Returns: Songs, albums, playlists, and artist information

2. **Piped (YouTube)**: Uses Piped API for YouTube data
   - Base URL: `https://pipedapi.kavin.rocks`
   - Benefits: No API key required, privacy-focused, no quotas
   - Filter: `music_songs` for music-specific results

### Architecture

```
bloomee_node_api/
├── index.js          # Main server file with API logic
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

## Dependencies

- **express**: Web framework
- **axios**: HTTP client for API requests
- **cors**: Enable CORS for cross-origin requests

## Environment Variables

- `PORT`: Server port (default: 3000)

## Example Integration

### JavaScript/Fetch
```javascript
fetch('http://localhost:3000/search?query=believer')
  .then(res => res.json())
  .then(data => {
    console.log('Saavn results:', data.saavn);
    console.log('YouTube results:', data.youtube);
  });
```

### PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/search?query=believer"
```

## Notes

- The API does not compromise on result quality - it uses the same data sources as Bloomee Tunes
- No authentication required for basic usage
- Rate limiting is handled by the upstream APIs (JioSaavn and Piped)

## License

ISC

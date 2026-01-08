# Running the Bloomee Node API

## Quick Start

1. **Navigate to the API folder:**
   ```bash
   cd c:\Users\sathy\Downloads\bloomee_tunes_windows_x64_v2.13.3+188\bloomee_node_api
   ```

2. **Start the server:**
   ```bash
   node index.js
   ```

   You should see:
   ```
   Server is running on http://localhost:3000
   ```

3. **Test the API** (in a new terminal):
   ```powershell
   # Test JioSaavn search
   Invoke-RestMethod -Uri "http://localhost:3000/saavn/search?query=kesariya"
   
   # Test YouTube search
   Invoke-RestMethod -Uri "http://localhost:3000/youtube/search?query=believer"
   
   # Test unified search (both sources)
   Invoke-RestMethod -Uri "http://localhost:3000/search?query=imagine%20dragons"
   ```

## Troubleshooting

### Error: "EADDRINUSE: address already in use"
This means the server is already running. You have two options:

**Option 1: Stop the existing server**
- Press `Ctrl+C` in the terminal where the server is running

**Option 2: Find and kill the process**
```powershell
# Find the process using port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Kill the process (replace PID with the actual process ID)
Stop-Process -Id PID -Force
```

## Available Endpoints

- `GET /` - API information
- `GET /search?query=YOUR_QUERY` - Search both JioSaavn and YouTube
- `GET /saavn/search?query=YOUR_QUERY` - Search JioSaavn only
- `GET /youtube/search?query=YOUR_QUERY` - Search YouTube only

## How It Works

The API fetches data from:
1. **JioSaavn** - For Indian music, songs, albums, artists
2. **YouTube** - Via Piped (privacy-focused proxy) with fallback to direct YouTube API

Both sources are the same as used by Bloomee Tunes, ensuring identical result quality.

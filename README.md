# Nirvay YouTube Music API (Pro) 🚀

A high-performance, serverless-ready REST API for YouTube Music data. This API provides official data access including high-quality audio streaming, lyrics, personalized feeds, and more. Optimized for **Netlify Functions** and **Native ES Modules**.

## 🌟 Key Features

- 🎹 **Pro YouTube Music Data**: Official search results, home feeds, charts, and exploration.
- 🎧 **High-Quality Streaming**: Reliable direct audio URL extraction via Android/iOS InnerTube protocols.
- 📜 **Official Lyrics**: Fetch song lyrics directly from YouTube Music.
- 🔄 **Continuous Playback**: Up-Next/Queue suggestions to build a seamless player experience.
- ☁️ **Serverless First**: Fully compatible with Netlify Functions using `esbuild` and `serverless-http`.
- ⚡ **Native ESM**: Built with modern JavaScript (ES Modules) for speed and compatibility.
- 💎 **Adaptive Streaming Engine**: Smart multi-client fallback to bypass restrictions and minimize 400 errors.

---

## 🛡️ Bypassing "Sign in to confirm you're not a bot"

If your API returns a `LOGIN_REQUIRED` error (YouTube Bot detection), follow these steps to authenticate your server:

1.  **Get Cookies**: Install the [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg) extension in your browser.
2.  **Export**: Go to [YouTube Music](https://music.youtube.com), click the extension, and click the **Export** button (it will copy a JSON string to your clipboard).
3.  **Set Environment Variable**:
    - **Local**: Create a `.env` file and set `YT_COOKIES="your_copied_json_string"`.
    - **Netlify**: Go to **Site Settings > Environment Variables** and add a new variable called `YT_COOKIES`.
4.  **Restart**: Redeploy your site. The API will now act as a "logged-in human," bypassing all bot detection.

---

## 🌍 Device Compatibility

This API is a **Universal REST API**. Because it uses standard HTTP and JSON, it works on any device with an internet connection:

- **📱 Mobile Apps**: (Flutter, React Native, Java, Swift) - Perfect for integration.
- **💻 Web Browsers**: (React, Next.js, Vue, Vanilla JS) - CORS is fully enabled.
- **🖥️ Desktop Apps**: (Electron, Python, C#) - Stable and high performance.
- **📺 Smart TVs & IoT**: Any device that can send an HTTP request.

---

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
| `/youtube/player/:videoId` | `GET` | **Hybrid / Pro**: Raw metadata for client-side extraction |
| `/youtube/lyrics/:videoId` | `GET` | Official song lyrics (if available) |
| `/youtube/upnext/:videoId` | `GET` | Continuous queue suggestions (Autoplay) |
| `/youtube/related/:videoId` | `GET` | Related tracks and videos |

### 4. Metadata
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/youtube/artist/:id` | `GET` | Full artist profile, albums, and top songs |
| `/youtube/album/:id` | `GET` | Full tracklist for any album/EP |
| `/youtube/playlist/:id` | `GET` | Content of any public playlist |

---

## 💎 Universal Hybrid Mode (Any Device)

For professional applications (**Mobile, Web, Desktop**), use `/youtube/player/:videoId` to get raw metadata. This allows your client application to bypass server-side IP restrictions and achieve zero latency.

### 🌐 Platforms Supported:
- **📱 Mobile (Flutter/RN/Native)**: Direct deciphering using local libraries.
- **🖥️ Desktop (Electron/WPF/Qt)**: High-performance local extraction.
- **💻 Web Browsers (React/Vue/JS)**: Works via standard browser `fetch` (CORS enabled).
- **📺 Smart TVs & IoT**: Universal JSON support for any hardware.

### 🔄 The Universal Workflow
1.  **Search**: Use the API to find songs.
2.  **Request DNA**: Call `/youtube/player/:videoId` to get raw `streamingData` and `playerUrl`.
3.  **Local Decipher**: Run the `playerUrl` logic on the device to unlock high-quality audio.

**Benefits**: By doing this, you eliminate **100% of 400 errors** because the request comes from the user's local IP, not a server.

### 🛠️ Client Implementation Example (JavaScript)
```javascript
async function getProAudioUrl(videoId) {
    const response = await fetch(`https://your-api.netlify.app/youtube/player/${videoId}`);
    const { streamingData, playerUrl } = await response.json();
    const format = streamingData.adaptiveFormats.find(f => f.mimeType.includes('audio'));
    
    if (format.url) return format.url;
    // Decipher format.signatureCipher using logic from playerUrl...
}
```

---

## ⚙️ Technical Architecture

This project implements several advanced logic patterns to ensure reliability on serverless platforms:

### 1. Native ES Modules (ESM)
The entire project uses `"type": "module"`. This allows for faster loading times and compatibility with the latest versions of modern libraries like `youtubei.js`.

### 2. Adaptive Streaming Engine
The `/stream/youtube` endpoint uses a **Multi-Client Rotation** logic. If a request fails due to a `400 Bad Request` (common on cloud IPs), the engine automatically retries with a different client identity:
- **IOS**: Highly stable for official music tracks.
- **WEB_REMIX**: Optimized for YouTube Music web data.
- **TV_EMBED**: Powerful for bypassing embed restrictions.
- **ANDROID**: General fallback.

### 3. Dynamic Initialization
To solve "Cold Start" issues in serverless functions, the `getYT()` function implements a singleton pattern that lazily initializes the YouTube client only when first needed, ensuring the function doesn't time out during startup.

### 4. Metadata Flattening
The `/youtube/songs` endpoint implements a custom transformer that maps complex, deeply nested InnerTube objects into a flat, developer-friendly JSON structure (ID, Name, Singers, Album, Duration, Image).

---

## 📦 Deployment

### Netlify Deployment
1.  Push your repository to GitHub.
2.  Connect the repository to Netlify.
3.  **Environment Variables**: Ensure `NODE_VERSION` is set to `18` or higher.
4.  The `netlify.toml` automatically configures `esbuild` for optimal function bundling.

### Local Development
```bash
npm install
npm start
```
Server runs on `http://localhost:3000`.

## 📂 Project Structure
- `index.js`: Main API logic & Express setup.
- `functions/api.js`: Netlify serverless entry point.
- `netlify.toml`: Deployment and `esbuild` configurations.
- `package.json`: Dependency and engine settings.

## 📝 License
ISC

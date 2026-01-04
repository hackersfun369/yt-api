# Zero-Config Hybrid Extraction Guide 🚀

The API now supports a **Zero-Config Hybrid Model**. This allows your client application (Mobile/Desktop) to perform its own extraction without being blocked by YouTube's server-side bot detection.

## 📡 The `/youtube/player/:videoId` Endpoint

This endpoint now acts as a **Metadata Broker**. It provides the "raw ingredients" your app needs to cook the "audio soup" locally.

### 📦 Response Structure

```json
{
  "videoId": "Kc0Nk5KpnvI",
  "playerUrl": "https://www.youtube.com/s/player/...",
  "signatureTimestamp": 19782,
  "handshake": {
    "visitorData": "Cgt...",
    "clientName": "WEB",
    "clientVersion": "2.20240210.01.00",
    "userAgent": "Mozilla/5.0..."
  },
  "rawInfo": { ... } // Full YouTube inner response
}
```

## 🛠️ How to Implement in Your App

### Step 1: Fetch the Metadata
Call your API from your app:
```javascript
const response = await fetch('https://your-api.netlify.app/youtube/player/Kc0Nk5KpnvI');
const data = await response.json();
```

### Step 2: Extract the Audio (The "Magic" Step)
Since the API gives you the **Player URL** and **Timestamp**, you can use them to decipher the signature locally.

**If using `youtubei.js` on the client:**
```javascript
// Initialize with the handshake data from the API
const yt = await Innertube.create({
    visitor_data: data.handshake.visitorData,
    retrieve_player: false // Don't download player, use the URL we have
});

// Decipher using the provided player URL
const url = await yt.session.player.decipher(data.rawInfo.streaming_data.adaptiveFormats[0].signatureCipher);
```

**If using a custom extractor:**
1.  Download the JS at `data.playerUrl`.
2.  Run the decipher function found in that JS.
3.  Use `data.signatureTimestamp` as the `sts` parameter.

## 🎯 Benefits
1.  **Zero-Config**: The user doesn't need to log in or set cookies.
2.  **Unblockable**: The download happens on the **User's IP**, which is trusted by YouTube.
3.  **Fast**: The server does the heavy lifting of finding the video, and the client just does the final "handshake."

# Client-Side Extraction Guide (Pro Mode) 🎧

This guide explains how to use the `/youtube/player/:videoId` endpoint to perform **Client-Side Deciphering**. This is the method used by professional music apps to achieve zero-latency and bypass server blocking.

## 🔄 The Workflow

1.  **Call API**: Get metadata from `https://your-api.netlify.app/youtube/player/VIDEO_ID`.
2.  **Fetch Player**: Download the JavaScript file from the `playerUrl` provided by the API.
3.  **Decipher**: Use the `base.js` logic to unscramble the `signatureCipher` found in `streamingData`.
4.  **Play**: Pass the resulting URL to your player (ExoPlayer, AVPlayer, Howler.js, etc.).

---

## 🛠️ JavaScript Implementation Example

If you are using **JavaScript** (React Native, Capacitor, or Web), here is a simplified logic:

```javascript
async function getProAudioUrl(videoId) {
    // 1. Get Metadata from your API
    const response = await fetch(`https://your-api.netlify.app/youtube/player/${videoId}`);
    const { streamingData, playerUrl } = await response.json();

    // 2. Find the best audio format
    const format = streamingData.adaptiveFormats
        .filter(f => f.mimeType.includes('audio'))
        .sort((a, b) => b.bitrate - a.bitrate)[0];

    // 3. If the URL is already there, we are done!
    if (format.url) return format.url;

    // 4. Deciphering (The "Math")
    // Note: In a real app, you should use a library like 'youtubei.js' (web version) 
    // or a specialized deciphering script to handle the signatureCipher.
    console.log("Downloading decryption logic from:", playerUrl);
    
    // Most developers use a specialized library to run the actual math
    // Example (Conceptual): Result = DecipherLib.solve(format.signatureCipher, playerUrl);
}
```

## 📦 Recommended Client Libraries

Don't write the deciphering logic from scratch! Use these proven libraries:

| Platform | Recommended Library |
| :--- | :--- |
| **Flutter** | [youtube_explode_dart](https://pub.dev/packages/youtube_explode_dart) |
| **React Native** | [react-native-nodify](https://github.com/tradle/react-native-nodify) + `youtubei.js` |
| **Android (Java/Kotlin)** | [NewPipeExtractor](https://github.com/TeamNewPipe/NewPipeExtractor) |
| **iOS (Swift)** | [YouTubeKit](https://github.com/alextuduran/YouTubeKit) |

## 💡 Why use the API at all?
Your Node.js API handles the **Search**, **Lyrics**, **Artists**, and **Home Feed** (which are hard to do on mobile). The App only handles the **final URL click**. This "Hybrid" model is the most efficient architecture possible.

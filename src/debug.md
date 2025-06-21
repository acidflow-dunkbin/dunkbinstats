---
title: Debug
---

<link href="custom.css" rel="stylesheet"></link>

<h1 id="cosmeticsTitle" class="acid-title bartender-heading-decrypted acidTitleCosmetic">Debug</h1>

```js
import { initializeTitleAnimation } from "./components/shared/titleAnimation.js";
import { wuoteLogo } from "./components/shared/wuoteLogo.js";
import { topArtistsPlot } from "./components/cosmetics/topArtistsPlot.js";
import { cosmeticLayerPopularityPlot } from "./components/cosmetics/cosmeticLayerPopularityPlot.js";
import { mostPopularCosmeticsPlot } from "./components/cosmetics/mostPopularCosmeticsPlot.js";
import { topExpensiveCosmeticsPlot } from "./components/cosmetics/topExpensiveCosmeticsPlot.js";
import JSZip from "jszip";

initializeTitleAnimation();
```

```js
const backpacksZip = await FileAttachment("./data/backpacks.zip").zip();
const backpacks = await backpacksZip.file("backpacks.json").json();
const cosmeticsZip = await FileAttachment("./data/cosmetics.zip").zip();
const cosmetics = await cosmeticsZip.file("cosmetics.json").json();
const usersZip = await FileAttachment("./data/users.zip").zip();
const user_stats = await usersZip.file("users.json").json();
const buildDate = await FileAttachment("./data/buildDate.json").json();
```

```js
const buildTimestamp = new Date(buildDate.build_timestamp);
```

<h6 id="cosmeticsTitle">Built at: ${buildTimestamp.toLocaleString()}</h6>

```js
// Create an object to store all debug info
const debugInfo = {
  pfpMapping: { users: {} },
  pfpMappingResponse: null,
  pfpMappingZip: null,
  pfpMapFile: null,
  pfpMappingText: null,
  error: null,
};

try {
  console.log("Starting fetch...");
  debugInfo.pfpMappingResponse = await fetch("https://dunkbinstats-users-images.acidflow.stream/pfp_map.zip");
  console.log("Fetch completed:", debugInfo.pfpMappingResponse.status);

  if (!debugInfo.pfpMappingResponse.ok) {
    throw new Error(`HTTP error! status: ${debugInfo.pfpMappingResponse.status}`);
  }

  console.log("Converting to array buffer...");
  const pfpMappingArrayBuffer = await debugInfo.pfpMappingResponse.arrayBuffer();
  console.log("Array buffer size:", pfpMappingArrayBuffer.byteLength);

  console.log("Loading ZIP...");
  debugInfo.pfpMappingZip = await JSZip.loadAsync(pfpMappingArrayBuffer);
  console.log("ZIP loaded, files:", Object.keys(debugInfo.pfpMappingZip.files));

  debugInfo.pfpMapFile = debugInfo.pfpMappingZip.file("pfp_map.json");
  console.log("File found:", !!debugInfo.pfpMapFile);

  if (debugInfo.pfpMapFile) {
    console.log("Reading file content...");
    debugInfo.pfpMappingText = await debugInfo.pfpMapFile.async("text");
    console.log("Content length:", debugInfo.pfpMappingText.length);
    console.log("First 200 chars:", debugInfo.pfpMappingText.substring(0, 200));

    debugInfo.pfpMapping = JSON.parse(debugInfo.pfpMappingText);
    console.log("Parsed JSON, user count:", Object.keys(debugInfo.pfpMapping.users || {}).length);
  } else {
    console.warn("pfp_map.json not found in ZIP file");
    debugInfo.error = "pfp_map.json not found in ZIP file";
  }
} catch (error) {
  console.error("Failed to load PFP mapping:", error);
  debugInfo.error = error.toString();
}

debugInfo;
```

<div><h6>Status</h6>${debugInfo.pfpMappingResponse ? debugInfo.pfpMappingResponse.status : 'No response'}</div><br />
<div><h6>Error</h6>${debugInfo.error || 'None'}</div><br />
<div><h6>ZIP Files</h6>${debugInfo.pfpMappingZip ? Object.keys(debugInfo.pfpMappingZip.files).join(', ') : 'No ZIP loaded'}</div><br />
<div><h6>File Found</h6>${debugInfo.pfpMapFile ? 'Yes' : 'No'}</div><br />
<div><h6>Content Length</h6>${debugInfo.pfpMappingText ? debugInfo.pfpMappingText.length : 'No content'}</div><br />
<div><h6>User Count</h6>${Object.keys(debugInfo.pfpMapping.users || {}).length}</div><br />
<div><h6>Sample Users</h6>${Object.keys(debugInfo.pfpMapping.users || {}).slice(0, 5).join(', ')}</div><br />

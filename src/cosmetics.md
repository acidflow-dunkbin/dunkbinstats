---
title: Cosmetics
---

<link href="custom.css" rel="stylesheet"></link>

<h1 id="cosmeticsTitle" class="acid-title bartender-heading-decrypted acidTitleCosmetic">Cosmetics</h1>
<h6 id="cosmeticsTitle">Built at: ${buildTimestamp.toLocaleString()}</h6>

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
// Load remote PFP mapping
let pfpMapping = { users: {} };

try {
  const pfpMappingResponse = await fetch("https://dunkbinstats-users-images.acidflow.stream/pfp_map.zip");

  if (pfpMappingResponse.ok) {
    const pfpMappingArrayBuffer = await pfpMappingResponse.arrayBuffer();
    const pfpMappingZip = await JSZip.loadAsync(pfpMappingArrayBuffer);
    const pfpMapFile = pfpMappingZip.file("pfp_map.json");

    if (pfpMapFile) {
      const pfpMappingText = await pfpMapFile.async("text");
      pfpMapping = JSON.parse(pfpMappingText);
    }
  }
} catch (error) {
  console.error("Failed to load PFP mapping:", error);
}
```

```js
const buildTimestamp = new Date(buildDate.build_timestamp);
```

```js
// Helper function to get PFP filename from mapping
function getPfpFilename(userId) {
  if (!userId || !pfpMapping.users || !pfpMapping.users[userId]) {
    return "no_image_available.png";
  }
  return pfpMapping.users[userId].pfp_filename || "no_image_available.png";
}
```

```js
cosmetics.forEach((cosmetic) => {
  // Use the PFP mapping to get the correct filename - NOTE: using 'author' not 'author_id'
  const pfpFilename = getPfpFilename(cosmetic.author);

  cosmetic.combinedArtistName = {
    artistName: cosmetic.author_name,
    portrait_url: `https://dunkbinstats-users-images.acidflow.stream/users_pfps/${pfpFilename}`,
    ...(cosmetic.author_name !== "Unknown" && {
      twitch_url: `https://twitch.tv/${cosmetic.author_name.toLowerCase()}`,
    }),
  };
  cosmetic.combinedCosmeticName = {
    name: cosmetic.name,
    id: cosmetic.id,
    dunkbin_url: `https://dunkbin.com/shop?items=${cosmetic.id}`,
  };
});
```

<!-- Rest of your cosmetics page content goes here -->

```js
const cosmeticsSearch = Inputs.search(cosmetics, {
  placeholder: "Search cosmetics",
  query: "",
  autocomplete: true,
});
```

```js
const cosmeticsSearchValue = Generators.input(cosmeticsSearch);
```

```js
const cosmeticsTable = Inputs.table(cosmeticsSearchValue, {
  columns: ["combinedCosmeticName", "combinedArtistName", "layer_name", "price", "total_owned", "unique_owners"],
  header: {
    combinedCosmeticName: "Cosmetic",
    combinedArtistName: "Artist",
    layer_name: "Layer",
    price: "Price💧",
    total_owned: "Total Owned",
    unique_owners: "Unique Owners",
  },
  format: {
    price: (d) => `${d.toLocaleString()}💧`,
    combinedArtistName: (d) => {
      const content = htl.html`<div style="display: flex; align-items: center; gap: 8px;"><img src="${d.portrait_url}" width="32" height="32" style="image-rendering:pixelated; flex-shrink: 0;" onerror="this.src='https://dunkbinstats-users-images.acidflow.stream/users_pfps/no_image_available.png'" /><span style="white-space: nowrap;">${d.artistName}</span></div>`;
      return d.twitch_url ? htl.html`<a href="${d.twitch_url}" target="_blank">${content}</a>` : content;
    },
    combinedCosmeticName: (d) => htl.html`<a href="${d.dunkbin_url}" target="_blank">${d.name}</a>`,
  },
});
```

<div class="card" style="padding: 0; overflow: hidden;">
  ${cosmeticsTable}
</div>

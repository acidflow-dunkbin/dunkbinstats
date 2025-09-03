---
title: Cosmetics
---

<link href="custom.css" rel="stylesheet"></link>

<h1 id="cosmeticsTitle" class="acid-title bartender-heading-decrypted acidTitleCosmetic">Cosmetics</h1>
<h6 id="cosmeticsTitle">Last updated: ${buildTimestamp.toLocaleString()}</h6>

```js
import { initializeTitleAnimation } from "./components/shared/titleAnimation.js";
import { wuoteLogo } from "./components/shared/wuoteLogo.js";
import { topArtistsPlot } from "./components/cosmetics/topArtistsPlot.js";
import { cosmeticLayerPopularityPlot } from "./components/cosmetics/cosmeticLayerPopularityPlot.js";
import { mostPopularCosmeticsPlot } from "./components/cosmetics/mostPopularCosmeticsPlot.js";
import { topExpensiveCosmeticsPlot } from "./components/cosmetics/topExpensiveCosmeticsPlot.js";
import { cosmeticPricesOverTimePlot } from "./components/cosmetics/cosmeticPricesOverTimePlot.js";
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
const cosmeticDates = await FileAttachment("./data/cosmetics/cosmetic_dates.csv").csv({ typed: true });
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
  // Use the PFP mapping to get the correct filename - using 'author' which contains the user ID
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

```js
const totalSweatSpent = backpacks.reduce((sum, d) => {
  const price = Number(d.item_price);
  const qty = Number(d.quantity) || 1;
  return sum + (isNaN(price) ? 0 : price * qty);
}, 0);
```

```js
const totalUniqueCosmetics = cosmetics.length;
const totalArtists = new Set(
  cosmetics.filter((d) => d.author_name && d.author_name !== "Unknown").map((d) => d.author_name)
).size;
const avgCosmeticPrice = d3.mean(
  cosmetics.filter((d) => d.price > 0),
  (d) => d.price
);
```

```js
const cosmeticsSearch = Inputs.search(cosmetics, {
  placeholder: "Search cosmetics and artists…",
  query: "",
  autocomplete: true,
});
```

```js
const cosmeticsSearchValue = Generators.input(cosmeticsSearch);
```

```js
const resetSearchButton = Inputs.button(
  htl.html`<img src="https://noita-bartender-images.acidflow.stream/images/icons/arrow-counterclockwise.svg" />Reset`,
  {
    label: "",
    reduce: () => {
      cosmeticsSearch.query = "";
      cosmeticsSearch.dispatchEvent(new Event("input"));
      sweatlingSizeSelectorInput.value = 116;
      sweatlingSizeSelectorInput.dispatchEvent(new Event("input"));
      return null;
    },
  }
);
```

```js
const sweatlingSizeSelectorInput = Inputs.range([21, 210], {
  label: "Art size",
  step: 1,
  value: 116,
});
```

```js
const sweatlingSizeSelectorInputValue = Generators.input(sweatlingSizeSelectorInput);
```

```js
const cosmeticsTable = Inputs.table(cosmeticsSearchValue, {
  width: {
    image: sweatlingSizeSelectorInputValue,
    name: 200,
    layer_name: 70,
    combinedArtistName: 150,
  },
  align: {
    image: "center",
    author_pfp: "right",
    author_name: "left",
    price: "right",
    total_owned: "right",
    unique_owners: "right",
    total_market_value: "right",
    id: "right",
  },
  sort: "id",
  reverse: true,
  select: false,
  multiple: false,
  rows: 14,
  columns: [
    "image",
    "combinedCosmeticName",
    "layer_name",
    "combinedArtistName",
    "price",
    "total_owned",
    "unique_owners",
    "total_market_value",
    "id",
  ],
  header: {
    image: "Art",
    combinedCosmeticName: "Name",
    layer_name: "Layer",
    combinedArtistName: "Artist",
    price: "Price💧",
    total_owned: "Owned total",
    unique_owners: "# Of owners",
    total_market_value: "Spent💧",
    id: "ID",
  },
  format: {
    combinedCosmeticName: (d) =>
      htl.html`<a href="https://dunkbin.com/shop?items=${d.id}" target="_blank" rel="noopener noreferrer" >${d.name}</a>`,
    price: (d) => `${d.toLocaleString()}💧`,
    total_market_value: (d) => `${d.toLocaleString()}💧`,
    image: (d) =>
      htl.html`<div style="position: relative; width: ${sweatlingSizeSelectorInputValue}px; height: ${sweatlingSizeSelectorInputValue}px; overflow: hidden;">
          <img src="http://dunkbinstats-images.acidflow.stream/img/sweatling.png" width=${sweatlingSizeSelectorInputValue} height=${sweatlingSizeSelectorInputValue} style="image-rendering: pixelated; position: absolute; top: 0; left: 0;" />
          <img src="http://dunkbinstats-images.acidflow.stream/img/${d}" width=${sweatlingSizeSelectorInputValue} height=${sweatlingSizeSelectorInputValue} style="image-rendering: pixelated; position: absolute; top: 0; left: 0;" />
        </div>`,
    combinedArtistName: (d) => {
      const content = htl.html`<div style="width: ${sweatlingSizeSelectorInputValue / 3}px; height: ${
        sweatlingSizeSelectorInputValue / 3
      }px; display: flex; align-items: center; gap: 8px; min-width: fit-content;">
        <img src="${d.portrait_url}"
          width=${sweatlingSizeSelectorInputValue / 3}
          height=${sweatlingSizeSelectorInputValue / 3}
          style="image-rendering:pixelated; flex-shrink: 0;" 
          onerror="this.src='https://dunkbinstats-users-images.acidflow.stream/users_pfps/no_image_available.png'" />
        <span style="white-space: nowrap; color: currentColor;">${d.artistName}</span>
      </div>`;
      return d.twitch_url ? htl.html`<a href="${d.twitch_url}">${content}</a>` : content;
    },
  },
});
```

<!-- Key Metrics Overview -->
<div class="grid grid-cols-4" style="grid-auto-rows: auto; margin-bottom: 2rem;">
  <div class="card" style="text-align: center; padding: 1.5rem;">
    <div class="big">${totalUniqueCosmetics.toLocaleString()}</div>
    <div>Unique cosmetics available</div>
  </div>
  <div class="card" style="text-align: center; padding: 1.5rem;">
    <div class="big">${totalArtists.toLocaleString()}</div>
    <div>Active artists</div>
  </div>
  <div class="card" style="text-align: center; padding: 1.5rem;">
    <div class="big">${avgCosmeticPrice?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}&#8288;💧</div>
    <div>Average cosmetic price</div>
  </div>
  <div class="card" style="text-align: center; padding: 1.5rem;">
    <div class="big">${totalSweatSpent.toLocaleString()}&#8288;💧</div>
    <div>Total sweat spent</div>
  </div>
</div>

<!-- Responsive Charts Section -->
<div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
  <div class="card">
    <h2>Top 15 cosmetic artists</h2>
    ${resize((width) => topArtistsPlot(cosmetics, width))}
  </div>
  <div class="card">
    <h2>Top 15 most owned cosmetics</h2>
    ${resize((width) => mostPopularCosmeticsPlot(backpacks, width))}
  </div>
</div>

<div class="card" style="margin-bottom: 2rem;">
  <h2>Cosmetic Prices Over Time</h2>
  <h3>Note: Historical data incomplete. Dates estimated. Prices shown are current values only</h3>
  ${resize((width) => cosmeticPricesOverTimePlot(cosmetics, cosmeticDates, width))}
</div>

<div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
  <div class="card">
    <h2>Top 15 most expensive cosmetics</h2>
    ${resize((width) => topExpensiveCosmeticsPlot(cosmetics, width))}
  </div>
  <div class="card">
    <h2>Cosmetics by layer</h2>
    ${resize((width) => cosmeticLayerPopularityPlot(cosmetics, width))}
  </div>
</div>



<div class="card" style="margin-bottom: 1rem;">
  <h2>Cosmetic Search & Browse</h2>
  <div style="display: flex; gap: 1rem; align-items: flex-end; margin-bottom: 1rem; flex-wrap: wrap;">
    <div style="min-width: 200px;">
      ${cosmeticsSearch}
    </div>
    <div>
      ${resetSearchButton}
    </div>
  </div>
</div>

<div class="card" style="padding: 0; overflow: hidden;">
  <h2 style="margin-left: 1rem; margin-top: 1rem; margin-bottom: 1rem;">${sweatlingSizeSelectorInput}</h2>
  ${cosmeticsTable}
</div>

---
title: Backpacks
---

<link href="custom.css" rel="stylesheet"></link>

<h1 id="backpacksTitle" class="acid-title bartender-heading-decrypted">Backpacks</h1>

```js
import { wuoteLogo } from "./components/shared/wuoteLogo.js";
import { initializeTitleAnimation } from "./components/shared/titleAnimation.js";
import { topCompletionistsPlot } from "./components/backpacks/topCompletionistsPlot.js";
import { collectionCompletenessPlot } from "./components/backpacks/collectionCompletenessPlot.js";
import { topSpendersPlot } from "./components/backpacks/topSpendersPlot.js";
import JSZip from "jszip";

initializeTitleAnimation();

const backpacksZip = await FileAttachment("./data/backpacks.zip").zip();
const backpacks = await backpacksZip.file("backpacks.json").json();
const cosmeticsZip = await FileAttachment("./data/cosmetics.zip").zip();
const cosmetics = await cosmeticsZip.file("cosmetics.json").json();
const usersZip = await FileAttachment("./data/users.zip").zip();
const user_stats = await usersZip.file("users.json").json();
const buildDate = await FileAttachment("./data/buildDate.json").json();

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

<h6 id="cosmeticsTitle">Built at: ${buildTimestamp.toLocaleString()}</h6>

```js
const totalUniqueItems = cosmetics.length;
const totalUsers = user_stats.length;
const avgCompletionRate = d3.mean(user_stats, (d) => d.collection_completion_percentage);
```

```js
const totalSweatSpent = backpacks.reduce((sum, d) => {
  const price = Number(d.item_price);
  const qty = Number(d.quantity) || 1;
  return sum + (isNaN(price) ? 0 : price * qty);
}, 0);
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
const usersSearch = Inputs.search(user_stats, {
  placeholder: "Search dunkbin users",
  query: "",
  autocomplete: true,
});
```

```js
user_stats.forEach((user) => {
  // Use the PFP mapping to get the correct filename
  const pfpFilename = getPfpFilename(user.id);

  user.combinedUserName = {
    twitchUsername: user.display_name,
    portrait_url: `https://dunkbinstats-users-images.acidflow.stream/users_pfps/${pfpFilename}`,
    ...(user.login && {
      twitch_url: `https://twitch.tv/${user.login}`,
    }),
  };
});
```

```js
const usersSearchValue = Generators.input(usersSearch);
```

```js
const resetSearchButton = Inputs.button(
  htl.html`<img src="https://noita-bartender-images.acidflow.stream/images/icons/arrow-counterclockwise.svg" />Reset`,
  {
    label: "",
    reduce: () => {
      usersSearch.query = "";
      usersSearch.dispatchEvent(new Event("input"));
      return null;
    },
  }
);
```

```js
const usersTable = Inputs.table(usersSearchValue, {
  width: {
    combinedUserName: 200,
  },
  align: {
    combinedUserName: "left",
  },
  sort: "collection_completion_percentage",
  reverse: true,
  select: false,
  multiple: false,
  columns: [
    "combinedUserName",
    "total_items_owned",
    "unique_items_owned",
    "total_items_cost",
    "unique_items_cost",
    "collection_completion_percentage",
  ],
  header: {
    combinedUserName: "Name",
    total_items_owned: "Cosmetics owned",
    unique_items_owned: "Unique owned",
    total_items_cost: "Total value💧",
    unique_items_cost: "Unique value💧",
    collection_completion_percentage: "Collection fullness",
  },
  format: {
    total_items_cost: (d) => `${d.toLocaleString()}💧`,
    unique_items_cost: (d) => `${d.toLocaleString()}💧`,
    combinedUserName: (d) => {
      const content = htl.html`<div style="display: flex; align-items: center; gap: 8px;"><img src="${d.portrait_url}" width="48" height="48" style="image-rendering:pixelated; flex-shrink: 0;" onerror="this.src='https://dunkbinstats-users-images.acidflow.stream/users_pfps/no_image_available.png'" /><span style="white-space: nowrap;">${d.twitchUsername}</span></div>`;
      return d.twitch_url ? htl.html`<a href="${d.twitch_url}" target="_blank">${content}</a>` : content;
    },
    collection_completion_percentage: (d) => `${d}%`,
  },
});
```

<!-- Key Metrics Overview -->
<div class="grid grid-cols-4" style="grid-auto-rows: auto; margin-bottom: 2rem;">
  <div class="card" style="text-align: center; padding: 1.5rem;">
    <div class="big">${totalUniqueItems.toLocaleString()}</div>
    <div>Unique cosmetics available</div>
  </div>
  <div class="card" style="text-align: center; padding: 1.5rem;">
    <div class="big">${totalUsers.toLocaleString()}</div>
    <div>Total collectors</div>
  </div>
  <div class="card" style="text-align: center; padding: 1.5rem;">
    <div class="big">${avgCompletionRate?.toFixed(1)}%</div>
    <div>Average collection completion</div>
  </div>
  <div class="card" style="text-align: center; padding: 1.5rem;">
    <div class="big">${totalSweatSpent?.toLocaleString()}&#8288;💧</div>
    <div>Total sweat spent</div>
  </div>
</div>

<!-- Responsive Charts Section -->
<div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
  <div class="card">
    <h2>Top 15 most complete collections</h2>
    ${resize((width) => topCompletionistsPlot(user_stats, width))}
  </div>
  <div class="card" style="margin-bottom: 2rem;">
  <h2>Top 15 big spenders</h2>
  ${resize((width) => topSpendersPlot(user_stats, width))}
</div>
  
</div>
<div class="card">
    <h2>Collection completeness distribution</h2>
    ${resize((width) => collectionCompletenessPlot(user_stats, width))}
  </div>

<div class="card" style="margin-bottom: 1rem;">
  <h2>User Search & Statistics</h2>
  <div style="display: flex; gap: 1rem; align-items: flex-end; margin-bottom: 1rem; flex-wrap: wrap;">
    <div style="min-width: 200px;">
      ${usersSearch}
    </div>
    <div>
      ${resetSearchButton}
    </div>
  </div>
</div>

<div class="card" style="padding: 0; overflow: hidden;">
  ${usersTable}
</div>

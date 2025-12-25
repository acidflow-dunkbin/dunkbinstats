---
title: Bets
---

<link href="custom.css" rel="stylesheet"></link>

<h1 id="betsTitle" class="acid-title bartender-heading-decrypted acidTitleCosmetic">Bets</h1>
<h6 id="betsTitle">Last compiled: ${buildTimestamp.toLocaleString()}</h6>

```js
import { initializeTitleAnimation } from "./components/shared/titleAnimation.js";
import { wuoteLogo } from "./components/shared/wuoteLogo.js";
import { categoriesPlot } from "./components/bets/categoriesPlot.js";
import { dateDurationPlot } from "./components/bets/dateDurationPlot.js";
import JSZip from "jszip";

initializeTitleAnimation();
```

```js
const buildDate = await FileAttachment("./data/buildDate.json").json();
const bets = await FileAttachment("./data/bets.csv").csv({ typed: true });
```

## Bet results for the time period between August 2024 and December 2025

```js
const buildTimestamp = new Date(buildDate.build_timestamp);
```

```js
const distinctBets =
  bets && bets.length > 0 ? [...new Set(bets.filter((b) => b.title !== null).map((b) => b.title))] : [];
```

```js
const distinctCategories =
  bets && bets.length > 0 ? [...new Set(bets.filter((b) => b.category !== null).map((b) => b.category))] : [];
```

```js
const betsTable = Inputs.table(bets);
```

```js
// Reuse the table formatting I've come up with for other pages

// , {
//   width: {
//     image: sweatlingSizeSelectorInputValue,
//     name: 200,
//     layer_name: 70,
//     combinedArtistName: 150,
//   },
//   align: {
//     image: "center",
//     author_pfp: "right",
//     author_name: "left",
//     price: "right",
//     total_owned: "right",
//     unique_owners: "right",
//     total_market_value: "right",
//     id: "right",
//   },
//   sort: "id",
//   reverse: true,
//   select: false,
//   multiple: false,
//   rows: 14,
//   columns: [
//     "image",
//     "combinedCosmeticName",
//     "layer_name",
//     "combinedArtistName",
//     "price",
//     "total_owned",
//     "unique_owners",
//     "total_market_value",
//     "id",
//   ],
//   header: {
//     image: "Art",
//     combinedCosmeticName: "Name",
//     layer_name: "Layer",
//     combinedArtistName: "Artist",
//     price: "Price💧",
//     total_owned: "Owned total",
//     unique_owners: "# Of owners",
//     total_market_value: "Spent💧",
//     id: "ID",
//   },
//   format: {
//     combinedCosmeticName: (d) =>
//       htl.html`<a href="https://dunkbin.com/shop?items=${d.id}" target="_blank" rel="noopener noreferrer" >${d.name}</a>`,
//     price: (d) => `${d.toLocaleString()}💧`,
//     total_market_value: (d) => `${d.toLocaleString()}💧`,
//     image: (d) =>
//       htl.html`<div style="position: relative; width: ${sweatlingSizeSelectorInputValue}px; height: ${sweatlingSizeSelectorInputValue}px; overflow: hidden;">
//           <img src="http://dunkbinstats-images.acidflow.stream/img/sweatling.png" width=${sweatlingSizeSelectorInputValue} height=${sweatlingSizeSelectorInputValue} style="image-rendering: pixelated; position: absolute; top: 0; left: 0;" />
//           <img src="http://dunkbinstats-images.acidflow.stream/img/${d}" width=${sweatlingSizeSelectorInputValue} height=${sweatlingSizeSelectorInputValue} style="image-rendering: pixelated; position: absolute; top: 0; left: 0;" />
//         </div>`,
//     combinedArtistName: (d) => {
//       const content = htl.html`<div style="width: ${sweatlingSizeSelectorInputValue / 3}px; height: ${
//         sweatlingSizeSelectorInputValue / 3
//       }px; display: flex; align-items: center; gap: 8px; min-width: fit-content;">
//         <img src="${d.portrait_url}"
//           width=${sweatlingSizeSelectorInputValue / 3}
//           height=${sweatlingSizeSelectorInputValue / 3}
//           style="image-rendering:pixelated; flex-shrink: 0;"
//           onerror="this.src='https://dunkbinstats-users-images.acidflow.stream/users_pfps/no_image_available.png'" />
//         <span style="white-space: nowrap; color: currentColor;">${d.artistName}</span>
//       </div>`;
//       return d.twitch_url ? htl.html`<a href="${d.twitch_url}">${content}</a>` : content;
//     },
//   },
// });
```

<div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
  <div class="card">
    <h2>Bets by Category</h2>
    ${resize((width) => categoriesPlot(bets, width))}
  </div>
  <div class="card">
    <h2>DRAFT: Bet Duration Over Time</h2>
    ${resize((width) => dateDurationPlot(bets, width))}
  </div>
</div>

<div class="card" style="padding: 0; overflow: hidden;">
  <h2 style="margin-left: 1rem; margin-top: 1rem; margin-bottom: 1rem;">DRAFT: Bets resutls table</h2>
  ${betsTable}
</div>

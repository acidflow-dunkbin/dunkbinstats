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
const betsTable = Inputs.table(bets, {
  width: {
    title: 250,
    date: 120,
    duration: 120,
    yes_votes: 60,
    no_votes: 60,
    winners: 60,
    losers: 60,
    outcome: 60,
    category: 150,
  },
  align: {
    title: "left",
    date: "left",
    duration: "left",
    yes_votes: "right",
    no_votes: "right",
    winners: "right",
    losers: "right",
    outcome: "left",
    category: "left",
  },
  sort: "date",
  reverse: true,
  select: false,
  multiple: false,
  rows: 44,
  columns: ["title", "date", "duration", "yes_votes", "no_votes", "winners", "losers", "outcome", "category"],
  header: {
    title: "Bet",
    date: "Bet started at",
    duration: "Bet duration",
    yes_votes: "Believers",
    no_votes: "Doubters",
    winners: "Winners",
    losers: "Losers",
    outcome: "Outcome",
    category: "Category",
  },
  format: {
    outcome: (d) => {
      const outcomeColors = {
        Won: "oklch(43.2% 0.095 166.913)",
        Lost: "oklch(44.4% 0.177 26.899)",
      };
      const color = outcomeColors[d];
      return color ? html`<span style="color: ${color}">${d}</span>` : d;
    },
  },
});
```

<div class="grid grid-cols-4" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
  <div class="card grid-colspan-2">
    <h2>Bets by Category</h2>
    ${resize((width) => categoriesPlot(bets, width))}
  </div>
<div class="card grid-colspan-2" style="padding: 0; overflow: hidden;">
  <h2 style="margin-left: 1rem; margin-top: 1rem; margin-bottom: 1rem;">Bet Results</h2>
  ${betsTable}
</div>
</div>
<div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
  <div class="card grid-rowspan-1">
    <h2>DRAFT: Bet Duration Over Time</h2>
    ${resize((width) => dateDurationPlot(bets, width))}
  </div>
</div>

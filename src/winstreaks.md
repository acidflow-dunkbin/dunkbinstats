---
title: Baka- and Winstreak Champions
---

<link href="custom.css" rel="stylesheet"></link>

<h1 id="citbTitle" class="acid-title bartender-heading-decrypted">Winstreakers & CITB Hoarders</h1>
<h6 id="cosmeticsTitle">Built at: ${buildTimestamp.toLocaleString()}</h6>

```js
import { initializeTitleAnimation } from "./components/shared/titleAnimation.js";
initializeTitleAnimation();
```

```js
const dunkbinUsers = FileAttachment("./data/dunkbin_users_database.json").json();
const buildDate = await FileAttachment("./data/buildDate.json").json();
```

```js
const buildTimestamp = new Date(buildDate.build_timestamp);
```

```js
const topBakas = dunkbinUsers
  .slice()
  .sort((a, b) => a.streak - b.streak)
  .slice(0, 5);

const topChampions = dunkbinUsers
  .slice()
  .sort((a, b) => b.streak - a.streak)
  .slice(0, 5);

const combinedUsers = [...topBakas, ...topChampions];

const combinedChampions = Plot.plot({
  marginLeft: 0,
  height: 450,
  nice: true,
  x: {
    fontSize: 20,
    label: "← negative · Streak · positive →",
    labelAnchor: "center",
    percent: false,
  },
  y: {
    label: null,
  },
  marks: [
    Plot.barX(combinedUsers, {
      y: "username",
      x: "streak",
      sort: { y: "x", reverse: true },
      fill: (d) => (d.streak < 0 ? "oklch(44.4% 0.177 26.899)" : "oklch(43.2% 0.095 166.913)"),
    }),
    Plot.text(combinedUsers, {
      fontSize: 15,
      y: "username",
      x: (d) => d.streak,
      text: "streak",
      textAnchor: "start",
      dx: -30,
      fill: (d) => (d.streak < 0 ? "white" : "white"),
    }),
    Plot.axisY({ x: 0, fontSize: 15 }),
    Plot.ruleX([0]),
  ],
});

function yourStreak() {
  return dunkbinUsers.streak;
}
```

```js
function sparkbar(max) {
  return (x) => htl.html`<div style="
    background: var(--theme-blue);
    // color: black;
    font: 10px/1.6 var(--sans-serif);
    width: ${(100 * x) / max}%;
    float: left;
    size:40;
    box-sizing: border-box;
    overflow: visible;
    display: flex;
    justify-content: start;">${x.toLocaleString("en-US")}`;
}
```

```js
const streakVsCitbPlot = Plot.plot({
  x: {
    label: "Streak",
  },
  y: {
    label: "CITBs owned",
    type: "log",
  },
  marks: [
    Plot.dot(dunkbinUsers, {
      x: "streak",
      y: "citb",
      fill: (d) => (d.streak < 0 ? "oklch(44.4% 0.177 26.899)" : "oklch(43.2% 0.095 166.913)"),
      fillOpacity: 0.6,
      r: 4,

      tip: {
        lineWidth: 300,
        textPadding: 12,
        pointerSize: 8,
        fontSize: 14,
        lineHeight: 1.1,
        dx: 0,
        dy: -10,
        format: { opacity: false, type: false, fy: false, stroke: false },
      },
      title: (d) => [`Name: ${d.username}`, `ON a ${d.streak} streak`, `CITBs ${d.citb}`].join("\n\n"),
    }),
    Plot.ruleX([0], { stroke: "gray", strokeDasharray: "2,2" }),
    Plot.ruleY([0], { stroke: "gray", strokeDasharray: "2,2" }),
  ],
});
```

```js
const citbSearch = Inputs.search(dunkbinUsers, {
  placeholder: "Search CITB owners",
  query: "",
  autocomplete: true,
});
```

```js
const citbSearchValue = Generators.input(citbSearch);
```

```js
const resetSearchButton = Inputs.button(
  htl.html`<img src="https://noita-bartender-images.acidflow.stream/images/icons/arrow-counterclockwise.svg" />Reset`,
  {
    label: "",
    reduce: () => {
      citbSearch.query = "";
      citbSearch.dispatchEvent(new Event("input"));
      return null;
    },
  }
);
```

```js
const citbTable = Inputs.table(citbSearchValue, {
  sort: "citb",
  reverse: true,
  select: false,
  multiple: false,
  columns: ["username", "streak", "citb"],
  header: {
    username: "Name",
    streak: "Winstreak",
    citb: "CITBs",
  },
});
```

<div class="warning" label="⚠️ Stale Data! ⚠️">Ask DunkOrSlam to automate Dunkbin users JSON-based "database" sharing so these charts can be up to date!</div>
<div class="grid grid-cols-4" style="grid-auto-rows: auto;">
  <div class="card grid-colspan-2"><h2>Longest winstreaks and losestreaks</h2>${combinedChampions}</div>
  <div class="card grid-colspan-2"><h2>Streak vs CITB Relationship</h2>${streakVsCitbPlot}</div>
</div>

<div class="grid grid-cols-4">
  <div class="card grid-colspan-1">${citbSearch}</div>
  <div class="card grid-colspan-1">${resetSearchButton}</div>
</div>
<div class="grid grid-cols-4">
  <div class="card grid-colspan-2" style="padding: 0;">
    ${citbTable}
  </div>
</div>

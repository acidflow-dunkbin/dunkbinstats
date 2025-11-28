---
title: Dupes Trading
---

<link href="custom.css" rel="stylesheet"></link>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
  <h1 id="dupesTitle" class="acid-title bartender-heading-decrypted" style="margin: 0;">Dupes Trading</h1>
</div>
<h6>Last compiled: ${buildTimestamp.toLocaleString()}</h6>

```js
import { initializeTitleAnimation } from "./components/shared/titleAnimation.js";
import JSZip from "jszip";

initializeTitleAnimation();
```

```js
// Load data sources
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

```js
// User Search using Inputs.text with datalist for dropdown behavior
const userSearchInput = Inputs.text({
  label: "Search User",
  placeholder: "Enter username",
  datalist: user_stats.map((u) => u.display_name),
  submit: false,
});
const userSearchValue = Generators.input(userSearchInput);
```

```js
// Determine current user
const currentUser = userSearchValue
  ? user_stats.find((u) => u.display_name.toLowerCase() === userSearchValue.toLowerCase())
  : null;

const hideOwnedLabel = currentUser ? `Hide cosmetics owned by ${currentUser.display_name}` : "Hide owned cosmetics";
```

```js
// Data processing functions
function getUserOwnedCosmetics(userId, backpacks, cosmetics) {
  // Filter backpacks for the current user
  const userBackpack = backpacks.filter((item) => item.user_id === userId);

  // Create a map of cosmetic_id to quantity
  const cosmeticQuantities = {};
  userBackpack.forEach((item) => {
    const cosmeticId = item.item_id;
    cosmeticQuantities[cosmeticId] = (cosmeticQuantities[cosmeticId] || 0) + (item.quantity || 1);
  });

  // Enhance cosmetics with owned quantity
  return cosmetics
    .filter((cosmetic) => cosmeticQuantities[cosmetic.id])
    .map((cosmetic) => ({
      ...cosmetic,
      owned_quantity: cosmeticQuantities[cosmetic.id],
      combinedName: {
        name: cosmetic.name,
        id: cosmetic.id,
      },
    }))
    .sort((a, b) => b.owned_quantity - a.owned_quantity);
}

function getDuplicateCosmetics(ownedCosmetics) {
  return ownedCosmetics.filter((cosmetic) => cosmetic.owned_quantity >= 2);
}

// Calculate total owned across all users for each cosmetic
function getCosmeticsWithTotalOwned(cosmetics, backpacks) {
  // Create a map of cosmetic_id to total quantity across all users
  const totalQuantities = {};
  backpacks.forEach((item) => {
    const cosmeticId = item.item_id;
    totalQuantities[cosmeticId] = (totalQuantities[cosmeticId] || 0) + (item.quantity || 1);
  });

  return cosmetics
    .map((cosmetic) => ({
      ...cosmetic,
      total_owned: totalQuantities[cosmetic.id] || 0,
      combinedName: {
        name: cosmetic.name,
        id: cosmetic.id,
      },
    }))
    .sort((a, b) => b.total_owned - a.total_owned);
}

// Trade command generator
function generateTradeCommand(ownedItems, tradeItems) {
  if (!ownedItems || ownedItems.length === 0 || !tradeItems || tradeItems.length === 0) {
    return null;
  }

  const ownedNames = ownedItems.map((item) => item.name).join(", ");
  const tradeNames = tradeItems.map((item) => item.name).join(", ");

  return `!sell ${ownedNames} for ${tradeNames}`;
}
```

```js
// Process user's owned cosmetics (only if user is found)
const userOwnedCosmetics = currentUser ? getUserOwnedCosmetics(currentUser.user_id, backpacks, cosmetics) : [];
```

```js
// Process all cosmetics with total owned counts
const cosmeticsWithTotalOwned = getCosmeticsWithTotalOwned(cosmetics, backpacks);
```

```js
// --- Trade Table Setup (Left Column) ---

// Trade Search using Inputs.search (digging.md pattern)
const tradesSearch = Inputs.search(cosmeticsWithTotalOwned, {
  placeholder: "Search cosmetics...",
  columns: ["name", "price"],
  autocomplete: true,
  width: "100%",
});
const tradesSearchValue = Generators.input(tradesSearch);
```

```js
const sweatlingSizeSelectorInput = Inputs.range([21, 210], {
  label: "Art size",
  step: 1,
  value: 116,
});
const sweatlingSizeSelectorInputValue = Generators.input(sweatlingSizeSelectorInput);
```

```js
const resetSearchButton = Inputs.button(
  htl.html`<img src="https://noita-bartender-images.acidflow.stream/images/icons/arrow-counterclockwise.svg" />Reset`,
  {
    label: "",
    reduce: () => {
      tradesSearch.query = "";
      tradesSearch.dispatchEvent(new Event("input"));
      hideOwnedCheckbox.value = [hideOwnedLabel];
      hideOwnedCheckbox.dispatchEvent(new Event("input"));
      showOnlyDupesCheckbox.value = ["Show only owned dupe cosmetics"];
      showOnlyDupesCheckbox.dispatchEvent(new Event("input"));
      sweatlingSizeSelectorInput.value = 116;
      sweatlingSizeSelectorInput.dispatchEvent(new Event("input"));
      return null;
    },
  }
);
```

```js
// Hide owned cosmetics checkbox
const hideOwnedCheckbox = Inputs.checkbox([hideOwnedLabel], {
  value: [hideOwnedLabel],
});
const hideOwnedValue = Generators.input(hideOwnedCheckbox);
```

```js
// Get set of owned cosmetic IDs for filtering
const ownedCosmeticIds = new Set(userOwnedCosmetics.map((c) => c.id));

// Filter trades based on hide owned checkbox and search
const filteredTradesCosmetics =
  hideOwnedValue.length > 0
    ? tradesSearchValue.filter((cosmetic) => !ownedCosmeticIds.has(cosmetic.id))
    : tradesSearchValue;
```

```js
// Trades table configuration
const tradesTable = Inputs.table(filteredTradesCosmetics, {
  columns: ["image", "combinedName", "total_owned", "price"],
  header: {
    image: "Art",
    combinedName: "Name",
    price: "Price💧",
    total_owned: "Total Owned",
  },
  width: {
    image: sweatlingSizeSelectorInputValue,
    combinedName: 200,
    price: 100,
    total_owned: 100,
  },
  align: {
    image: "center",
    combinedName: "left",
    price: "right",
    total_owned: "right",
  },
  format: {
    image: (d) =>
      htl.html`<div style="position: relative; width: ${sweatlingSizeSelectorInputValue}px; height: ${sweatlingSizeSelectorInputValue}px; overflow: hidden;">
        <img src="http://dunkbinstats-images.acidflow.stream/img/sweatling.png" width=${sweatlingSizeSelectorInputValue} height=${sweatlingSizeSelectorInputValue} style="image-rendering: pixelated; position: absolute; top: 0; left: 0;" />
        <img src="http://dunkbinstats-images.acidflow.stream/img/${d}" width=${sweatlingSizeSelectorInputValue} height=${sweatlingSizeSelectorInputValue} style="image-rendering: pixelated; position: absolute; top: 0; left: 0;" />
      </div>`,
    combinedName: (d) =>
      htl.html`<a href="https://dunkbin.com/shop?items=${d.id}" target="_blank" rel="noopener noreferrer" >${d.name}</a>`,
    price: (d) => `${d.toLocaleString()}💧`,
  },
  sort: "total_owned",
  reverse: true,
  select: true,
  multiple: true,
  rows: 15, // Increased rows slightly
  value: [],
});
```

```js
// --- Dupes Table Setup (Right Column) ---

// Duplicate filtering checkbox (enabled by default)
const showOnlyDupesCheckbox = Inputs.checkbox(["Show only owned dupe cosmetics"], {
  value: ["Show only owned dupe cosmetics"],
});
const showOnlyDupesValue = Generators.input(showOnlyDupesCheckbox);
```

```js
// Filter owned cosmetics based on checkbox
const filteredOwnedCosmetics = showOnlyDupesValue.includes("Show only owned dupe cosmetics")
  ? getDuplicateCosmetics(userOwnedCosmetics)
  : userOwnedCosmetics;
```

```js
// Owned cosmetics table configuration
const ownedCosmeticsTable = Inputs.table(filteredOwnedCosmetics, {
  columns: ["image", "combinedName", "owned_quantity", "price"],
  header: {
    image: "Art",
    combinedName: "Name",
    price: "Price💧",
    owned_quantity: "Owned",
  },
  width: {
    image: sweatlingSizeSelectorInputValue,
    combinedName: 200,
    price: 100,
    owned_quantity: 80,
  },
  align: {
    image: "center",
    combinedName: "left",
    price: "right",
    owned_quantity: "right",
  },
  format: {
    image: (d) =>
      htl.html`<div style="position: relative; width: ${sweatlingSizeSelectorInputValue}px; height: ${sweatlingSizeSelectorInputValue}px; overflow: hidden;">
        <img src="http://dunkbinstats-images.acidflow.stream/img/sweatling.png" width=${sweatlingSizeSelectorInputValue} height=${sweatlingSizeSelectorInputValue} style="image-rendering: pixelated; position: absolute; top: 0; left: 0;" />
        <img src="http://dunkbinstats-images.acidflow.stream/img/${d}" width=${sweatlingSizeSelectorInputValue} height=${sweatlingSizeSelectorInputValue} style="image-rendering: pixelated; position: absolute; top: 0; left: 0;" />
      </div>`,
    combinedName: (d) =>
      htl.html`<a href="https://dunkbin.com/shop?items=${d.id}" target="_blank" rel="noopener noreferrer" >${d.name}</a>`,
    price: (d) => `${d.toLocaleString()}💧`,
  },
  sort: "owned_quantity",
  reverse: true,
  select: true,
  multiple: true,
  rows: 15,
  value: [],
});
```

```js
// Selection tracking system
const ownedSelections = Generators.input(ownedCosmeticsTable);
const tradesSelections = Generators.input(tradesTable);
```

```js
// Trade command mutable state
const tradeCommandMutable = Mutable(null);

// Generate Trade Command Button
const generateTradeButton = Inputs.button(
  htl.html`<img src="https://noita-bartender-images.acidflow.stream/images/icons/cart-check.svg" style="display: inline-block; vertical-align: middle;" />Generate`
);
generateTradeButton.addEventListener("click", () => {
  const owned = ownedSelections;
  const trades = tradesSelections;

  if (owned && owned.length > 0 && trades && trades.length > 0) {
    tradeCommandMutable.value = generateTradeCommand(owned, trades);
  } else {
    tradeCommandMutable.value = null;
  }
});

// Copy Trade Command Button
const copyTradeButton = Inputs.button(
  htl.html`<img src="https://noita-bartender-images.acidflow.stream/images/icons/clipboard2-plus.svg" style="display: inline-block; vertical-align: middle;" />Copy`
);
copyTradeButton.addEventListener("click", () => {
  if (tradeCommandMutable.value) {
    navigator.clipboard.writeText(tradeCommandMutable.value);
    const btn = copyTradeButton.querySelector("button") || copyTradeButton;
    const originalHTML = btn.innerHTML;
    btn.innerHTML =
      '<img src="https://noita-bartender-images.acidflow.stream/images/icons/clipboard2-check.svg" style="display: inline-block; vertical-align: middle;" />Copied!';
    setTimeout(() => (btn.innerHTML = originalHTML), 2000);
  }
});
```

```js
// UI Rendering
const userNotFoundMessage =
  userSearchValue && !currentUser
    ? htl.html`
    <div style="color: #ff6b6b; font-weight: bold;" role="region" aria-label="User Not Found">
      No user found
    </div>`
    : "";

const mainInterface = currentUser
  ? htl.html`
    <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%;" role="region" aria-label="User Info">
      <div style="display: flex; gap: 2rem; align-items: center;">
        <span style="font-size: 1.1rem;"><strong>${currentUser.display_name}'s backpack:</strong></span>
        <span style="opacity: 0.7; font-size: 0.9rem;">${currentUser.display_name} owns ${userOwnedCosmetics.length} unique cosmetics.</span>
      </div>
    </div>`
  : "";

const tradeCommandSection = currentUser
  ? htl.html`
    <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%;" role="region" aria-label="Trade Command Generator">
      <div style="display: flex;">
        ${generateTradeButton}
      </div>
      ${
        tradeCommandMutable
          ? htl.html`
            <div style="display: flex; align-items: stretch; gap: 0.5rem; width: 100%;">
              <input type="text" readonly value="${tradeCommandMutable}" style="flex: 0 0 70%; background: #1e1e1e; color: #d4d4d4; padding: 0.75rem; border: 1px solid #333; border-radius: 4px; font-family: monospace; font-size: 1rem;" id="trade-command-input" />
              <div style="flex: 1;">${copyTradeButton}</div>
            </div>`
          : htl.html`<div style="display: flex; align-items: center; padding: 0.75rem;"><span style="opacity: 0.6;">Select cosmetics from both tables and click Generate</span></div>`
      }
    </div>`
  : "";
```

<div class="grid grid-cols-4">
  <div class="card grid-colspan-1">
    <h2>User Backpack Search</h2>
    ${userSearchInput}
  </div>
  <div class="card grid-colspan-3" >
    <div>
      ${!currentUser ? htl.html`<h2>Find and select a user to see their backpack</h2>` : ""}
      ${userNotFoundMessage}
      ${mainInterface}
    </div>
  </div>
</div>

<div class="grid grid-cols-4" style="${currentUser ? 'display: grid;' : 'display: none;'}">
  <div class="card grid-colspan-2" style="padding: 0;">
    <div style="padding: 1rem;">
      <h2>All Available Cosmetics</h2>
      <div style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
        <div style="flex-grow: 1;">${tradesSearch}</div>
        <div>${resetSearchButton}</div>
        <div>${hideOwnedCheckbox}</div>
      </div>
    </div>
    ${tradesTable}
  </div>
  <div class="card grid-colspan-2" style="padding: 0;">
    <div style="padding: 1rem;">
      <h2>Cosmetics owned by ${currentUser ? currentUser.display_name : ''}</h2>
      <div style="display: flex; gap: 1rem; align-items: flex-end; justify-content: space-between; flex-wrap: wrap;">
        <div>${showOnlyDupesCheckbox}</div>
        <div>${sweatlingSizeSelectorInput}</div>
      </div>
    </div>
    ${ownedCosmeticsTable}
  </div>
</div>
<div class="grid grid-cols-1">
  <div class="card">
    <h2>Generate trade command</h2>
    ${tradeCommandSection}
  </div>
</div>

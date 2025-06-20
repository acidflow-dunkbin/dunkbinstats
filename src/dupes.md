---
title: Dupes finder
---

<link href="custom.css" rel="stylesheet"></link>

```js
import { initializeTitleAnimation } from "./components/shared/titleAnimation.js";
const buildDate = await FileAttachment("./data/buildDate.json").json();

initializeTitleAnimation();
```

```js
const buildTimestamp = new Date(buildDate.build_timestamp);
```

<h1 id="cosmeticsTitle" class="acid-title bartender-heading-decrypted acidTitleCosmetic">Dupes finder</h1>

<h2>Coming soon…</h2>
<h6 id="cosmeticsTitle">Built at: ${buildTimestamp.toLocaleString()}</h6>

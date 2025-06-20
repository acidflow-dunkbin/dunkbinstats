---
title: Dunkbin Stats 2.0
---

<link href="custom.css" rel="stylesheet"></link>

<div class="hero">
  <h1 class="acidSiteLogo"><span class="acidSiteLogo title-gradient-blue">💧Dunkbin Stats</span> <span class="acidSiteLogo title-gradient-orange">2.0</span></h1>
</div>

```js
const cosmeticsZip = await FileAttachment("./data/cosmetics.zip").zip();
const cosmetics = await cosmeticsZip.file("cosmetics.json").json();

function createCosmeticsBackground(cosmetics) {
  const viewportWidth = window.innerWidth;
  const cosmeticSize = viewportWidth / 30;
  const cols = Math.ceil(viewportWidth / cosmeticSize);

  const totalCosmetics = cols * 50;
  const shuffledCosmetics = [];
  const cosmeticsPool = [...cosmetics];

  for (let i = 0; i < totalCosmetics; i++) {
    if (cosmeticsPool.length === 0) {
      cosmeticsPool.push(...cosmetics);
    }

    const randomIndex = Math.floor(Math.random() * cosmeticsPool.length);
    const selectedCosmetic = cosmeticsPool.splice(randomIndex, 1)[0];
    shuffledCosmetics.push(selectedCosmetic);
  }

  const backgroundContainer = htl.html`
    <div style="
      position: fixed;
      top: 200px;
      left: 0;
      width: 100vw;
      height: calc(100vh - 350px);
      pointer-events: auto;
      z-index: -2;
      opacity: 0.9;
      overflow: hidden;
    ">
      <div style="
        display: grid;
        grid-template-columns: repeat(${cols}, ${cosmeticSize}px);
        grid-auto-rows: ${cosmeticSize}px;
        width: 100%;
        height: 100%;
      ">
        ${shuffledCosmetics.map(
          (cosmetic) => htl.html`
          <div style="
            position: relative;
            width: ${cosmeticSize}px;
            height: ${cosmeticSize}px;
            transition: opacity 0.4s ease;
          " onmouseover="this.style.opacity='opacity'" onmouseout="this.style.opacity='0.15'">
            <img
              src="http://dunkbinstats-images.acidflow.stream/img/sweatling.png"
              width="${cosmeticSize}"
              height="${cosmeticSize}"
              style="
                image-rendering: pixelated;
                position: absolute;
                top: 0;
                left: 0;
                pointer-events: none;
              "
            />
            <img
              src="http://dunkbinstats-images.acidflow.stream/img/${cosmetic.image}"
              width="${cosmeticSize}"
              height="${cosmeticSize}"
              style="
                image-rendering: pixelated;
                position: absolute;
                top: 0;
                left: 0;
                pointer-events: none;
              "
            />
          </div>
        `
        )}
      </div>
    </div>
  `;

  return backgroundContainer;
}

const cosmeticsBackground = createCosmeticsBackground(cosmetics);
```

${cosmeticsBackground}

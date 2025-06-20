import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function topExpensiveCosmeticsPlot(cosmetics, width = 640) {
  const topItems = cosmetics
    .filter((d) => d?.name && typeof d?.price === "number" && d.price > 0)
    .sort((a, b) => b.price - a.price)
    .slice(0, 15)
    .map((item) => ({
      name: item.name,
      price: item.price,
    }));

  const sixHundredthWin = topItems.find((d) => d.name === "600th Win");

  if (!sixHundredthWin) {
    console.warn("600th Win not found in the top 15 expensive cosmetics.");
  }

  const tipData = sixHundredthWin ? [sixHundredthWin] : [];

  return Plot.plot({
    width,
    color: {
      scheme: "ylgnbu",
    },
    marginLeft: Math.min(100, width * 0.15),
    marginRight: Math.min(80, width * 0.12),
    x: {
      label: "Price (Sweat)",
      tickFormat: "~s",
    },
    y: {
      label: null,
      domain: topItems.map((d) => d.name),
    },
    marks: [
      Plot.barX(topItems, {
        y: (d) => d.name,
        x: (d) => d.price,
        fill: (d) => d.price,
        sort: { y: "x", reverse: true },
        tip: {
          tip: "y",
          lineWidth: 300,
          textPadding: 12,
          pointerSize: 8,
          fontSize: 14,
          lineHeight: 1.1,
          dx: 0,
          dy: -10,
          format: { opacity: false, type: false, fy: false, stroke: false },
        },
        title: (d) => [`Cosmetic: ${d.name}`, `Costs: ${d.price.toLocaleString()}💧`].join("\n\n"),
      }),
      Plot.text(topItems, {
        y: (d) => d.name,
        x: (d) => d.price,
        text: (d) => `${d.price.toLocaleString()}💧`,
        textAnchor: "start",
        dx: 5,
        fontSize: width < 500 ? 12 : 14,
      }),
      ...(tipData.length > 0
        ? [
            Plot.tip(tipData, {
              x: (d) => d.price,
              y: (d) => d.name,
              anchor: "top",
              dy: width > 600 ? 15 : 10,
              fill: "oklch(44.4% 0.177 26.899)",
              stroke: "darkred",
              strokeWidth: 2,
              fontSize: width < 500 ? 10 : 11,
              lineWidth: Math.min(280, width * 0.4),
              textPadding: 10,
              pointerSize: 14,
              title: [
                `This is an error!\nThe price for this and every\nother event cosmetic\nshould be 0💧.\nAsk DunkOrSlam to fix\nthe JSON-based "Database"`,
              ],
            }),
          ]
        : []),
    ],
  });
}

import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function mostPopularCosmeticsPlot(backpacks, width = 640) {
  const itemCounts = d3.rollup(
    backpacks.filter((d) => d?.item_name),
    (items) => new Set(items.map((d) => d.user_id)).size,
    (d) => d.item_name
  );

  const topItems = Array.from(itemCounts, ([item, count]) => ({ item, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return Plot.plot({
    width,
    color: {
      scheme: "ylgnbu",
    },
    marginLeft: Math.min(100, width * 0.15),
    marginRight: Math.min(80, width * 0.12),
    x: {
      label: "Number of owners",
    },
    y: {
      label: null,
    },
    marks: [
      Plot.barX(topItems, {
        y: "item",
        x: "count",
        fill: "count",
        sort: { y: "x", reverse: true },
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
        title: (d) => [`Cosmetic: ${d.item}`, `Owners: ${d.count.toLocaleString()}`].join("\n\n"),
      }),
      Plot.text(topItems, {
        y: "item",
        x: "count",
        text: "count",
        textAnchor: "start",
        dx: 5,
        fontSize: width < 500 ? 12 : 14,
      }),
    ],
  });
}

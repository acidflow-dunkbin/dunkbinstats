import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function cosmeticLayerPopularityPlot(cosmetics, width = 640) {
  const validLayers = new Set([4, 5, 6, 7, 8]);
  const layerCounts = d3.rollup(
    cosmetics.filter((d) => d?.layer && validLayers.has(d.layer)),
    (v) => v.length,
    (d) => d.layer_name
  );

  const layerData = Array.from(layerCounts, ([layer, count]) => ({ layer, count }));

  return Plot.plot({
    width,
    height: 300,
    marginLeft: Math.min(80, width * 0.12),
    marginRight: Math.min(80, width * 0.12),
    color: {
      scheme: "ylgnbu",
    },
    x: {
      label: "Number of cosmetics",
    },
    y: {
      label: null,
    },
    marks: [
      Plot.barX(layerData, {
        y: "layer",
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
        title: (d) => [`Layer: ${d.layer}`, `Number of cosmetics: ${d.count.toLocaleString()}`].join("\n\n"),
      }),
      Plot.text(layerData, {
        y: "layer",
        x: "count",
        text: "count",
        textAnchor: "start",
        dx: 5,
        fontSize: width < 500 ? 12 : 14,
      }),
    ],
  });
}

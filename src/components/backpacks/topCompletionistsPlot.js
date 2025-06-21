import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function topCompletionistsPlot(userData, width = 640) {
  const topHoarders = userData
    .filter((user) => user?.collection_completion_percentage)
    .sort((a, b) => b.collection_completion_percentage - a.collection_completion_percentage)
    .slice(0, 15);

  // Calculate dynamic margin based on longest username
  const maxLabelLength = Math.max(...topHoarders.map((d) => d.display_name.length));
  const dynamicMarginLeft = Math.max(120, Math.min(maxLabelLength * 6 + 15, 200));

  const fontSize = width < 500 ? 12 : 14;

  return Plot.plot({
    width,
    height: 400,
    marginLeft: dynamicMarginLeft,
    marginRight: Math.max(120, width * 0.15),
    marginTop: 20,
    marginBottom: 40,
    color: {
      scheme: "ylgnbu",
    },
    x: {
      label: "Collection completion percentage",
      tickFormat: (d) => `${d}%`,
    },
    y: {
      label: null,
      tickSize: 0,
    },
    marks: [
      Plot.barX(topHoarders, {
        y: "display_name",
        x: "collection_completion_percentage",
        fill: "collection_completion_percentage",
        sort: { y: "x", reverse: true },
        tip: {
          lineWidth: 300,
          textPadding: 12,
          pointerSize: 8,
          fontSize,
          lineHeight: 1.1,
          dx: 0,
          dy: -10,
          format: { opacity: false, type: false, fy: false, stroke: false },
        },
        title: (d) =>
          [
            `Name: ${d.display_name}`,
            `Unique items: ${d.unique_items_owned}`,
            `Owns: ${d.total_items_owned} cosmetics`,
            `Collection progress: ${d.collection_completion_percentage}% complete`,
            `Total value: ${d.total_items_cost?.toLocaleString()}💧`,
          ].join("\n\n"),
      }),
      Plot.text(topHoarders, {
        y: "display_name",
        x: "collection_completion_percentage",
        text: (d) => `${d.collection_completion_percentage}% (${d.unique_items_owned})`,
        textAnchor: "start",
        dx: 5,
        fontSize: fontSize,
        fill: "currentColor",
        fillOpacity: 0.8,
      }),
      Plot.ruleX([0]),
    ],
  });
}

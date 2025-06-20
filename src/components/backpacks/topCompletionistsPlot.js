import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function topCompletionistsPlot(userData, width = 640) {
  const topHoarders = userData
    .filter((user) => user?.collection_completion_percentage)
    .sort((a, b) => b.collection_completion_percentage - a.collection_completion_percentage)
    .slice(0, 15);

  const isMobile = width < 500;
  const marginLeft = isMobile ? 80 : 120;
  const marginRight = isMobile ? 60 : 100;
  const fontSize = isMobile ? 12 : 14;

  return Plot.plot({
    width,
    height: 400,
    marginLeft,
    marginRight,
    marginTop: 20,
    marginBottom: 40,
    color: {
      scheme: "ylgnbu",
    },
    x: {
      label: "Collection completion percentage",
      percent: true,
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
        rx: 3,
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
      // Only show text labels if there's enough space
      ...(width > 400
        ? [
            Plot.text(topHoarders, {
              y: "display_name",
              x: "collection_completion_percentage",
              text: (d) => `${d.collection_completion_percentage}% (${d.unique_items_owned})`,
              textAnchor: "start",
              dx: 5,
              fontSize: fontSize - 1,
              fill: "currentColor",
              fillOpacity: 0.8,
            }),
          ]
        : []),
      Plot.ruleX([0]),
    ],
  });
}

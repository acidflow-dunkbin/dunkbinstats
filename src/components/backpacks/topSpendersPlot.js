import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function topSpendersPlot(userData, width = 640) {
  const topSpenders = userData
    .filter((user) => user?.total_items_cost)
    .sort((a, b) => b.total_items_cost - a.total_items_cost)
    .slice(0, 15);

  // Responsive design adjustments
  const isMobile = width < 500;
  const marginLeft = isMobile ? 80 : 120;
  const marginRight = isMobile ? 80 : 120;
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
      label: "Total sweat spent 💧",
      tickFormat: (d) => d3.format("~s")(d),
    },
    y: {
      label: null,
      tickSize: 0,
    },
    marks: [
      Plot.barX(topSpenders, {
        y: "display_name",
        x: "total_items_cost",
        fill: "total_items_cost",
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
            `Owns: ${d.total_items_owned} cosmetics`,
            `Spent: ${d.total_items_cost.toLocaleString()}💧`,
            `Unique items: ${d.unique_items_owned}`,
            `Collection progress: ${d.collection_completion_percentage}% complete`,
          ].join("\n\n"),
      }),
      // Only show text labels if there's enough space
      ...(width > 400
        ? [
            Plot.text(topSpenders, {
              y: "display_name",
              x: "total_items_cost",
              text: (d) =>
                isMobile ? d3.format("~s")(d.total_items_cost) + "💧" : `${d.total_items_cost.toLocaleString()}💧`,
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

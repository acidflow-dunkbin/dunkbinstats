import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function categoriesPlot2(bets, width = 640) {
  const outcomeColors = {
    Won: "oklch(43.2% 0.095 166.913)",
    Lost: "oklch(44.4% 0.177 26.899)",
  };

  // Group by category and outcome
  const categoryOutcomeStats = [];
  const categoryTotals = {};

  bets.forEach((b) => {
    if (b.category && b.outcome) {
      const key = `${b.category}-${b.outcome}`;
      const existing = categoryOutcomeStats.find((s) => s.category === b.category && s.outcome === b.outcome);
      if (existing) {
        existing.count++;
      } else {
        categoryOutcomeStats.push({
          category: b.category,
          outcome: b.outcome,
          count: 1,
        });
      }
      categoryTotals[b.category] = (categoryTotals[b.category] || 0) + 1;
    }
  });

  // Sort categories by total count
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);

  const isMobile = width < 500;
  const marginLeft = isMobile ? 120 : 200;
  const marginRight = isMobile ? 30 : 40;
  const marginBottom = isMobile ? 30 : 40;
  const fontSize = isMobile ? 12 : 14;

  const totalBets = bets.filter((b) => b.category && b.outcome).length;

  return Plot.plot({
    width,
    marginLeft,
    marginRight,
    marginTop: 20,
    marginBottom,
    x: {
      label: "Number of bets",
      grid: true,
      tickFormat: d3.format("d"),
    },
    y: {
      label: null,
      domain: sortedCategories,
    },
    color: {
      domain: ["Won", "Lost"],
      range: [outcomeColors.Won, outcomeColors.Lost],
      legend: true,
    },
    marks: [
      Plot.barX(categoryOutcomeStats, {
        x: "count",
        y: "category",
        fill: "outcome",
        order: "outcome",
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
        title: (d) => {
          const catTotal = categoryTotals[d.category];
          const percentage = ((d.count / catTotal) * 100).toFixed(1);
          return [
            `Category: ${d.category}`,
            `${d.outcome}: ${d.count}`,
            `${percentage}% of category`,
            `Category total: ${catTotal}`,
          ].join("\n\n");
        },
      }),
      Plot.text(
        sortedCategories.map((cat) => ({
          category: cat,
          total: categoryTotals[cat],
        })),
        {
          text: (d) => d.total,
          y: "category",
          x: "total",
          textAnchor: "end",
          dx: -3,
          fill: "white",
        }
      ),
      Plot.ruleX([0]),
    ],
  });
}

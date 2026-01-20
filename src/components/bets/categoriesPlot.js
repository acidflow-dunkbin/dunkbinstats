import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function categoriesPlot(bets, width = 640) {
  const outcomeColors = {
    Won: "oklch(43.2% 0.095 166.913)",
    Lost: "oklch(44.4% 0.177 26.899)",
  };

  const rawTotals = {};
  const rawOutcomes = {};

  bets.forEach((b) => {
    if (b.category && b.outcome) {
      rawTotals[b.category] = (rawTotals[b.category] || 0) + 1;
      const key = `${b.category}|${b.outcome}`;
      rawOutcomes[key] = (rawOutcomes[key] || 0) + 1;
    }
  });

  const totalBets = Object.values(rawTotals).reduce((a, b) => a + b, 0);
  if (totalBets === 0) return Plot.plot({ width, height: 100 });

  const categoryOrder = Object.entries(rawTotals)
    .sort((a, b) => a[1] - b[1])
    .map(([cat]) => cat);

  const MIN_SHARE = 0.03;

  const rawShares = categoryOrder.map((cat) => ({
    cat,
    share: rawTotals[cat] / totalBets,
  }));

  const totalAdjustedShare = rawShares.reduce((sum, d) => sum + Math.max(d.share, MIN_SHARE), 0);
  const normalization = 1 / totalAdjustedShare;

  const marimekkoData = [];
  let y0 = 0;

  for (const item of rawShares) {
    const { cat: category, share: rawShare } = item;
    const catTotal = rawTotals[category];
    const catHeight = Math.max(rawShare, MIN_SHARE) * normalization;
    const y1 = y0 + catHeight;

    const wonCount = rawOutcomes[`${category}|Won`] || 0;
    const lostCount = rawOutcomes[`${category}|Lost`] || 0;

    if (wonCount > 0) {
      const wonWidth = wonCount / catTotal;
      marimekkoData.push({
        category,
        outcome: "Won",
        count: wonCount,
        catTotal,
        catHeight,
        x0: 0,
        x1: wonWidth,
        y0,
        y1,
        percentage: ((wonCount / catTotal) * 100).toFixed(0),
      });
    }

    if (lostCount > 0) {
      const wonWidth = wonCount / catTotal;
      const lostWidth = lostCount / catTotal;
      marimekkoData.push({
        category,
        outcome: "Lost",
        count: lostCount,
        catTotal,
        catHeight,
        x0: wonWidth,
        x1: wonWidth + lostWidth,
        y0,
        y1,
        percentage: ((lostCount / catTotal) * 100).toFixed(0),
      });
    }

    y0 = y1;
  }

  const isMobile = width < 500;
  const numCategories = categoryOrder.length;

  const chartHeight = Math.max(800, numCategories * 25);

  const labelData = categoryOrder.map((cat) => {
    const rect = marimekkoData.find((d) => d.category === cat);
    return {
      category: cat,
      y: (rect.y0 + rect.y1) / 2,
      total: rawTotals[cat],
    };
  });

  return Plot.plot({
    width,
    height: chartHeight,
    marginLeft: isMobile ? 130 : 180,
    marginRight: 20,
    marginTop: 40,
    marginBottom: 40,
    x: {
      label: "Outcome proportion →",
      domain: [0, 1],
      tickFormat: (d) => `${Math.round(d * 100)}%`,
    },
    y: {
      label: null,
      domain: [0, 1],
      axis: null,
    },
    color: {
      domain: ["Won", "Lost"],
      range: [outcomeColors.Won, outcomeColors.Lost],
      legend: true,
    },
    marks: [
      Plot.rect(marimekkoData, {
        x1: "x0",
        x2: "x1",
        y1: "y0",
        y2: "y1",
        fill: "outcome",
        stroke: "white",
        strokeWidth: 1,
        title: (d) => `${d.category}\n${d.outcome}: ${d.count} (${d.percentage}%)\nTotal: ${d.catTotal}`,
      }),
      Plot.text(labelData, {
        text: (d) => `${d.category} (${d.total})`,
        x: -0.02,
        y: "y",
        textAnchor: "end",
        fontSize: isMobile ? 9 : 11,
      }),
      Plot.text(
        marimekkoData.filter((d) => d),
        {
          text: (d) => `${d.percentage}%`,
          x: (d) => (d.x0 + d.x1) / 2,
          y: (d) => (d.y0 + d.y1) / 2,
          fill: "white",
          textAnchor: "middle",
          fontSize: isMobile ? 9 : 11,
          fontWeight: "bold",
        },
      ),
      Plot.ruleX([0]),
      Plot.ruleY([0]),
    ],
  });
}

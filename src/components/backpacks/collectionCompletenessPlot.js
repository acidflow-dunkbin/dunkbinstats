import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function collectionCompletenessPlot(userData, width = 640) {
  const completenessData = userData
    .filter((user) => user?.collection_completion_percentage !== undefined)
    .map((user) => ({
      percentage: user.collection_completion_percentage,
    }));

  const isMobile = width < 500;
  const marginLeft = isMobile ? 50 : 60;
  const marginRight = isMobile ? 20 : 30;
  const marginBottom = isMobile ? 50 : 40;
  const fontSize = isMobile ? 12 : 14;

  return Plot.plot({
    width,
    marginLeft,
    marginRight,
    marginTop: 20,
    marginBottom,
    x: {
      label: "Collection completeness",
      domain: [0, 100],
      tickFormat: (d) => `${d}%`,
      ticks: isMobile ? 5 : 10,
    },
    y: {
      label: "Number of users",
      grid: true,
      type: "pow",
      exponent: 0.5,
      tickFormat: d3.format("d"),
    },
    color: {
      scheme: "ylgnbu",
    },
    marks: [
      Plot.rectY(
        completenessData,
        Plot.binX(
          { y: "count" },
          {
            x: "percentage",
            thresholds: isMobile ? 8 : 10,
            fill: "percentage",
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
              const binSize = 100 / (isMobile ? 8 : 10);
              const binIndex = Math.floor(d.percentage / binSize);
              const binStart = Math.round(binIndex * binSize);
              const binEnd = Math.round((binIndex + 1) * binSize);

              const usersInBin = completenessData.filter(
                (user) => Math.floor(user.percentage / binSize) === binIndex
              ).length;

              return [
                `Range: ${binStart}% - ${binEnd}%`,
                `Users in this range: ${usersInBin}`,
                `Percentage of total: ${((usersInBin / completenessData.length) * 100).toFixed(1)}%`,
                `Total users: ${completenessData.length}`,
              ].join("\n\n");
            },
          }
        )
      ),
      Plot.ruleY([0]),
    ],
  });
}

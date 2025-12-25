import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function dateDurationPlot(bets, width = 640) {
  const outcomeColors = {
    Won: "oklch(43.2% 0.095 166.913)",
    Lost: "oklch(44.4% 0.177 26.899)",
  };

  // Parse duration string "HH:MM:SS" to minutes
  const parseDuration = (dur) => {
    if (!dur) return null;
    const parts = dur.split(":");
    if (parts.length !== 3) return null;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    return hours * 60 + minutes + seconds / 60;
  };

  const data = bets
    .filter((b) => b.date && b.duration && b.outcome)
    .map((b) => ({
      date: new Date(b.date),
      duration: parseDuration(b.duration),
      durationRaw: b.duration,
      outcome: b.outcome,
      title: b.title,
      category: b.category,
    }))
    .filter((d) => d.duration !== null && !isNaN(d.date));

  const isMobile = width < 500;
  const marginLeft = isMobile ? 50 : 60;
  const marginRight = isMobile ? 20 : 30;
  const marginBottom = isMobile ? 40 : 50;
  const fontSize = isMobile ? 12 : 14;

  // Format duration for display
  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return Plot.plot({
    width,
    height: 400,
    marginLeft,
    marginRight,
    marginTop: 20,
    marginBottom,
    x: {
      label: "Date",
      type: "time",
    },
    y: {
      label: "Duration",
      grid: true,
      type: "sqrt",
      tickFormat: (d) => formatDuration(d),
    },
    color: {
      domain: ["Won", "Lost"],
      range: [outcomeColors.Won, outcomeColors.Lost],
      legend: true,
    },
    marks: [
      Plot.dot(data, {
        x: "date",
        y: "duration",
        fill: "outcome",
        r: isMobile ? 4 : 5,
        opacity: 0.8,
        tip: {
          lineWidth: 300,
          textPadding: 12,
          pointerSize: 8,
          fontSize,
          lineHeight: 1.1,
          format: { opacity: false, type: false, fy: false, stroke: false },
        },
        title: (d) =>
          [
            `${d.title}`,
            `Date: ${d.date.toLocaleDateString()}`,
            `Duration: ${d.durationRaw}`,
            `Outcome: ${d.outcome}`,
            `Category: ${d.category}`,
          ].join("\n\n"),
      }),
      Plot.ruleY([0]),
    ],
  });
}
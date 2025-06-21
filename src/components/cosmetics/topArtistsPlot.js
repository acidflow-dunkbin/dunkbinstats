import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function topArtistsPlot(cosmetics, width = 640) {
  const artistCounts = d3.rollup(
    cosmetics.filter((d) => d?.author_name && d.author_name !== "Unknown"),
    (v) => v.length,
    (d) => d.author_name
  );

  const topArtists = Array.from(artistCounts, ([artist, count]) => ({ artist, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Calculate dynamic margin based on longest artist name
  const maxLabelLength = Math.max(...topArtists.map((d) => d.artist.length));
  const dynamicMargin = Math.max(120, Math.min(maxLabelLength * 6 + 15, 200));

  return Plot.plot({
    width,
    color: {
      scheme: "ylgnbu",
    },
    marginLeft: dynamicMargin,
    marginRight: Math.min(80, width * 0.12),
    x: {
      label: "Number of cosmetics",
    },
    y: {
      label: null,
    },
    marks: [
      Plot.barX(topArtists, {
        y: (d) => d.artist,
        x: (d) => d.count,
        fill: (d) => d.count,
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
        title: (d) => [`Name: ${d.artist}`, `Created: ${d.count} cosmetics`].join("\n\n"),
      }),
      Plot.text(topArtists, {
        y: (d) => d.artist,
        x: (d) => d.count,
        text: (d) => d.count,
        textAnchor: "start",
        dx: 5,
        fontSize: width < 500 ? 12 : 14,
      }),
    ],
  });
}

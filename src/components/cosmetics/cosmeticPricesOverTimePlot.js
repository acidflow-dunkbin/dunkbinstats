import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function cosmeticPricesOverTimePlot(cosmetics, cosmeticDates, width = 640) {
  const mergedData = cosmetics
    .map((cosmetic) => {
      const dateEntry = cosmeticDates.find((date) => +date.id === +cosmetic.id);
      if (dateEntry && cosmetic.price > 0) {
        return {
          id: cosmetic.id,
          name: cosmetic.name,
          price: cosmetic.price,
          date: new Date(dateEntry["Added on"]),
          image: cosmetic.image,
        };
      }
      return null;
    })
    .filter((d) => d !== null)
    .sort((a, b) => a.date - b.date);

  if (mergedData.length === 0) {
    return Plot.plot({
      width,
      height: 400,
      marks: [
        Plot.text([`No data available. Cosmetics: ${cosmetics.length}, Dates: ${cosmeticDates.length}`], {
          x: width / 2,
          y: 200,
          textAnchor: "middle",
          fontSize: 16,
        }),
      ],
    });
  }

  return Plot.plot({
    width,
    height: 500,
    marginLeft: 80,
    marginRight: 40,
    marginBottom: 60,
    marginTop: 40,
    x: {
      label: "Date added",
      type: "time",
    },
    y: {
      label: "Current price (Sweat)",
      // tickFormat: "~s",
      nice: true
    },
    color: {
      scheme: "ylgnbu",
      legend: false,
      label: "Price Range",
    },
    marks: [
      Plot.dot(mergedData, {
        x: "date",
        y: "price",
        fill: "price",
        r: 2.5,
        fillOpacity: 0.7,
        stroke: "white",
        strokeWidth: 0.3,
        tip: {
          lineWidth: 300,
          textPadding: 12,
          pointerSize: 8,
          fontSize: 14,
          lineHeight: 1.1,
          format: { opacity: false, type: false, fy: false, stroke: false },
        },
        title: (d) => [`Cosmetic: ${d.name}`, `Price: ${d.price.toLocaleString()}💧`, `Added: ${d3.timeFormat("%B %d, %Y")(d.date)}`].join("\n\n"),
      }),

      Plot.linearRegressionY(mergedData, {
        x: "date",
        y: "price",
        stroke: "oklch(50.5% 0.213 27.518)",
        strokeWidth: 3,
        strokeOpacity: 0.7,
      }),
    ],
  });
}
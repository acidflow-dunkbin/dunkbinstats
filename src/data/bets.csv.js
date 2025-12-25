import fs from "fs";

function getCategory(title) {
  const t = title.toLowerCase();
  if (t.includes("gungeon")) return "Enter the Gungeon";
  if (t.includes("factorio")) return "Factorio";
  if (t.includes("daily")) return "Daily Run";
  if (t.includes("larpa")) return "Everyone Loves Larpa";
  if (t.includes("nightmare")) return "Nightmare";
  if (t.includes("roulette")) return "Noita Roulette";
  if (t.includes("fungal pain")) return "Fungal Pain";
  if (t.includes("power hour")) return "Power Hour";
  if (t.includes("power words") || t.includes("powerwords")) return "Power Words";
  if (t.includes("random start") || t.includes("random starting") || t.includes("random biome start"))
    return "Random Start";
  if (t.includes("soler")) return "Twitch Integration";
  if (t.includes("oni")) return "Oxygen Not Included";
  if (t.includes("project fleet")) return "Project Fleet";
  if (t.includes("silksong")) return "Hollow Knight: Silksong";
  return "Other";
}

const outputPath = "src/data/bets.csv";

// Delete existing output file if it exists
if (fs.existsSync(outputPath)) {
  fs.rmSync(outputPath);
  console.log("Deleted existing bets.csv");
}

// Process the source file
const rawCsv = fs.readFileSync("src/data/dunkorslam_bets_clean.csv", "utf-8");
const lines = rawCsv.trim().split("\n");
const header = lines[0] + ",category";

const dataLines = lines.slice(1).map((line) => {
  const cols = line.split(",");
  const title = cols[0];

  // Clean duration (index 2) - remove "0 days "
  cols[2] = cols[2].replace("0 days ", "");

  // Clean outcome (index 7)
  cols[7] = cols[7].replace("BetOutcome.LOSS", "Lost").replace("BetOutcome.WIN", "Won");

  return cols.join(",") + "," + getCategory(title);
});

fs.writeFileSync(outputPath, [header, ...dataLines].join("\n"));
console.log(`Processed ${dataLines.length} bets`);

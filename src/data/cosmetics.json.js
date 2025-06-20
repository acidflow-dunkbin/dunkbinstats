import fs from "fs";
import dotenv from "dotenv";
import JSZip from "jszip";

dotenv.config();

const cosmetics_url = "https://dunkbin.com/export/cosmetics";
const users_url = "https://dunkbin.com/export/users";
const backpacks_url = "https://dunkbin.com/export/backpacks";

const username = process.env.DUNKBIN_USER;
const password = process.env.DUNKBIN_PASSWORD;

if (!username || !password) {
  throw new Error("Missing DUNKBIN_USER or DUNKBIN_PASSWORD in .env");
}

const headers = new Headers();
headers.set("Authorization", "Basic " + Buffer.from(`${username}:${password}`).toString("base64"));

async function fetchData(url) {
  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) throw new Error(`fetch failed for ${url}: ${response.status}`);
  return await response.json();
}

const buildInfo = {
  timestamp: new Date().toISOString(),
  build_date: new Date().toLocaleString(),
  build_timestamp: new Date(),
};

// Layer mapping
const layerMap = {
  4: "Hat",
  5: "Face",
  6: "Full Head",
  7: "Neck",
  8: "Body",
};

async function generateCosmeticsData() {
  try {
    console.log("Fetching data from DunkBin API...");
    const [cosmetics, users, backpacks] = await Promise.all([
      fetchData(cosmetics_url),
      fetchData(users_url),
      fetchData(backpacks_url),
    ]);

    // Create users lookup map
    const usersMap = new Map();
    users.forEach((user) => {
      if (user && user.id) {
        usersMap.set(user.id, user);
      }
    });

    const filteredCosmetics = cosmetics.filter(
      (cosmetic) => cosmetic.id !== 0 && cosmetic.id !== 161 && cosmetic.id !== 160
    );
    const cosmeticOwnership = new Map();

    backpacks.forEach((item) => {
      if (!cosmeticOwnership.has(item.item_id)) {
        cosmeticOwnership.set(item.item_id, {
          total_quantity: 0,
          unique_owners: new Set(),
        });
      }
      const ownership = cosmeticOwnership.get(item.item_id);
      ownership.total_quantity += item.qty;
      ownership.unique_owners.add(item.user_id);
    });

    const transformedCosmetics = filteredCosmetics.map((cosmetic) => {
      const ownership = cosmeticOwnership.get(cosmetic.id) || {
        total_quantity: 0,
        unique_owners: new Set(),
      };

      let authorUser = null;
      if (cosmetic.author && usersMap.has(cosmetic.author)) {
        authorUser = usersMap.get(cosmetic.author);
      }
      const authorName = authorUser ? authorUser.display_name : cosmetic.author || "Unknown";
      const authorPfp = authorUser
        ? `${authorUser.id}.png`
        : cosmetic.author
        ? `${cosmetic.author}.png`
        : "no_image_available.png";

      return {
        id: cosmetic.id,
        name: cosmetic.name,
        layer: cosmetic.layer,
        layer_name: layerMap[cosmetic.layer] || `Layer ${cosmetic.layer}`,
        author: cosmetic.author,
        author_name: authorName,
        author_pfp: authorPfp,
        delay: cosmetic.delay,
        md5: cosmetic.md5,
        price: cosmetic.currentCost || 0,
        image: `${cosmetic.id}.png`,
        total_owned: ownership.total_quantity,
        unique_owners: ownership.unique_owners.size,
        total_market_value: (cosmetic.currentCost || 0) * ownership.total_quantity,
      };
    });

    transformedCosmetics.sort((a, b) => a.name.localeCompare(b.name));

    const jsonPath = "./src/data/cosmetics.json";
    fs.writeFileSync(jsonPath, JSON.stringify(transformedCosmetics, null, 2), "utf-8");
    console.log(`Enhanced ${transformedCosmetics.length} cosmetics with ownership data`);

    const zip = new JSZip();
    const jsonContent = fs.readFileSync(jsonPath);
    zip.file("cosmetics.json", jsonContent, {
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    const zipPath = "./src/data/cosmetics.zip";
    const zipContent = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });
    fs.writeFileSync(zipPath, zipContent);

    // Write build info to separate file
    fs.writeFileSync("./src/data/buildDate.json", JSON.stringify(buildInfo, null, 2));
    console.log("Wrote build info to builddate.json");

    const jsonSize = fs.statSync(jsonPath).size;
    const zipSize = fs.statSync(zipPath).size;
    console.log(`JSON size: ${(jsonSize / 1024).toFixed(2)} KB`);
    console.log(`ZIP size: ${(zipSize / 1024).toFixed(2)} KB`);
    console.log(`Compression ratio: ${((1 - zipSize / jsonSize) * 100).toFixed(2)}%`);

    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(jsonPath);
      console.log("Successfully created ZIP and removed JSON file");
    }
  } catch (error) {
    console.error("Error generating cosmetics data:", error);
    throw error;
  }
}

generateCosmeticsData();

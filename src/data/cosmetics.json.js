import fs from "fs";
import dotenv from "dotenv";
import JSZip from "jszip";

dotenv.config();

// Dunkbin API endpoints
const cosmetics_url = "https://dunkbin.com/export/cosmetics";
const users_url = "https://dunkbin.com/export/users";
const backpacks_url = "https://dunkbin.com/export/backpacks";

// NEW: Endpoint for the PFP extension map from the decoupled service
const pfp_map_url = "https://dunkbinstats-users-images.acidflow.stream/pfp_map.json";

const username = process.env.DUNKBIN_USER;
const password = process.env.DUNKBIN_PASSWORD;

if (!username || !password) {
  throw new Error("Missing DUNKBIN_USER or DUNKBIN_PASSWORD in .env");
}

const headers = new Headers();
headers.set("Authorization", "Basic " + Buffer.from(`${username}:${password}`).toString("base64"));

async function fetchData(url, isJson = true) {
  const response = await fetch(url, { method: "GET", headers: url.startsWith("https://dunkbin.com") ? headers : {} });
  if (!response.ok) throw new Error(`fetch failed for ${url}: ${response.status}`);
  return isJson ? await response.json() : await response.text();
}

const buildInfo = {
  timestamp: new Date().toISOString(),
  build_date: new Date().toLocaleString(),
  build_timestamp: new Date(),
};

const layerMap = {
  4: "Hat",
  5: "Face",
  6: "Full Head",
  7: "Neck",
  8: "Body",
};

async function generateCosmeticsData() {
  try {
    const [cosmetics, users, backpacks, pfpMap] = await Promise.all([
      fetchData(cosmetics_url),
      fetchData(users_url),
      fetchData(backpacks_url),
      fetchData(pfp_map_url),
    ]);

    const usersMap = new Map();
    users.forEach((user) => {
      if (user && user.id) {
        usersMap.set(user.id, user);
      }
    });

    const filteredCosmetics = cosmetics.filter((cosmetic) => cosmetic.id !== 0);
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
      const ownership = cosmeticOwnership.get(cosmetic.id) || { total_quantity: 0, unique_owners: new Set() };
      const authorUser = cosmetic.author ? usersMap.get(cosmetic.author) : null;
      const authorName = authorUser ? authorUser.display_name : cosmetic.author || "Unknown";

      let authorPfp = "no_image_available.png";
      if (cosmetic.author && pfpMap[cosmetic.author]) {
        const extension = pfpMap[cosmetic.author];
        authorPfp = `${cosmetic.author}.${extension}`;
      }

      return {
        id: cosmetic.id,
        name: cosmetic.name,
        layer: cosmetic.layer,
        layer_name: layerMap[cosmetic.layer] || `Layer ${cosmetic.layer}`,
        author: cosmetic.author,
        author_name: authorName,
        author_pfp: authorPfp,
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

    const zip = new JSZip();
    zip.file("cosmetics.json", fs.readFileSync(jsonPath));
    const zipContent = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    fs.writeFileSync("./src/data/cosmetics.zip", zipContent);
    fs.unlinkSync(jsonPath);

    // Write build info to separate file
    fs.writeFileSync("./src/data/buildDate.json", JSON.stringify(buildInfo, null, 2));
    console.log("Wrote build info to builddate.json");

    console.log(`Successfully generated cosmetics.zip`);
  } catch (error) {
    console.error("Error generating cosmetics data:", error);
    throw error;
  }
}

generateCosmeticsData();

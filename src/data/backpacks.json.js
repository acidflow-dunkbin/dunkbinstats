import fs from "fs";
import dotenv from "dotenv";
import JSZip from "jszip";

dotenv.config();

const backpacks_url = "https://dunkbin.com/export/backpacks";
const cosmetics_url = "https://dunkbin.com/export/cosmetics";
const users_url = "https://dunkbin.com/export/users";

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

// Layer mapping
const layerMap = {
  4: "Hat",
  5: "Face",
  6: "Full Head",
  7: "Neck",
  8: "Body",
};

async function generateBackpacksData() {
  try {
    console.log("Fetching data from DunkBin API...");
    const [backpacks, cosmetics, users] = await Promise.all([
      fetchData(backpacks_url),
      fetchData(cosmetics_url),
      fetchData(users_url),
    ]);

    const cosmeticsMap = new Map();
    cosmetics.forEach((cosmetic) => {
      if (cosmetic.id !== 0 && cosmetic.id !== 161 && cosmetic.id !== 160) {
        cosmeticsMap.set(cosmetic.id, cosmetic);
      }
    });

    const usersMap = new Map();
    users.forEach((user) => {
      usersMap.set(user.id, user);
    });

    const enhancedBackpacks = backpacks
      .filter((item) => cosmeticsMap.has(item.item_id))
      .map((item) => {
        const cosmetic = cosmeticsMap.get(item.item_id);
        const user = usersMap.get(item.user_id);

        let authorName = cosmetic.author;
        if (cosmetic.author && usersMap.has(cosmetic.author)) {
          authorName = usersMap.get(cosmetic.author).display_name;
        }

        return {
          user_id: item.user_id,
          user_login: user ? user.login : "unknown",
          user_display_name: user ? user.display_name : "Unknown User",
          user_pfp: user && user.id ? `${user.id}.png` : "no_image_available.png",
          item_id: item.item_id,
          item_name: cosmetic.name,
          item_layer: cosmetic.layer,
          item_layer_name: layerMap[cosmetic.layer] || `Layer ${cosmetic.layer}`,
          item_author: cosmetic.author,
          item_author_name: authorName || "Unknown",
          item_price: cosmetic.currentCost || 0,
          item_image: `${cosmetic.id}.png`,
          quantity: item.qty,
          total_value: (cosmetic.currentCost || 0) * item.qty,
        };
      });

    enhancedBackpacks.sort((a, b) => {
      const userCompare = a.user_display_name.localeCompare(b.user_display_name);
      if (userCompare !== 0) return userCompare;
      return a.item_name.localeCompare(b.item_name);
    });

    const jsonPath = "./src/data/backpacks.json";
    fs.writeFileSync(jsonPath, JSON.stringify(enhancedBackpacks, null, 2), "utf-8");
    console.log(`Saved JSON file with ${enhancedBackpacks.length} backpack entries`);

    const zip = new JSZip();
    const jsonContent = fs.readFileSync(jsonPath);
    zip.file("backpacks.json", jsonContent, {
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    const zipPath = "./src/data/backpacks.zip";
    const zipContent = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });
    fs.writeFileSync(zipPath, zipContent);

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
    console.error("Error generating backpacks data:", error);
    throw error;
  }
}

generateBackpacksData();

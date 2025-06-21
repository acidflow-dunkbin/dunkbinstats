import fs from "fs";
import dotenv from "dotenv";
import JSZip from "jszip";

dotenv.config();

// Dunkbin API endpoints
const backpacks_url = "https://dunkbin.com/export/backpacks";
const cosmetics_url = "https://dunkbin.com/export/cosmetics";
const users_url = "https://dunkbin.com/export/users";

// NEW: Endpoint for the PFP extension map
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

const layerMap = {
  4: "Hat",
  5: "Face",
  6: "Full Head",
  7: "Neck",
  8: "Body",
};

async function generateBackpacksData() {
  try {
    const [backpacks, cosmetics, users, pfpMap] = await Promise.all([
      fetchData(backpacks_url),
      fetchData(cosmetics_url),
      fetchData(users_url),
      fetchData(pfp_map_url),
    ]);

    const cosmeticsMap = new Map(cosmetics.map((c) => [c.id, c]));
    const usersMap = new Map(users.map((u) => [u.id, u]));

    const enhancedBackpacks = backpacks
      .filter((item) => cosmeticsMap.has(item.item_id))
      .map((item) => {
        const cosmetic = cosmeticsMap.get(item.item_id);
        const user = usersMap.get(item.user_id);
        const authorInfo = usersMap.get(cosmetic.author);

        let userPfpFile = "no_image_available.png";
        if (user && pfpMap[user.id]) {
          userPfpFile = `${user.id}.${pfpMap[user.id]}`;
        }

        return {
          user_id: user.id,
          user_login: user.login,
          user_display_name: user.display_name,
          user_pfp: userPfpFile,
          item_id: item.item_id,
          item_name: cosmetic.name,
          item_layer: cosmetic.layer,
          item_layer_name: layerMap[cosmetic.layer] || `Layer ${cosmetic.layer}`,
          item_author: cosmetic.author,
          item_author_name: authorInfo ? authorInfo.display_name : "Unknown",
          item_price: cosmetic.currentCost || 0,
          item_image: `${cosmetic.id}.png`,
          quantity: item.qty,
          total_value: (cosmetic.currentCost || 0) * item.qty,
        };
      });

    enhancedBackpacks.sort(
      (a, b) => a.user_display_name.localeCompare(b.user_display_name) || a.item_name.localeCompare(b.item_name)
    );

    const jsonPath = "./src/data/backpacks.json";
    fs.writeFileSync(jsonPath, JSON.stringify(enhancedBackpacks, null, 2), "utf-8");

    const zip = new JSZip();
    zip.file("backpacks.json", fs.readFileSync(jsonPath));
    const zipContent = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    fs.writeFileSync("./src/data/backpacks.zip", zipContent);
    fs.unlinkSync(jsonPath);

    console.log(`Successfully generated backpacks.zip`);
  } catch (error) {
    console.error("Error generating backpacks data:", error);
    throw error;
  }
}

generateBackpacksData();

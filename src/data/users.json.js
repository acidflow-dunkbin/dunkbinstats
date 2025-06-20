import fs from "fs";
import dotenv from "dotenv";
import JSZip from "jszip";

dotenv.config();

// Dunkbin API endpoints
const users_url = "https://dunkbin.com/export/users";
const backpacks_url = "https://dunkbin.com/export/backpacks";
const cosmetics_url = "https://dunkbin.com/export/cosmetics";

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

async function generateUserStats() {
  try {
    const [users, backpacks, cosmetics, pfpMap] = await Promise.all([
      fetchData(users_url),
      fetchData(backpacks_url),
      fetchData(cosmetics_url),
      fetchData(pfp_map_url),
    ]);

    const cosmeticsMap = new Map(cosmetics.map((c) => [c.id, c]));
    const usersMap = new Map(users.map((u) => [u.id, u]));
    const userStats = new Map();

    backpacks.forEach((item) => {
      if (!usersMap.has(item.user_id) || !cosmeticsMap.has(item.item_id)) return;

      if (!userStats.has(item.user_id)) {
        const user = usersMap.get(item.user_id);
        userStats.set(item.user_id, {
          user_id: user.id,
          login: user.login,
          display_name: user.display_name,
          total_items_owned: 0,
          unique_items_owned: 0,
          unique_items_cost: 0,
          total_items_cost: 0,
          items: new Set(),
        });
      }

      const stats = userStats.get(item.user_id);
      const cosmetic = cosmeticsMap.get(item.item_id);
      stats.total_items_owned += item.qty;
      stats.total_items_cost += (cosmetic.currentCost || 0) * item.qty;

      if (!stats.items.has(item.item_id)) {
        stats.items.add(item.item_id);
        stats.unique_items_owned += 1;
        stats.unique_items_cost += cosmetic.currentCost || 0;
      }
    });

    const totalUniqueItems = cosmeticsMap.size;
    const userStatsArray = Array.from(userStats.values()).map((stats) => {
      let userPfpFile = "no_image_available.png";
      if (stats.user_id && pfpMap[stats.user_id]) {
        userPfpFile = `${stats.user_id}.${pfpMap[stats.user_id]}`;
      }

      return {
        ...stats,
        collection_completion_percentage:
          totalUniqueItems > 0 ? Math.round((stats.unique_items_owned / totalUniqueItems) * 100) : 0,
        user_pfp: userPfpFile,
      };
    });

    userStatsArray.sort((a, b) => b.collection_completion_percentage - a.collection_completion_percentage);

    const jsonPath = "./src/data/users.json";
    fs.writeFileSync(jsonPath, JSON.stringify(userStatsArray, null, 2), "utf-8");

    const zip = new JSZip();
    zip.file("users.json", fs.readFileSync(jsonPath));
    const zipContent = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    fs.writeFileSync("./src/data/users.zip", zipContent);
    fs.unlinkSync(jsonPath);

    console.log(`Successfully generated users.zip`);
  } catch (error) {
    console.error("Error generating user stats:", error);
    throw error;
  }
}

generateUserStats();

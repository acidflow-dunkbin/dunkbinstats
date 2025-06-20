import fs from "fs";
import dotenv from "dotenv";
import JSZip from "jszip";

dotenv.config();

const users_url = "https://dunkbin.com/export/users";
const backpacks_url = "https://dunkbin.com/export/backpacks";
const cosmetics_url = "https://dunkbin.com/export/cosmetics";

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

async function generateUserStats() {
  try {
    console.log("Fetching data from DunkBin API...");
    const [users, backpacks, cosmetics] = await Promise.all([
      fetchData(users_url),
      fetchData(backpacks_url),
      fetchData(cosmetics_url),
    ]);

    // Create cosmetics lookup map
    const cosmeticsMap = new Map();
    cosmetics.forEach((cosmetic) => {
      if (cosmetic.id !== 0 && cosmetic.id !== 161 && cosmetic.id !== 160) {
        cosmeticsMap.set(cosmetic.id, cosmetic);
      }
    });

    // Create users lookup map
    const usersMap = new Map();
    users.forEach((user) => {
      usersMap.set(user.id, user);
    });

    // Calculate user statistics
    const userStats = new Map();

    backpacks.forEach((item) => {
      const userId = item.user_id;
      const cosmetic = cosmeticsMap.get(item.item_id);

      if (!cosmetic || !usersMap.has(userId)) return;

      if (!userStats.has(userId)) {
        const user = usersMap.get(userId);
        userStats.set(userId, {
          user_id: userId,
          login: user.login,
          display_name: user.display_name,
          total_items_owned: 0,
          unique_items_owned: 0,
          unique_items_cost: 0,
          total_items_cost: 0,
          items: new Set(),
        });
      }

      const stats = userStats.get(userId);
      const itemCost = cosmetic.currentCost || 0;

      stats.total_items_owned += item.qty;
      stats.total_items_cost += itemCost * item.qty;

      if (!stats.items.has(item.item_id)) {
        stats.items.add(item.item_id);
        stats.unique_items_owned += 1;
        stats.unique_items_cost += itemCost;
      }
    });

    const totalUniqueItems = Array.from(cosmeticsMap.values()).length;

    const userStatsArray = Array.from(userStats.values()).map((stats) => ({
      user_id: stats.user_id,
      login: stats.login,
      display_name: stats.display_name,
      total_items_owned: stats.total_items_owned,
      unique_items_owned: stats.unique_items_owned,
      unique_items_cost: stats.unique_items_cost,
      total_items_cost: stats.total_items_cost,
      collection_completion_percentage: parseInt((stats.unique_items_owned / totalUniqueItems) * 100),
      // Store filename that external service will serve
      user_pfp: stats.user_id ? `${stats.user_id}.png` : "no_image_available.png",
    }));

    userStatsArray.sort((a, b) => b.total_items_owned - a.total_items_owned);

    const jsonPath = "./src/data/users.json";
    fs.writeFileSync(jsonPath, JSON.stringify(userStatsArray, null, 2), "utf-8");
    console.log(`Generated stats for ${userStatsArray.length} users`);

    const zip = new JSZip();
    const jsonContent = fs.readFileSync(jsonPath);
    zip.file("users.json", jsonContent, {
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    const zipPath = "./src/data/users.zip";
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
    console.error("Error generating user stats:", error);
    throw error;
  }
}

generateUserStats();

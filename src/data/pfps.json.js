import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import JSZip from "jszip";

dotenv.config();

const users_url = "https://dunkbin.com/export/users";
const username = process.env.DUNKBIN_USER;
const password = process.env.DUNKBIN_PASSWORD;
const twitchClientId = process.env.TWITCH_CLIENT_ID;
const twitchAccessToken = process.env.TWITCH_ACCESS_TOKEN;

if (!username || !password || !twitchClientId || !twitchAccessToken) {
  throw new Error("Missing required environment variables");
}

const headers = new Headers();
headers.set("Authorization", "Basic " + Buffer.from(`${username}:${password}`).toString("base64"));

const pfpMappingFile = "./src/data/pfp_map.json";
const outputZipFile = "./src/data/pfp_map.zip";

async function fetchData(url) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { method: "GET", headers });

      if (!response.ok) {
        // Handle different HTTP status codes
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        } else if (response.status === 429) {
          if (attempt < maxRetries) {
            const retryAfter = response.headers.get("retry-after") || 60;
            console.warn(
              `Rate limited fetching ${url}. Attempt ${attempt}/${maxRetries}. Waiting ${retryAfter} seconds...`
            );
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
            continue;
          } else {
            throw new Error(`Rate limit exceeded after ${maxRetries} attempts`);
          }
        } else if (response.status >= 400) {
          throw new Error(`Client error: ${response.status} - ${response.statusText}`);
        }
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff for retries (but not for rate limiting, that's handled above)
      if (!error.message.includes("Rate limit")) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.warn(`Attempt ${attempt}/${maxRetries} failed for ${url}: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}

async function fetchTwitchToken() {
  // Refresh Twitch OAuth token using client credentials
  const params = new URLSearchParams();
  params.append("client_id", twitchClientId);
  params.append("client_secret", process.env.TWITCH_CLIENT_SECRET);
  params.append("grant_type", "client_credentials");

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!response.ok) throw new Error("Failed to refresh Twitch token: " + response.status);
  const data = await response.json();
  return data.access_token;
}

// Global token management
let currentTwitchToken = twitchAccessToken;
let tokenRefreshPromise = null;

async function getValidTwitchToken() {
  // If there's already a refresh in progress, wait for it
  if (tokenRefreshPromise) {
    console.log("Token refresh already in progress, waiting...");
    return await tokenRefreshPromise;
  }

  try {
    // Try refresh token first
    const refreshToken = process.env.TWITCH_REFRESH_TOKEN;
    if (refreshToken) {
      tokenRefreshPromise = fetchTwitchTokenWithRefresh(refreshToken);
      currentTwitchToken = await tokenRefreshPromise;
      console.log("Successfully refreshed token using refresh_token");
    } else {
      // Fallback to client credentials
      console.log("No refresh token available, using client credentials flow");
      tokenRefreshPromise = fetchTwitchToken();
      currentTwitchToken = await tokenRefreshPromise;
      updateEnvAccessToken(currentTwitchToken);
    }

    tokenRefreshPromise = null;
    return currentTwitchToken;
  } catch (error) {
    tokenRefreshPromise = null;
    console.error("Failed to refresh token:", error.message);
    throw error;
  }
}

function updateEnvAccessToken(newToken) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  let envContent = fs.readFileSync(envPath, "utf8");
  if (envContent.includes("TWITCH_ACCESS_TOKEN=")) {
    envContent = envContent.replace(/TWITCH_ACCESS_TOKEN=.*/g, `TWITCH_ACCESS_TOKEN=${newToken}`);
  } else {
    envContent += `\nTWITCH_ACCESS_TOKEN=${newToken}`;
  }
  fs.writeFileSync(envPath, envContent);
  console.log("Updated .env with new TWITCH_ACCESS_TOKEN");
}

async function fetchTwitchTokenWithRefresh(refreshToken) {
  // Refresh Twitch OAuth token using refresh_token grant
  const params = new URLSearchParams();
  params.append("client_id", twitchClientId);
  params.append("client_secret", process.env.TWITCH_CLIENT_SECRET);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!response.ok) {
    throw new Error(`Failed to refresh Twitch token with refresh_token: ${response.status} - ${await response.text()}`);
  }
  const data = await response.json();
  if (data.access_token) {
    updateEnvAccessToken(data.access_token);
    // Also update refresh token if provided
    if (data.refresh_token) {
      updateEnvRefreshToken(data.refresh_token);
    }
  }
  return data.access_token;
}

function updateEnvRefreshToken(newRefreshToken) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  let envContent = fs.readFileSync(envPath, "utf8");
  if (envContent.includes("TWITCH_REFRESH_TOKEN=")) {
    envContent = envContent.replace(/TWITCH_REFRESH_TOKEN=.*/g, `TWITCH_REFRESH_TOKEN=${newRefreshToken}`);
  } else {
    envContent += `\nTWITCH_REFRESH_TOKEN=${newRefreshToken}`;
  }
  fs.writeFileSync(envPath, envContent);
  console.log("Updated .env with new TWITCH_REFRESH_TOKEN");
}

async function fetchTwitchUsers(usernames, token) {
  const chunks = [];
  for (let i = 0; i < usernames.length; i += 100) {
    chunks.push(usernames.slice(i, i + 100));
  }

  const allUsers = [];
  console.log(`Fetching Twitch data for ${usernames.length} users in ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const params = new URLSearchParams();
    chunk.forEach((username) => params.append("login", username));

    let response;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        response = await fetch(`https://api.twitch.tv/helix/users?${params}`, {
          headers: {
            "Client-ID": twitchClientId,
            Authorization: `Bearer ${currentTwitchToken}`,
          },
        });

        // Handle auth errors (400, 401)
        if (response.status === 401 || response.status === 400) {
          if (retryCount < maxRetries) {
            console.warn(
              `Auth error ${response.status} on chunk ${i + 1}, attempt ${retryCount + 1}/${
                maxRetries + 1
              }, refreshing token...`
            );
            currentTwitchToken = await getValidTwitchToken();
            retryCount++;
            continue;
          } else {
            console.error(`Failed to authenticate after ${maxRetries + 1} attempts on chunk ${i + 1}`);
            break;
          }
        }

        // Handle rate limiting
        if (response.status === 429) {
          if (retryCount < maxRetries) {
            const retryAfter = response.headers.get("retry-after") || 60;
            console.warn(
              `Rate limited on chunk ${i + 1}, attempt ${retryCount + 1}/${
                maxRetries + 1
              }. Waiting ${retryAfter} seconds...`
            );
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
            retryCount++;
            continue;
          } else {
            console.error(`Rate limit exceeded after ${maxRetries + 1} attempts on chunk ${i + 1}`);
            break;
          }
        }

        // Handle server errors
        if (response.status >= 500) {
          if (retryCount < maxRetries) {
            console.warn(`Server error ${response.status} on chunk ${i + 1}, retrying...`);
            retryCount++;
            await new Promise((resolve) => setTimeout(resolve, 2000 * retryCount));
            continue;
          }
        }

        if (!response.ok) {
          console.error(`Failed to fetch Twitch users chunk ${i + 1}: ${response.status} - ${response.statusText}`);
          break;
        }

        const data = await response.json();
        console.log(`Chunk ${i + 1}: Retrieved ${data.data.length} Twitch users`);
        allUsers.push(...data.data);
        break; // Success, exit retry loop
      } catch (error) {
        if (retryCount < maxRetries) {
          console.warn(
            `Network error on chunk ${i + 1}, attempt ${retryCount + 1}/${maxRetries + 1}: ${error.message}`
          );
          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        } else {
          console.error(`Error fetching chunk ${i + 1} after ${maxRetries + 1} attempts: ${error.message}`);
          break;
        }
      }
    }

    if (i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200)); // Slightly longer delay
    }
  }

  console.log(`Successfully fetched ${allUsers.length}/${usernames.length} Twitch users`);
  return allUsers;
}

async function generateProfilePictureMapping() {
  try {
    console.log("Starting profile picture mapping generation");
    console.log("==========================================");

    // Fetch users from DunkBin
    console.log("Fetching users from DunkBin...");
    const users = await fetchData(users_url);
    console.log(`Found ${users.length} users`);

    // Fetch Twitch user data
    const usernames = users.map((user) => user.login).filter(Boolean);
    const twitchUsers = await fetchTwitchUsers(usernames, currentTwitchToken);

    // Create Twitch profile image map
    const twitchProfileImages = new Map();
    twitchUsers.forEach((user) => {
      if (user.login && user.profile_image_url) {
        twitchProfileImages.set(user.login.toLowerCase(), user.profile_image_url);
      }
    });

    // Initialize the user PFP mapping
    const userPfpMapping = {
      metadata: {
        generated: new Date().toISOString(),
        totalUsers: users.length,
        usersWithPfp: 0,
        usersWithoutPfp: 0,
        script_version: "mapper.json.js",
        description: "Profile picture mapping without image downloads",
      },
      users: {},
    };

    let usersWithPfp = 0;
    let usersWithoutPfp = 0;

    // Process all users
    users.forEach((user) => {
      const profileImageUrl = user.login ? twitchProfileImages.get(user.login.toLowerCase()) : null;
      const hasPfp = !!profileImageUrl;

      if (hasPfp) {
        usersWithPfp++;
      } else {
        usersWithoutPfp++;
      }

      userPfpMapping.users[user.id] = {
        username: user.login || "unknown",
        display_name: user.display_name || user.login || "unknown",
        pfp_filename: hasPfp ? `${user.id}.png` : "no_image_available.png", // Assumed filename
        has_custom_pfp: hasPfp,
        twitch_profile_url: profileImageUrl || null,
        last_updated: new Date().toISOString(),
        reason: hasPfp ? null : "No Twitch profile image available",
      };

      if (hasPfp) {
        console.log(`✓ User ${user.id} (${user.login}): Has profile image`);
      } else {
        console.log(`✗ User ${user.id} (${user.login || "unknown"}): No profile image available`);
      }
    });

    // Update metadata
    userPfpMapping.metadata.usersWithPfp = usersWithPfp;
    userPfpMapping.metadata.usersWithoutPfp = usersWithoutPfp;

    fs.writeFileSync(pfpMappingFile, JSON.stringify(userPfpMapping, null, 2), "utf-8");

    const zip = new JSZip();
    zip.file("pfp_map.json", fs.readFileSync(pfpMappingFile));
    const zipContent = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    fs.writeFileSync(outputZipFile, zipContent);
    fs.unlinkSync(pfpMappingFile);

    console.log("\n==========================================");
    console.log("Profile picture mapping completed!");
    console.log(`Total users: ${users.length}`);
    console.log(`Users with profile images: ${usersWithPfp}`);
    console.log(`Users without profile images: ${usersWithoutPfp}`);
    console.log(`Mapping saved and zipped to: ${outputZipFile}`);
    console.log("==========================================");

    process.exit(0);
  } catch (error) {
    console.error("Fatal error in generateProfilePictureMapping:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the mapping generation process
generateProfilePictureMapping().catch(console.error);

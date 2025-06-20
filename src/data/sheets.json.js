import { config } from "dotenv";
import { promises as fs } from "fs";
import { google } from "googleapis";

config();

// Load credentials from environment
const credentials = {
  type: process.env.type,
  project_id: process.env.project_id,
  private_key_id: process.env.private_key_id,
  private_key: process.env.private_key.replace(/\\n/g, "\n"),
  client_email: process.env.client_email,
  client_id: process.env.client_id,
  auth_uri: process.env.auth_uri,
  token_uri: process.env.token_uri,
  auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
  client_x509_cert_url: process.env.client_x509_cert_url,
  universe_domain: process.env.universe_domain,
};

// Configure auth client
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

// Initialize the Sheets API
const sheets = google.sheets({ version: "v4", auth });

function formatSheetData(rawData) {
  if (!rawData || rawData.length < 2) return { error: "Invalid data format" };

  const headers = rawData[0];
  const rows = rawData.slice(1);

  return {
    metadata: {
      totalRows: rows.length,
      totalColumns: headers.length,
      lastUpdated: new Date().toISOString(),
    },
    headers: headers,
    data: rows.map((row) => {
      const rowObject = {};
      headers.forEach((header, index) => {
        if (header && header.trim()) {
          // Only process non-empty headers
          rowObject[header.trim()] = row[index] || null;
        }
      });
      return rowObject;
    }),
  };
}

async function getSheetData() {
  try {
    const spreadsheetId = "1VscyNGvC_S4mRg_6uMscdXxTDPA1hjEIRkJPOcZjMaQ";
    const range = "A:Z"; // Fetch all columns, adjust if you need specific ranges

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const formattedData = formatSheetData(response.data.values);

    // Write the formatted data to sheets.json
    await fs.writeFile("src/data/sheets.json", JSON.stringify(formattedData, null, 2));

    console.log("Data successfully fetched, formatted, and saved to sheets.json");
  } catch (error) {
    console.error("Error fetching sheet data:", error);
  }
}

getSheetData();

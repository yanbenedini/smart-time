<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1lyZdrwGh4YQqji04lpjtFbZmNMTrw2NG

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

# PRODUÇÃO:

/services/dbService.ts
const API_URL = "http://163.176.231.117:5000";
host: process.env.DB_HOST || "db",
port: Number(process.env.DB_PORT) || 5432,
password: process.env.DB_PASSWORD || "postgres",

# DESENVOLVIMENTO:

/services/dbService.ts
const API_URL = "http://localhost:5000";
host: "localhost",
port: 5433,
password: "password123",

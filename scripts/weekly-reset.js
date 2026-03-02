#!/usr/bin/env node

// Weekly reset script — archives ALL open tasks including "week" focus tasks.
// Runs Saturday at 8:00 AM UTC (3:00 AM EST) via Heroku Scheduler.
// Usage: node scripts/weekly-reset.js
// Requires env vars: APP_URL, CRON_SECRET

const https = require("https");
const http = require("http");

async function runWeeklyReset() {
  // Only run on Saturdays (day 6 in UTC)
  const nowUtc = new Date();
  if (nowUtc.getUTCDay() !== 6) {
    console.log(`⏭️  Skipping weekly reset — today is not Saturday (UTC day ${nowUtc.getUTCDay()})`);
    process.exit(0);
  }

  const appUrl = process.env.APP_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!appUrl) {
    console.error("❌ APP_URL environment variable is not set");
    process.exit(1);
  }

  if (!cronSecret) {
    console.error("❌ CRON_SECRET environment variable is not set");
    process.exit(1);
  }

  const url = `${appUrl}/api/admin/tasks/weekly-reset`;
  console.log(`Running weekly reset: POST ${url}`);

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": 0,
        Authorization: `Bearer ${cronSecret}`,
      },
    };

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`✅ ${json.message}`);
            resolve(json);
          } else {
            console.error(`❌ Weekly reset failed (HTTP ${res.statusCode}):`, json.error || data);
            process.exit(1);
          }
        } catch {
          console.error("❌ Invalid response:", data);
          process.exit(1);
        }
      });
    });

    req.on("error", (err) => {
      console.error("❌ Request error:", err.message);
      process.exit(1);
    });

    req.end();
  });
}

runWeeklyReset();

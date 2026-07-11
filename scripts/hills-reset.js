#!/usr/bin/env node

// Hills focus reset — the successor to daily-reset.js / weekly-reset.js, pointed
// at the unified hill_tasks table (personal-scope only, non-destructive).
//
//   node scripts/hills-reset.js            # daily  (clears now/today, keeps week)
//   node scripts/hills-reset.js --weekly   # weekly (clears all focus)
//
// Heroku Scheduler: set APP_URL + CRON_SECRET and schedule
//   node scripts/hills-reset.js            @ 3AM EST daily
//   node scripts/hills-reset.js --weekly   @ 3AM EST Saturday

const https = require("https");
const http = require("http");

const mode = process.argv.includes("--weekly") ? "weekly" : "daily";
const appUrl = process.env.APP_URL;
const cronSecret = process.env.CRON_SECRET;

if (!appUrl || !cronSecret) {
  console.error("❌ APP_URL and CRON_SECRET must be set");
  process.exit(1);
}

const url = `${appUrl}/api/admin/hills/reset?mode=${mode}`;
const parsed = new URL(url);
const lib = parsed.protocol === "https:" ? https : http;

const req = lib.request(
  {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
    path: parsed.pathname + parsed.search,
    method: "POST",
    headers: { "Content-Length": 0, Authorization: `Bearer ${cronSecret}` },
  },
  (res) => {
    let data = "";
    res.on("data", (c) => (data += c));
    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log(`✅ hills ${mode} reset:`, data);
      } else {
        console.error(`❌ ${res.statusCode}:`, data);
        process.exit(1);
      }
    });
  }
);
req.on("error", (e) => {
  console.error("❌ request failed:", e.message);
  process.exit(1);
});
req.end();

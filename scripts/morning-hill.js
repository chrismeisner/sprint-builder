#!/usr/bin/env node

// The morning ritual — ensures today's day-hill and emails the studio owner a
// calm "let's start today's hill" nudge.
//
//   node scripts/morning-hill.js
//
// Heroku Scheduler: set APP_URL + CRON_SECRET and schedule this daily at the
// desired early-morning time (e.g. 6:30 AM ET) alongside scripts/hills-reset.js.

const https = require("https");
const http = require("http");

const appUrl = process.env.APP_URL;
const cronSecret = process.env.CRON_SECRET;

if (!appUrl || !cronSecret) {
  console.error("❌ APP_URL and CRON_SECRET must be set");
  process.exit(1);
}

const parsed = new URL(`${appUrl}/api/cron/morning-hill`);
const lib = parsed.protocol === "https:" ? https : http;

const req = lib.request(
  {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
    path: parsed.pathname,
    method: "POST",
    headers: { "Content-Length": 0, Authorization: `Bearer ${cronSecret}` },
  },
  (res) => {
    let data = "";
    res.on("data", (c) => (data += c));
    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log("✅ morning hill:", data);
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

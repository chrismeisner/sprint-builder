#!/usr/bin/env node

// Refinement Cycle deposit-expiry sweep.
// Run by Heroku Scheduler at ~10:01 ET each day:
//   node scripts/expire-refinement-cycle-deposits.js
// Requires env vars: APP_URL, CRON_SECRET

const https = require("https");
const http = require("http");

async function run() {
  const appUrl = process.env.APP_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!appUrl) {
    console.error("APP_URL environment variable is not set");
    process.exit(1);
  }
  if (!cronSecret) {
    console.error("CRON_SECRET environment variable is not set");
    process.exit(1);
  }

  const url = `${appUrl}/api/cron/refinement-cycles/expire-deposits`;
  console.log(`POST ${url}`);

  return new Promise((resolve) => {
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
            console.log(
              `Expired ${json.expired ?? 0} cycle(s)${json.ids?.length ? `: ${json.ids.join(", ")}` : ""}`
            );
            resolve(json);
          } else {
            console.error(`HTTP ${res.statusCode}:`, json.error || data);
            process.exit(1);
          }
        } catch {
          console.error("Invalid response:", data);
          process.exit(1);
        }
      });
    });

    req.on("error", (err) => {
      console.error("Request error:", err.message);
      process.exit(1);
    });

    req.end();
  });
}

run();

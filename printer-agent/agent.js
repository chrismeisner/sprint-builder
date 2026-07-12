// The Boss print agent (downloaded bundle).
//
// Runs on the always-on Mac connected to the receipt printer. It only makes
// OUTBOUND calls to the server: poll for jobs, print them on the local CUPS
// queue, report status. No inbound ports needed.
//
// Config is read from the ./.env file shipped in this bundle (already filled in
// with your server URL and this agent's key). Edit PRINTERS to match your CUPS
// queue name if it isn't EPSON_TM_T88V.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  getPrinterHealth,
  printTaskReceipt,
  previewTaskReceipt,
  printSheetReceipt,
  previewSheetReceipt,
  printNoteReceipt,
  previewNoteReceipt,
} from "./printer.js";
import { AGENT_VERSION } from "./version.js";

const HERE = dirname(fileURLToPath(import.meta.url));

// Minimal .env loader (no dependencies). Existing process env wins.
function loadEnvFile() {
  let text;
  try {
    text = readFileSync(join(HERE, ".env"), "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim();
  }
}
loadEnvFile();

const SERVER_URL = required("SERVER_URL");
const AGENT_KEY = required("AGENT_KEY");
const PRINTERS = (process.env.PRINTERS || "").split(",").map((s) => s.trim()).filter(Boolean);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 5000;
const MAX_CLAIM = Number(process.env.MAX_CLAIM) || 5;
const DRY_RUN = process.env.DRY_RUN === "1";

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`[agent] ${name} is required (check .env).`);
    process.exit(1);
  }
  return value;
}

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(new URL(path, SERVER_URL), {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${AGENT_KEY}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status} on ${path}`);
  return data;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function heartbeat() {
  const printers = [];
  for (const cupsName of PRINTERS) {
    try {
      const health = await getPrinterHealth(cupsName);
      printers.push({ cupsName, status: health.state });
    } catch {
      printers.push({ cupsName, status: "unknown" });
    }
  }
  await api("/api/print/agents/heartbeat", { method: "POST", body: { printers, agentVersion: AGENT_VERSION } });
}

async function renderJob(cupsName, payload) {
  const type = payload?.type || (payload?.title ? "task" : null);
  if (type === "note") {
    if (DRY_RUN) { console.log(`[agent] DRY_RUN note:\n${previewNoteReceipt(payload)}`); return; }
    return printNoteReceipt(cupsName, payload);
  }
  if (type === "task") {
    const task = payload.task || payload;
    const cut = payload.cut ?? task.cut;
    if (DRY_RUN) { console.log(`[agent] DRY_RUN task:\n${previewTaskReceipt(task)}`); return; }
    return printTaskReceipt(cupsName, task, cut);
  }
  if (type === "sheet") {
    const { sections = [], options = {} } = payload;
    if (DRY_RUN) { console.log(`[agent] DRY_RUN sheet:\n${previewSheetReceipt(sections, options)}`); return; }
    return printSheetReceipt(cupsName, sections, options);
  }
  throw new Error(`Unsupported payload type: ${payload?.type ?? "(none)"}`);
}

async function processJob(job) {
  try {
    await api(`/api/print/jobs/${job.id}`, { method: "PATCH", body: { status: "printing" } });
    await renderJob(job.cups_name, job.payload);
    await api(`/api/print/jobs/${job.id}`, { method: "PATCH", body: { status: "printed" } });
    console.log(`[agent] printed job ${job.id} on ${job.cups_name}`);
  } catch (error) {
    const message = error.message || "Unknown print error";
    await api(`/api/print/jobs/${job.id}`, { method: "PATCH", body: { status: "failed", error: message } }).catch(() => {});
    console.warn(`[agent] job ${job.id} failed: ${message}`);
  }
}

async function pollOnce() {
  await heartbeat();
  const { jobs } = await api("/api/print/agents/claim", { method: "POST", body: { max: MAX_CLAIM } });
  if (jobs.length === 0) return;
  console.log(`[agent] claimed ${jobs.length} job(s)`);
  for (const job of jobs) await processJob(job); // one USB printer = sequential
}

async function main() {
  console.log(`[agent] starting → ${SERVER_URL} | printers: ${PRINTERS.join(", ") || "(none)"} | poll ${POLL_INTERVAL_MS}ms${DRY_RUN ? " | DRY_RUN" : ""}`);
  let running = true;
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { running = false; });

  let backoff = POLL_INTERVAL_MS;
  while (running) {
    try {
      await pollOnce();
      backoff = POLL_INTERVAL_MS;
    } catch (error) {
      console.warn(`[agent] poll error: ${error.message} (retry in ${Math.round(backoff / 1000)}s)`);
      backoff = Math.min(backoff * 2, 60000);
    }
    await sleep(backoff);
  }
  console.log("[agent] stopped");
  process.exit(0);
}

main();

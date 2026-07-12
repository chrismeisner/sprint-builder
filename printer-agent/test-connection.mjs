// Printer connection test — run this after plugging in the printer.
//
//   node test-connection.mjs            # list printers + show health
//   node test-connection.mjs --print    # also print a test receipt
//
// Uses the same CUPS path the agent uses, so a pass here means the agent can
// print too.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listPrinters, getPrinterHealth, printTestReceipt } from "./printer.js";

const HERE = dirname(fileURLToPath(import.meta.url));

function envValue(key) {
  try {
    for (const line of readFileSync(join(HERE, ".env"), "utf8").split("\n")) {
      const t = line.trim();
      if (t.startsWith("#") || !t.includes("=")) continue;
      const [k, ...rest] = t.split("=");
      if (k.trim() === key) return rest.join("=").trim();
    }
  } catch {}
  return undefined;
}

const wantPrint = process.argv.includes("--print");
const configured = (envValue("PRINTERS") || "").split(",").map((s) => s.trim()).filter(Boolean);

console.log("Looking for printers known to macOS/CUPS…\n");
const { printers, defaultPrinter } = await listPrinters();
if (printers.length === 0) {
  console.log("  ✗ No printers found. Add the printer in System Settings > Printers & Scanners,");
  console.log("    then run this again.");
  process.exit(1);
}
for (const p of printers) console.log(`  • ${p.name}${p.name === defaultPrinter ? "  (default)" : ""}`);

const targets = configured.length ? configured : printers.map((p) => p.name);
console.log(`\nChecking health of: ${targets.join(", ")}\n`);

let allConnected = true;
for (const name of targets) {
  const health = await getPrinterHealth(name);
  const mark = health.connected ? "✓" : "✗";
  console.log(`  ${mark} ${name} — ${health.state} (${health.summary})`);
  if (health.reasons?.length) for (const r of health.reasons) console.log(`      ${r}`);
  if (!health.connected) allConnected = false;
}

if (wantPrint && allConnected) {
  const name = targets[0];
  console.log(`\nPrinting a test receipt on ${name}…`);
  await printTestReceipt(name);
  console.log("  ✓ Sent. Check the printer for output.");
} else if (wantPrint) {
  console.log("\nSkipping test print — fix the connection issues above first.");
}

console.log(allConnected ? "\nConnection looks good. ✅" : "\nSome printers are not reachable. ⚠️");
process.exit(allConnected ? 0 : 1);

import { execFile } from "node:child_process";
import { appendFile, mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const CUT_FEED_LINES = 8;
const MAX_ASCII_ART_CHARS = 3000;
const TASK_MIN_BODY_LINES = 14;
const BITMAP_ICON_NAMES = ["sun", "cloud", "rain", "check", "alert", "heart"];
const PAPER_LENGTH_UNITS = ["dots", "mm", "inches", "lines"];
const PAPER_CUT_MODES = ["full", "partial", "none"];
const DOTS_PER_MM = 8; // TM-T88V vertical pitch is ~0.125mm/dot.
const DOTS_PER_INCH = 203;
const LINE_FEED_DOTS = 34; // Approx default line spacing (~4.25mm).
const MAX_PAPER_LENGTH_DOTS = 20000; // Safety cap, ~2.5m of paper.
const TODO_PRINT_LOG_DIR = join(process.cwd(), "logs");
const TODO_PRINT_LOG_PATH = join(TODO_PRINT_LOG_DIR, "todo-print.log");

export async function listPrinters() {
  const { stdout, stderr } = await execFileAsync("lpstat", ["-p", "-d"]);
  return {
    raw: stdout.trim(),
    stderr: stderr.trim(),
    printers: parsePrinters(stdout),
    defaultPrinter: parseDefaultPrinter(stdout),
  };
}

export async function getPrinterStatus(name) {
  const { stdout, stderr } = await execFileAsync("lpstat", ["-p", name, "-l"]);
  return {
    raw: stdout.trim(),
    stderr: stderr.trim(),
  };
}

// Lightweight reachability check for the live status indicator. Never throws:
// an unknown/offline printer resolves to a "disconnected" health object.
export async function getPrinterHealth(name) {
  try {
    const { stdout } = await execFileAsync("lpstat", ["-p", name, "-l"]);
    return parsePrinterHealth(name, stdout);
  } catch (error) {
    const detail = (error.stderr || error.stdout || error.message || "").trim();
    return {
      name,
      connected: false,
      state: "unknown",
      summary: detail.includes("Invalid destination")
        ? "Printer not found in CUPS."
        : "Printer is not reachable.",
      reasons: detail ? [detail] : [],
    };
  }
}

export function parsePrinterHealth(name, lpstatOutput) {
  const text = lpstatOutput || "";
  const lower = text.toLowerCase();
  const reasons = text
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line && !/^enabled since/i.test(line));

  const disabled = /\bis not accepting|disabled\b/.test(lower);
  const paused = /\bpaused\b/.test(lower);
  const offline = /(offline|not responding|waiting for printer to become available|unplugged)/.test(
    lower,
  );
  const outOfPaper = /(media-empty|out of paper|paper out|cover open)/.test(lower);
  const printing = /(now printing|processing)/.test(lower);

  let state = "unknown";

  if (offline) {
    state = "offline";
  } else if (disabled) {
    state = "disabled";
  } else if (outOfPaper) {
    state = "out-of-paper";
  } else if (paused) {
    state = "paused";
  } else if (printing) {
    state = "printing";
  } else if (/\bis idle\b/.test(lower)) {
    state = "idle";
  }

  const connected = !offline && !disabled && state !== "unknown";

  return {
    name,
    connected,
    state,
    summary: summarizePrinterState(state),
    reasons,
  };
}

function summarizePrinterState(state) {
  switch (state) {
    case "idle":
      return "Connected and idle.";
    case "printing":
      return "Connected and printing.";
    case "paused":
      return "Queue paused.";
    case "out-of-paper":
      return "Check paper or cover.";
    case "disabled":
      return "Queue disabled / not accepting jobs.";
    case "offline":
      return "Printer offline — check USB and power.";
    default:
      return "Status unknown.";
  }
}

export async function printTestReceipt(name, cut) {
  return printRawReceipt(name, buildTestReceipt(cut), "test receipt");
}

export async function printCapabilityReceipt(name, cut) {
  return printRawReceipt(name, buildCapabilityReceipt(cut), "capability test receipt");
}

export async function printAsciiArtReceipt(name, asciiArt, cut) {
  return printRawReceipt(
    name,
    buildAsciiArtReceipt(asciiArt, cut),
    "ASCII art receipt",
  );
}

export async function printBitmapIconReceipt(name, iconName, cut) {
  return printRawReceipt(
    name,
    buildBitmapIconReceipt(iconName, cut),
    "bitmap icon receipt",
  );
}

export async function printCustomBitmapReceipt(name, bitmap, cut) {
  return printRawReceipt(
    name,
    buildCustomBitmapReceipt(bitmap, cut),
    "custom bitmap receipt",
  );
}

export async function printWeatherReceipt(name, weather, cut) {
  return printRawReceipt(name, buildWeatherReceipt(weather, cut), "weather receipt");
}

export async function printQrReceipt(name, url, cut) {
  return printRawReceipt(name, buildQrReceipt(url, cut), "QR receipt");
}

export async function printPaperLengthReceipt(name, options) {
  return printRawReceipt(
    name,
    buildPaperLengthReceipt(options),
    "paper length receipt",
  );
}

export async function printTakeReceipt(name, takeData, cut) {
  return printRawReceipt(name, buildTakeReceipt(takeData, cut), "take receipt");
}

export async function printTaskReceipt(name, task, cut) {
  const normalizedTask = normalizeTask(task);
  const receipt = buildTaskReceiptFromNormalizedTask(normalizedTask, cut);
  const receiptPreview = buildTaskReceiptLinesFromNormalizedTask(normalizedTask).join("\n");

  try {
    const printResult = await printRawReceipt(name, receipt, "task receipt");
    enqueueTaskPrintLog({
      status: "printed",
      printer: name,
      task: normalizedTask,
      receiptPreview,
      printResult,
    });
    return printResult;
  } catch (error) {
    enqueueTaskPrintLog({
      status: "failed",
      printer: name,
      task: normalizedTask,
      receiptPreview,
      error: error.message || "Unknown print error",
    });
    throw error;
  }
}

// Quick note: just the typed text, wrapped, with an auto timestamp at the
// bottom. Stamped at print time (agent's local clock) so it reflects when it
// actually came out of the printer.
export async function printNoteReceipt(name, note) {
  return printRawReceipt(name, buildNoteReceipt(note), "quick note");
}

export function previewNoteReceipt(note) {
  return buildNoteReceiptLines(note).join("\n");
}

function buildNoteReceiptLines(note) {
  const text = typeof note === "string" ? note : (note?.text ?? "");
  const lines = [];
  for (const paragraph of String(text).split(/\r\n|\r|\n/)) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    lines.push(...wrapLine(paragraph));
  }
  if (lines.length === 0) {
    lines.push("");
  }
  lines.push("--------------------------------");
  lines.push(new Date().toLocaleString());
  return lines;
}

function buildNoteReceipt(note) {
  const ESC = 0x1b;
  const cut = note?.cut;
  const lines = buildNoteReceiptLines(note);

  return Buffer.from([
    ESC, 0x40,       // Initialize.
    ESC, 0x61, 0x00, // Left align.
    ...textBytes(`${lines.join("\n")}\n`),
    ...buildPaperCutBytes(cut), // Feed + cut (skipped when cut === "none").
  ]);
}

export function previewAsciiArtReceipt(asciiArt) {
  return buildAsciiArtReceiptLines(asciiArt).join("\n");
}

export function previewBitmapIconReceipt(iconName) {
  return buildBitmapIconReceiptLines(iconName).join("\n");
}

export function previewCustomBitmapReceipt(bitmap) {
  return buildCustomBitmapReceiptLines(bitmap).join("\n");
}

export function previewTakeReceipt(takeData) {
  return buildTakeReceiptLines(takeData).join("\n");
}

export function previewTaskReceipt(task) {
  return buildTaskReceiptLines(task).join("\n");
}

export function previewQrReceipt(url) {
  return buildQrReceiptLines(url).join("\n");
}

export function previewPaperLengthReceipt(options) {
  return buildPaperLengthReceiptLines(normalizePaperLength(options)).join("\n");
}

export function previewWeatherReceipt(weather) {
  return buildWeatherReceiptLines(weather).join("\n");
}

async function printRawReceipt(name, receipt, label) {
  const tempDir = await mkdtemp(join(tmpdir(), "epson-tm-t88v-"));
  const receiptPath = join(tempDir, "receipt.bin");

  try {
    await writeFile(receiptPath, receipt);
    const { stdout, stderr } = await execFileAsync("lp", [
      "-d",
      name,
      "-o",
      "raw",
      receiptPath,
    ]);

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      message: `Sent raw ESC/POS ${label} to "${name}".`,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export function parsePrinters(lpstatOutput) {
  return lpstatOutput
    .split("\n")
    .map((line) => line.match(/^printer\s+(\S+)\s+(.+)$/))
    .filter(Boolean)
    .map((match) => ({
      name: match[1],
      status: match[2],
    }));
}

export function parseDefaultPrinter(lpstatOutput) {
  const match = lpstatOutput.match(/^system default destination:\s+(.+)$/m);
  return match?.[1] ?? null;
}

function buildTestReceipt(cut) {
  const ESC = 0x1b;

  return Buffer.from([
    ESC,
    0x40, // Initialize printer.
    ESC,
    0x61,
    0x01, // Center align.
    ESC,
    0x45,
    0x01, // Bold on.
    ...textBytes("EPSON TM-T88V TEST\n"),
    ESC,
    0x45,
    0x00, // Bold off.
    ...textBytes(new Date().toLocaleString()),
    0x0a,
    ESC,
    0x61,
    0x00, // Left align.
    ...textBytes("--------------------------------\n"),
    ...textBytes("USB/CUPS raw ESC/POS print OK\n"),
    ...textBytes("If this printed, transport works.\n"),
    ...textBytes("--------------------------------\n"),
    ...buildPaperCutBytes(cut), // Feed + cut (skipped when cut === "none").
  ]);
}

function buildWeatherReceipt(weather, cut) {
  const ESC = 0x1b;
  const lines = buildWeatherReceiptLines(weather);

  return Buffer.from([
    ESC,
    0x40, // Initialize printer.
    ESC,
    0x61,
    0x01, // Center align.
    ESC,
    0x45,
    0x01, // Bold on.
    ...textBytes(`${lines[0]}\n`),
    ESC,
    0x45,
    0x00, // Bold off.
    ESC,
    0x61,
    0x00, // Left align.
    ...textBytes(`${lines.slice(1).join("\n")}\n`),
    ...buildPaperCutBytes(cut), // Feed + cut (skipped when cut === "none").
  ]);
}

function buildCapabilityReceipt(cut) {
  const ESC = 0x1b;
  const GS = 0x1d;

  return Buffer.from([
    ESC,
    0x40, // Initialize printer.
    ESC,
    0x61,
    0x01, // Center align.
    ESC,
    0x45,
    0x01, // Bold on.
    ...textBytes("CAPABILITY TEST\n"),
    ESC,
    0x45,
    0x00, // Bold off.
    ...textBytes(new Date().toLocaleString()),
    0x0a,
    ESC,
    0x61,
    0x00, // Left align.
    ...textBytes("--------------------------------\n"),
    ...textBytes("Text styles\n"),
    ESC,
    0x45,
    0x01, // Bold on.
    ...textBytes("Bold text\n"),
    ESC,
    0x45,
    0x00, // Bold off.
    ESC,
    0x2d,
    0x01, // Underline on.
    ...textBytes("Underline text\n"),
    ESC,
    0x2d,
    0x00, // Underline off.
    GS,
    0x21,
    0x11, // Double width and height.
    ...textBytes("BIG\n"),
    GS,
    0x21,
    0x00, // Normal size.
    ...textBytes("--------------------------------\n"),
    ...textBytes("Alignment\n"),
    ESC,
    0x61,
    0x00,
    ...textBytes("Left\n"),
    ESC,
    0x61,
    0x01,
    ...textBytes("Center\n"),
    ESC,
    0x61,
    0x02,
    ...textBytes("Right\n"),
    ESC,
    0x61,
    0x00,
    ...textBytes("--------------------------------\n"),
    ...textBytes("Code page sample\n"),
    ESC,
    0x74,
    0x00, // PC437 USA.
    ...textBytes("PC437 bytes: "),
    ...bytes([0xb0, 0xb1, 0xb2, 0xdb, 0xdc, 0xdf, 0xfe, 0x0a]),
    ...textBytes("ASCII safe: [SUN] [RAIN] [SNOW]\n"),
    ...textBytes("--------------------------------\n"),
    ...textBytes("Barcode CODE39\n"),
    GS,
    0x48,
    0x02, // Human-readable text below.
    GS,
    0x68,
    0x50, // Barcode height.
    GS,
    0x77,
    0x02, // Barcode width.
    GS,
    0x6b,
    0x04, // CODE39, NUL terminated.
    ...textBytes("TEST123"),
    0x00,
    0x0a,
    ...textBytes("--------------------------------\n"),
    ...textBytes("QR Code\n"),
    ...qrCode("https://example.com/receipt-test"),
    0x0a,
    ...textBytes("--------------------------------\n"),
    ESC,
    0x61,
    0x01, // Center align.
    ...textBytes("Raster bitmap icon\n"),
    ...rasterIcon("sun"),
    ESC,
    0x61,
    0x00, // Left align.
    ...textBytes("--------------------------------\n"),
    ...textBytes("Cut/feed test\n"),
    ...buildPaperCutBytes(cut), // Feed + cut (skipped when cut === "none").
  ]);
}

function buildAsciiArtReceipt(asciiArt, cut) {
  const ESC = 0x1b;
  const lines = buildAsciiArtReceiptLines(asciiArt);

  return Buffer.from([
    ESC,
    0x40, // Initialize printer.
    ESC,
    0x61,
    0x01, // Center align.
    ESC,
    0x45,
    0x01, // Bold on.
    ...textBytes(`${lines[0]}\n`),
    ESC,
    0x45,
    0x00, // Bold off.
    ESC,
    0x61,
    0x00, // Left align.
    ...textBytes(`${lines.slice(1).join("\n")}\n`),
    ...buildPaperCutBytes(cut), // Feed + cut (skipped when cut === "none").
  ]);
}

function buildBitmapIconReceipt(iconName, cut) {
  const ESC = 0x1b;
  const icons = normalizeBitmapIconSelection(iconName);

  return Buffer.from([
    ESC,
    0x40, // Initialize printer.
    ESC,
    0x61,
    0x01, // Center align.
    ESC,
    0x45,
    0x01, // Bold on.
    ...textBytes("BITMAP ICON TEST\n"),
    ESC,
    0x45,
    0x00, // Bold off.
    ...textBytes(`${new Date().toLocaleString()}\n\n`),
    ...icons.flatMap((icon) => [
      ...textBytes(`${formatIconLabel(icon)}\n`),
      ...rasterIcon(icon),
      0x0a,
    ]),
    ESC,
    0x61,
    0x00, // Left align.
    ...textBytes("--------------------------------\n"),
    ...textBytes("ESC/POS raster image test\n"),
    ...buildPaperCutBytes(cut), // Feed + cut (skipped when cut === "none").
  ]);
}

function buildCustomBitmapReceipt(bitmap, cut) {
  const ESC = 0x1b;
  const normalizedBitmap = normalizeCustomBitmap(bitmap);
  const lines = buildCustomBitmapReceiptLines(normalizedBitmap);

  return Buffer.from([
    ESC,
    0x40, // Initialize printer.
    ESC,
    0x61,
    0x01, // Center align.
    ESC,
    0x45,
    0x01, // Bold on.
    ...textBytes(`${lines[0]}\n`),
    ESC,
    0x45,
    0x00, // Bold off.
    ...textBytes(`${lines[1]}\n\n`),
    ...rasterBitmap(normalizedBitmap),
    0x0a,
    ESC,
    0x61,
    0x00, // Left align.
    ...textBytes(`${lines.slice(2).join("\n")}\n`),
    ...buildPaperCutBytes(cut), // Feed + cut (skipped when cut === "none").
  ]);
}

function buildTakeReceipt(takeData, cut) {
  const ESC = 0x1b;
  const lines = buildTakeReceiptLines(takeData);

  return Buffer.from([
    ESC,
    0x40, // Initialize printer.
    ESC,
    0x61,
    0x01, // Center align.
    ESC,
    0x45,
    0x01, // Bold on.
    ...textBytes(`${lines[0]}\n`),
    ESC,
    0x45,
    0x00, // Bold off.
    ESC,
    0x61,
    0x00, // Left align.
    ...textBytes(`${lines.slice(1).join("\n")}\n`),
    ...buildPaperCutBytes(cut), // Feed + cut (skipped when cut === "none").
  ]);
}

function buildQrReceipt(url, cut) {
  const ESC = 0x1b;
  const lines = buildQrReceiptLines(url);
  const qrValue = normalizeQrUrl(url);

  return Buffer.from([
    ESC,
    0x40, // Initialize printer.
    ESC,
    0x61,
    0x01, // Center align.
    ESC,
    0x45,
    0x01, // Bold on.
    ...textBytes(`${lines[0]}\n`),
    ESC,
    0x45,
    0x00, // Bold off.
    ...textBytes(`${lines[1]}\n\n`),
    ...qrCode(qrValue),
    0x0a,
    ESC,
    0x61,
    0x00, // Left align.
    ...textBytes(`${lines.slice(2).join("\n")}\n`),
    ...buildPaperCutBytes(cut), // Feed + cut (skipped when cut === "none").
  ]);
}

function buildPaperLengthReceipt(options) {
  const ESC = 0x1b;
  const normalized = normalizePaperLength(options);
  const lines = buildPaperLengthReceiptLines(normalized);

  return Buffer.from([
    ESC,
    0x40, // Initialize printer.
    ESC,
    0x61,
    0x01, // Center align.
    ESC,
    0x45,
    0x01, // Bold on.
    ...textBytes(`${lines[0]}\n`),
    ESC,
    0x45,
    0x00, // Bold off.
    ...textBytes(`${lines.slice(1).join("\n")}\n`),
    ...buildPaperLengthFeedBytes(normalized),
    ...buildPaperCutBytes(normalized.cut),
  ]);
}

// Feeds the requested length as either a plain blank strip or a labeled ruler.
function buildPaperLengthFeedBytes(normalized) {
  if (normalized.markers) {
    return buildPaperRulerBytes(normalized);
  }

  if (normalized.unit === "lines") {
    return feedLinesBytes(normalized.value);
  }

  return feedDotsBytes(normalized.dots);
}

function buildPaperRulerBytes(normalized) {
  if (normalized.unit === "lines") {
    const totalLines = Math.round(normalized.value);
    const interval = 5;
    const bytes = [];
    let done = 0;

    while (done + interval <= totalLines) {
      bytes.push(...feedLinesBytes(interval));
      done += interval;
      bytes.push(...textBytes(`----- ${done} lines -----\n`));
    }

    bytes.push(...feedLinesBytes(totalLines - done));
    return bytes;
  }

  const interval = paperRulerIntervalDots(normalized.unit);
  const bytes = [];
  let done = 0;
  let mark = 0;

  while (done + interval <= normalized.dots) {
    bytes.push(...feedDotsBytes(interval));
    done += interval;
    mark += 1;
    bytes.push(...textBytes(`----- ${paperRulerLabel(normalized.unit, mark)} -----\n`));
  }

  bytes.push(...feedDotsBytes(normalized.dots - done));
  return bytes;
}

function paperRulerIntervalDots(unit) {
  if (unit === "inches") {
    return DOTS_PER_INCH;
  }

  if (unit === "dots") {
    return 100;
  }

  return 10 * DOTS_PER_MM; // 1 cm ticks for mm input.
}

function paperRulerLabel(unit, mark) {
  if (unit === "inches") {
    return `${mark} in`;
  }

  if (unit === "dots") {
    return `${mark * 100} dots`;
  }

  return `${mark} cm`;
}

// ESC J n: print and feed n dots. n is one byte, so chunk longer feeds.
function feedDotsBytes(dots) {
  const ESC = 0x1b;
  const bytes = [];
  let remaining = Math.max(0, Math.round(dots));

  while (remaining > 0) {
    const chunk = Math.min(255, remaining);
    bytes.push(ESC, 0x4a, chunk);
    remaining -= chunk;
  }

  return bytes;
}

// ESC d n: print and feed n lines. n is one byte, so chunk longer feeds.
function feedLinesBytes(lines) {
  const ESC = 0x1b;
  const bytes = [];
  let remaining = Math.max(0, Math.round(lines));

  while (remaining > 0) {
    const chunk = Math.min(255, remaining);
    bytes.push(ESC, 0x64, chunk);
    remaining -= chunk;
  }

  return bytes;
}

function buildPaperCutBytes(cut) {
  const GS = 0x1d;

  if (cut === "none") {
    return [];
  }

  // GS V 65 (A) = feed + full cut, GS V 66 (B) = feed + partial cut.
  const mode = cut === "full" ? 0x41 : 0x42;
  return [GS, 0x56, mode, CUT_FEED_LINES];
}

function buildTaskReceipt(task, cut) {
  const normalizedTask = normalizeTask(task);
  return buildTaskReceiptFromNormalizedTask(normalizedTask, cut);
}

function buildTaskReceiptFromNormalizedTask(normalizedTask, cut) {
  const ESC = 0x1b;
  const lines = buildTaskReceiptLinesFromNormalizedTask(normalizedTask);

  return Buffer.from([
    ESC,
    0x40, // Initialize printer.
    ESC,
    0x61,
    0x01, // Center align.
    ESC,
    0x45,
    0x01, // Bold on.
    ...textBytes(`${lines[0]}\n`),
    ESC,
    0x45,
    0x00, // Bold off.
    ESC,
    0x61,
    0x00, // Left align.
    ...textBytes(`${lines.slice(1).join("\n")}\n`),
    ...buildPaperCutBytes(cut), // Feed + cut (skipped when cut === "none").
  ]);
}

function buildWeatherReceiptLines(weather) {
  const observedAt = new Date(weather.observedAt).toLocaleString();
  const locationLine = weather.location?.label
    ? [`Location: ${weather.location.label}`]
    : [];

  return [
    "THE BOSS WEATHER TEST",
    "--------------------------------",
    `Printed: ${new Date().toLocaleString()}`,
    `Observed: ${observedAt}`,
    `Timezone: ${weather.timezone || "Unknown"}`,
    ...locationLine,
    `Lat/Lon: ${weather.latitude}, ${weather.longitude}`,
    "--------------------------------",
    `Condition: ${weather.condition}`,
    `Temp: ${weather.temperatureF} F`,
    `Feels: ${weather.apparentTemperatureF} F`,
    `Humidity: ${weather.humidityPercent}%`,
    `Wind: ${weather.windMph} mph`,
    "--------------------------------",
    `Data: ${sanitizeReceiptText(weather.source || "Weather service")}`,
  ];
}

function buildAsciiArtReceiptLines(asciiArt) {
  const normalizedArt = normalizeAsciiArt(asciiArt);

  return [
    "ASCII ART TEST",
    "--------------------------------",
    `Printed: ${new Date().toLocaleString()}`,
    "Paste width tip: keep lines <= 42",
    "--------------------------------",
    ...normalizedArt.split("\n"),
    "--------------------------------",
  ];
}

function buildBitmapIconReceiptLines(iconName) {
  const icons = normalizeBitmapIconSelection(iconName);

  return [
    "BITMAP ICON TEST",
    "--------------------------------",
    `Printed: ${new Date().toLocaleString()}`,
    `Icons: ${icons.map(formatIconLabel).join(", ")}`,
    "--------------------------------",
    "This prints ESC/POS raster images.",
  ];
}

function buildCustomBitmapReceiptLines(bitmap) {
  const normalizedBitmap = normalizeCustomBitmap(bitmap);

  return [
    "BITMAP CREATOR TEST",
    new Date().toLocaleString(),
    "--------------------------------",
    `Size: ${normalizedBitmap.width} x ${normalizedBitmap.height}`,
    "Source: Browser canvas",
    "--------------------------------",
  ];
}

function buildTakeReceiptLines(takeData) {
  const take = takeData?.take || {};
  const user = takeData?.user || {};
  const prop = takeData?.prop || {};
  const event = takeData?.event || {};
  const userLabel = user.displayName || user.handle || user.id || "Unknown user";
  const sideLabel = take.sideLabel || take.side || "Unknown side";
  const takeUrl = take.url || (take.slug ? `/takes/${take.slug}` : null);
  const lines = [
    "NEW TAKE",
    "--------------------------------",
    `User: ${sanitizeReceiptText(userLabel)}`,
    `Side: ${sanitizeReceiptText(sideLabel)}`,
  ];

  if (take.sideStatement) {
    lines.push(...wrapLine(`Take: ${take.sideStatement}`));
  }

  if (take.comment) {
    lines.push(...wrapLine(`Comment: ${take.comment}`));
  }

  lines.push("--------------------------------");

  if (prop.question) {
    lines.push(...wrapLine(`Prop: ${prop.question}`));
  }

  if (event.name || event.matchup) {
    lines.push(...wrapLine(`Event: ${event.name || event.matchup}`));
  }

  if (event.league || event.sport) {
    lines.push(`League: ${sanitizeReceiptText(event.league || event.sport)}`);
  }

  if (event.startsAt) {
    lines.push(`Starts: ${formatDate(event.startsAt)}`);
  }

  lines.push("--------------------------------");
  lines.push(`Locked: ${formatDate(take.lockedAt || take.updatedAt)}`);

  if (takeUrl) {
    lines.push(`URL: ${sanitizeReceiptText(takeUrl)}`);
  }

  lines.push(`Take ID: ${formatOptional(take.id)}`);
  lines.push("--------------------------------");

  return lines;
}

function buildQrReceiptLines(url) {
  const qrValue = normalizeQrUrl(url);

  return [
    "URL QR TEST",
    new Date().toLocaleString(),
    "--------------------------------",
    ...wrapLine(qrValue),
    "--------------------------------",
    "Scan the QR code above.",
  ];
}

function buildPaperLengthReceiptLines(normalized) {
  const { unit, value, cut, markers } = normalized;
  const cutLabel =
    cut === "full"
      ? "Full cut"
      : cut === "partial"
        ? "Partial cut"
        : "No cut (feed only)";

  return [
    "PAPER LENGTH TEST",
    new Date().toLocaleString(),
    "--------------------------------",
    `Requested: ${value} ${unit}`,
    `Approx: ${describePaperLength(normalized)}`,
    `Markers: ${markers ? "On (ruler ticks)" : "Off (blank feed)"}`,
    `Cut: ${cutLabel}`,
    "--------------------------------",
    markers
      ? "Ruler ticks feed below, then cut."
      : "Blank strip feeds below, then cut.",
  ];
}

function describePaperLength(normalized) {
  if (normalized.unit === "lines") {
    const mm = (normalized.value * LINE_FEED_DOTS) / DOTS_PER_MM;
    return `${normalized.value} lines (~${mm.toFixed(0)} mm)`;
  }

  const mm = normalized.dots / DOTS_PER_MM;
  const inches = normalized.dots / DOTS_PER_INCH;
  return `${normalized.dots} dots / ${mm.toFixed(1)} mm / ${inches.toFixed(2)} in`;
}

function normalizePaperLength(options) {
  const unit = PAPER_LENGTH_UNITS.includes(options?.unit) ? options.unit : "mm";
  const cut = PAPER_CUT_MODES.includes(options?.cut) ? options.cut : "partial";
  const markers = Boolean(options?.markers);
  const value = Number(options?.value);

  if (!Number.isFinite(value) || value <= 0) {
    const error = new Error("Enter a paper length greater than zero.");
    error.status = 400;
    throw error;
  }

  const dots =
    unit === "lines"
      ? Math.round(value * LINE_FEED_DOTS)
      : paperLengthToDots(value, unit);

  if (dots > MAX_PAPER_LENGTH_DOTS) {
    const error = new Error(
      `Paper length is too long. Max ~${MAX_PAPER_LENGTH_DOTS} dots (about ${Math.round(
        MAX_PAPER_LENGTH_DOTS / DOTS_PER_MM,
      )} mm).`,
    );
    error.status = 400;
    throw error;
  }

  return { unit, cut, markers, value, dots };
}

function paperLengthToDots(value, unit) {
  if (unit === "mm") {
    return Math.round(value * DOTS_PER_MM);
  }

  if (unit === "inches") {
    return Math.round(value * DOTS_PER_INCH);
  }

  return Math.round(value); // dots
}

function buildTaskReceiptLines(task) {
  const normalizedTask = normalizeTask(task);
  return buildTaskReceiptLinesFromNormalizedTask(normalizedTask);
}

function buildTaskReceiptLinesFromNormalizedTask(normalizedTask) {
  const lines = [
    "TASK",
    "--------------------------------",
    ...wrapLine(normalizedTask.title),
    "--------------------------------",
    `Due: ${normalizedTask.dueLabel}`,
    `Created: ${new Date().toLocaleString()}`,
  ];

  if (normalizedTask.notes) {
    lines.push("--------------------------------");
    lines.push(...wrapMultilineField("Notes", normalizedTask.notes));
  }

  while (lines.length < TASK_MIN_BODY_LINES) {
    lines.push("");
  }

  lines.push("--------------------------------");
  lines.push("[ ] Done");
  lines.push("Completed at: ________________");
  lines.push("--------------------------------");

  return lines;
}

function enqueueTaskPrintLog(entry) {
  void appendTaskPrintLog(entry);
}

async function appendTaskPrintLog(entry) {
  try {
    await mkdir(TODO_PRINT_LOG_DIR, { recursive: true });
    await appendFile(
      TODO_PRINT_LOG_PATH,
      `${JSON.stringify({
        loggedAt: new Date().toISOString(),
        status: entry.status,
        printer: sanitizeReceiptText(entry.printer || ""),
        title: entry.task.title,
        dueLabel: entry.task.dueLabel,
        notes: entry.task.notes || null,
        receiptPreview: entry.receiptPreview,
        stdout: entry.printResult?.stdout || null,
        stderr: entry.printResult?.stderr || null,
        error: entry.error || null,
      })}\n`,
      "utf8",
    );
  } catch (error) {
    console.warn(`[task-log] Failed to append task print log: ${error.message || error}`);
  }
}

function normalizeTask(task) {
  const title = sanitizeReceiptText(task?.title || "").trim();
  const titleAllCaps = Boolean(task?.titleAllCaps);
  const dueAllCaps = Boolean(task?.dueAllCaps);
  const notesAllCaps = Boolean(task?.notesAllCaps);
  const normalizedTitle = titleAllCaps ? title.toUpperCase() : title;

  if (!normalizedTitle) {
    const error = new Error("Enter a task title.");
    error.status = 400;
    throw error;
  }

  const dueLabel = formatTaskDue(task?.dueAt);
  const notes = sanitizeReceiptMultilineText(task?.notes || "").trim();

  return {
    title: normalizedTitle,
    dueLabel: dueAllCaps ? dueLabel.toUpperCase() : dueLabel,
    notes: notesAllCaps ? notes.toUpperCase() : notes,
  };
}

function formatTaskDue(value) {
  if (!value) {
    return "No due time";
  }

  return formatDate(value);
}

function normalizeQrUrl(value) {
  if (!value || typeof value !== "string") {
    const error = new Error("Enter a URL for the QR code.");
    error.status = 400;
    throw error;
  }

  const normalized = value.trim();

  try {
    const parsed = new URL(normalized);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("URL must start with http:// or https://.");
    }

    return parsed.toString();
  } catch {
    const error = new Error("Enter a valid http:// or https:// URL.");
    error.status = 400;
    throw error;
  }
}

function wrapLine(value, width = 42) {
  const words = sanitizeReceiptText(value).split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > width && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function wrapMultilineField(label, value, width = 42) {
  const paragraphs = String(value).split(/\r\n|\r|\n/);
  const lines = [];

  for (let index = 0; index < paragraphs.length; index += 1) {
    const prefix = index === 0 ? `${label}: ` : "";
    const text = paragraphs[index].trim();

    if (!text) {
      lines.push(prefix.trimEnd());
      continue;
    }

    lines.push(...wrapLine(`${prefix}${text}`, width));
  }

  return lines;
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return sanitizeReceiptText(value);
  }

  return date.toLocaleString();
}

function formatOptional(value) {
  if (value === null || value === undefined || value === "") {
    return "Unknown";
  }

  return sanitizeReceiptText(String(value));
}

function sanitizeReceiptText(value) {
  return String(value).replace(/[^\x20-\x7e]/g, "?");
}

function sanitizeReceiptMultilineText(value) {
  return String(value).replace(/[^\x0a\x0d\x20-\x7e]/g, "?");
}

function normalizeAsciiArt(value) {
  if (!value || typeof value !== "string") {
    const error = new Error("Enter ASCII art to print.");
    error.status = 400;
    throw error;
  }

  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "    ")
    .replace(/[^\x20-\x7e\n]/g, "?")
    .slice(0, MAX_ASCII_ART_CHARS)
    .trimEnd();

  if (!normalized.trim()) {
    const error = new Error("Enter ASCII art to print.");
    error.status = 400;
    throw error;
  }

  return normalized;
}

function textBytes(value) {
  return [...Buffer.from(value, "ascii")];
}

function bytes(value) {
  return value;
}

function normalizeBitmapIconSelection(value) {
  if (!value || value === "all") {
    return BITMAP_ICON_NAMES;
  }

  if (!BITMAP_ICON_NAMES.includes(value)) {
    const error = new Error("Choose a valid bitmap icon.");
    error.status = 400;
    throw error;
  }

  return [value];
}

function normalizeCustomBitmap(bitmap) {
  const width = Number(bitmap?.width);
  const height = Number(bitmap?.height);
  const pixels = bitmap?.pixels;

  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width > 576 ||
    height > 512 ||
    !Array.isArray(pixels) ||
    pixels.length !== width * height
  ) {
    const error = new Error("Invalid bitmap payload.");
    error.status = 400;
    throw error;
  }

  return {
    width,
    height,
    pixels: pixels.map((value) => (value ? 1 : 0)),
  };
}

function formatIconLabel(iconName) {
  return iconName.replace(/^\w/, (character) => character.toUpperCase());
}

function qrCode(value) {
  const model = [0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00];
  const size = [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06];
  const errorCorrection = [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31];
  const data = textBytes(value);
  const length = data.length + 3;
  const pL = length % 256;
  const pH = Math.floor(length / 256);
  const store = [0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...data];
  const print = [0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30];

  return [...model, ...size, ...errorCorrection, ...store, ...print];
}

function rasterIcon(iconName) {
  const width = 64;
  const height = 64;
  const bytesPerRow = width / 8;
  const imageBytes = [];

  for (let y = 0; y < height; y += 1) {
    for (let byteColumn = 0; byteColumn < bytesPerRow; byteColumn += 1) {
      let byte = 0;

      for (let bit = 0; bit < 8; bit += 1) {
        const x = byteColumn * 8 + bit;

        if (isIconPixel(iconName, x, y)) {
          byte |= 0x80 >> bit;
        }
      }

      imageBytes.push(byte);
    }
  }

  return [
    0x1d,
    0x76,
    0x30,
    0x00,
    bytesPerRow & 0xff,
    (bytesPerRow >> 8) & 0xff,
    height & 0xff,
    (height >> 8) & 0xff,
    ...imageBytes,
    0x0a,
  ];
}

function rasterBitmap(bitmap) {
  const bytesPerRow = Math.ceil(bitmap.width / 8);
  const imageBytes = [];

  for (let y = 0; y < bitmap.height; y += 1) {
    for (let byteColumn = 0; byteColumn < bytesPerRow; byteColumn += 1) {
      let byte = 0;

      for (let bit = 0; bit < 8; bit += 1) {
        const x = byteColumn * 8 + bit;
        const pixelIndex = y * bitmap.width + x;

        if (x < bitmap.width && bitmap.pixels[pixelIndex]) {
          byte |= 0x80 >> bit;
        }
      }

      imageBytes.push(byte);
    }
  }

  return [
    0x1d,
    0x76,
    0x30,
    0x00,
    bytesPerRow & 0xff,
    (bytesPerRow >> 8) & 0xff,
    bitmap.height & 0xff,
    (bitmap.height >> 8) & 0xff,
    ...imageBytes,
  ];
}

function isIconPixel(iconName, x, y) {
  switch (iconName) {
    case "sun":
      return isSunPixel(x, y);
    case "cloud":
      return isCloudPixel(x, y);
    case "rain":
      return isCloudPixel(x, y - 8) || isRainPixel(x, y);
    case "check":
      return isCheckPixel(x, y);
    case "alert":
      return isAlertPixel(x, y);
    case "heart":
      return isHeartPixel(x, y);
    default:
      return false;
  }
}

function isSunPixel(x, y) {
  const center = 31.5;
  const dx = x - center;
  const dy = y - center;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const onCircle = distance >= 13 && distance <= 20;
  const onRay =
    (Math.abs(dx) <= 2 && distance >= 23 && distance <= 29) ||
    (Math.abs(dy) <= 2 && distance >= 23 && distance <= 29) ||
    (Math.abs(Math.abs(dx) - Math.abs(dy)) <= 2 &&
      distance >= 24 &&
      distance <= 31);

  return onCircle || onRay;
}

function isCloudPixel(x, y) {
  const base = x >= 14 && x <= 51 && y >= 33 && y <= 45;
  const leftPuff = isFilledCircle(x, y, 24, 32, 11);
  const centerPuff = isFilledCircle(x, y, 34, 27, 14);
  const rightPuff = isFilledCircle(x, y, 45, 33, 10);

  return base || leftPuff || centerPuff || rightPuff;
}

function isRainPixel(x, y) {
  const drops = [
    [22, 47],
    [32, 51],
    [42, 47],
  ];

  return drops.some(
    ([dropX, dropY]) => Math.abs(x - dropX) <= 2 && y >= dropY && y <= dropY + 9,
  );
}

function isCheckPixel(x, y) {
  const firstStroke = Math.abs(y - (0.75 * x + 16)) <= 2 && x >= 14 && x <= 28;
  const secondStroke = Math.abs(y - (-0.55 * x + 48)) <= 2 && x >= 27 && x <= 52;

  return firstStroke || secondStroke;
}

function isAlertPixel(x, y) {
  const leftEdge = Math.abs(x - (32 - (y - 12) * 0.45)) <= 1.5 && y >= 12 && y <= 50;
  const rightEdge = Math.abs(x - (32 + (y - 12) * 0.45)) <= 1.5 && y >= 12 && y <= 50;
  const base = x >= 15 && x <= 49 && y >= 49 && y <= 52;
  const exclamation = x >= 30 && x <= 34 && y >= 25 && y <= 40;
  const dot = isFilledCircle(x, y, 32, 45, 2.5);

  return leftEdge || rightEdge || base || exclamation || dot;
}

function isHeartPixel(x, y) {
  const dx = (x - 32) / 18;
  const dy = (y - 34) / 18;
  const value = (dx * dx + dy * dy - 1) ** 3 - dx * dx * dy ** 3;

  return value <= 0 && y >= 15 && y <= 52;
}

function isFilledCircle(x, y, centerX, centerY, radius) {
  const dx = x - centerX;
  const dy = y - centerY;

  return dx * dx + dy * dy <= radius * radius;
}

// ---------------------------------------------------------------------------
// Sheet builder
//
// Lets the builder page stack components ("sections") into a single receipt
// that prints once and cuts once. Each section emits its own ESC/POS chunk and
// resets to left alignment so sections compose cleanly in any order.
// ---------------------------------------------------------------------------

const SHEET_DIVIDER = "--------------------------------"; // 32 chars, matches the rest of the app.
const SHEET_SECTION_TYPES = [
  "text",
  "divider",
  "blank",
  "image",
  "qr",
  "weather",
];
const SHEET_BLANK_DEFAULT_LINES = 3;
const SHEET_BLANK_MAX_LINES = 50;
const SHEET_MAX_QUANTITY = 50;
const SHEET_TEXT_ALIGNS = ["left", "center", "right"];
const SHEET_TEXT_SIZES = ["normal", "dh", "dw", "both"];
// ESC a n alignment codes and GS ! n size codes (width bit 0x10, height bit 0x01).
const SHEET_ALIGN_CODE = { left: 0x00, center: 0x01, right: 0x02 };
const SHEET_SIZE_CODE = { normal: 0x00, dh: 0x01, dw: 0x10, both: 0x11 };
const SHEET_TEXT_WIDTH = 42;
const SHEET_TEXT_WIDTH_DOUBLE = 21;

export async function printSheetReceipt(name, sections, options) {
  const single = buildSheetReceipt(sections, options);
  const quantity = clampSheetQuantity(options?.quantity);
  // Repeat the whole sheet (each copy re-inits and cuts) so one job yields N
  // separate receipts.
  const receipt =
    quantity > 1
      ? Buffer.concat(Array.from({ length: quantity }, () => single))
      : single;

  return printRawReceipt(
    name,
    receipt,
    quantity > 1 ? `builder sheet x${quantity}` : "builder sheet",
  );
}

export function previewSheetReceipt(sections, options) {
  return buildSheetReceiptLines(sections, options).join("\n");
}

function buildSheetReceipt(sections, options) {
  const ESC = 0x1b;
  const cut = options?.cut;
  const normalized = normalizeSheetSections(sections);
  const topMargin = clampSheetMargin(options?.topMargin);
  const bottomMargin = clampSheetMargin(options?.bottomMargin);
  const body = [];

  if (topMargin > 0) {
    body.push(...textBytes("\n".repeat(topMargin))); // Top headroom.
  }

  normalized.forEach((section, index) => {
    if (index > 0) {
      body.push(0x0a); // Blank line between sections.
    }

    body.push(...sheetSectionBytes(section));
  });

  if (bottomMargin > 0) {
    body.push(...textBytes("\n".repeat(bottomMargin))); // Bottom headroom.
  }

  return Buffer.from([
    ESC,
    0x40, // Initialize printer.
    ...body,
    ...buildPaperCutBytes(cut), // Feed + cut (skipped when cut === "none").
  ]);
}

function buildSheetReceiptLines(sections, options) {
  const normalized = normalizeSheetSections(sections);
  const topMargin = clampSheetMargin(options?.topMargin);
  const bottomMargin = clampSheetMargin(options?.bottomMargin);
  const lines = Array.from({ length: topMargin }, () => "");

  normalized.forEach((section, index) => {
    if (index > 0) {
      lines.push("");
    }

    lines.push(...sheetSectionLines(section));
  });

  for (let index = 0; index < bottomMargin; index += 1) {
    lines.push("");
  }

  return lines;
}

function sheetSectionBytes(section) {
  const ESC = 0x1b;
  const GS = 0x1d;

  switch (section.type) {
    case "text": {
      const sizeCode = SHEET_SIZE_CODE[section.size];
      const lineBytes = sheetTextLines(section).flatMap((line) =>
        textBytes(`${line}\n`),
      );

      return [
        ESC, 0x61, SHEET_ALIGN_CODE[section.align], // Alignment.
        ...(section.bold ? [ESC, 0x45, 0x01] : []), // Bold on.
        ...(section.underline ? [ESC, 0x2d, 0x01] : []), // Underline on.
        ...(sizeCode ? [GS, 0x21, sizeCode] : []), // Size.
        ...lineBytes,
        ...(sizeCode ? [GS, 0x21, 0x00] : []), // Normal size.
        ...(section.underline ? [ESC, 0x2d, 0x00] : []), // Underline off.
        ...(section.bold ? [ESC, 0x45, 0x00] : []), // Bold off.
        ESC, 0x61, 0x00, // Reset to left align.
      ];
    }
    case "divider":
      return textBytes(`${SHEET_DIVIDER}\n`);
    case "blank":
      return textBytes("\n".repeat(section.lines));
    case "image":
      return [
        ESC, 0x61, 0x01, // Center align.
        ...rasterBitmap(section.bitmap),
        0x0a,
        ESC, 0x61, 0x00, // Left align.
      ];
    case "qr":
      return [
        ESC, 0x61, 0x01, // Center align.
        ...qrCode(section.url),
        0x0a,
        ...(section.caption ? textBytes(`${section.caption}\n`) : []),
        ESC, 0x61, 0x00, // Left align.
      ];
    case "weather":
      return sheetWeatherLines(section.weatherData).flatMap((line) =>
        textBytes(`${line}\n`),
      );
    default:
      return [];
  }
}

function sheetSectionLines(section) {
  switch (section.type) {
    case "text":
      return sheetTextLines(section);
    case "divider":
      return [SHEET_DIVIDER];
    case "blank":
      return Array.from({ length: section.lines }, () => "");
    case "image":
      return [`[IMAGE ${section.bitmap.width} x ${section.bitmap.height}]`];
    case "qr":
      return [
        "[QR CODE]",
        ...wrapLine(section.url),
        ...(section.caption ? [section.caption] : []),
      ];
    case "weather":
      return sheetWeatherLines(section.weatherData);
    default:
      return [];
  }
}

// Number of copies to print, defaulting to 1 and capped to avoid runaway jobs.
function clampSheetQuantity(value) {
  const quantity = Math.round(Number(value));

  if (!Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }

  return Math.min(quantity, SHEET_MAX_QUANTITY);
}

// Top/bottom sheet margins in blank lines. 0 is allowed (no margin); capped at
// the same max as the Blank component.
function clampSheetMargin(value) {
  const lines = Math.round(Number(value));

  if (!Number.isFinite(lines) || lines < 0) {
    return 0;
  }

  return Math.min(lines, SHEET_BLANK_MAX_LINES);
}

function clampBlankLines(value) {
  const lines = Math.round(Number(value));

  if (!Number.isFinite(lines) || lines < 1) {
    return SHEET_BLANK_DEFAULT_LINES;
  }

  return Math.min(lines, SHEET_BLANK_MAX_LINES);
}

// Composes a text section's printed lines: base content, optional appended
// date/time, optional checkbox prefix, optional all-caps, then word-wrapped to
// the effective width (halved when the text is double-width).
function sheetTextLines(section) {
  let text = section.content;

  if (section.datetime) {
    const stamp = new Date().toLocaleString();
    text = text ? `${text}: ${stamp}` : stamp;
  }

  if (section.checkbox) {
    text = `[ ] ${text}`;
  }

  if (section.allCaps) {
    text = text.toUpperCase();
  }

  const width =
    section.size === "dw" || section.size === "both"
      ? SHEET_TEXT_WIDTH_DOUBLE
      : SHEET_TEXT_WIDTH;

  return wrapLine(text, width);
}

function sheetWeatherLines(weather) {
  if (!weather) {
    return ["Weather unavailable."];
  }

  const locationLine = weather.location?.label
    ? [`Location: ${sanitizeReceiptText(weather.location.label)}`]
    : [];

  return [
    "Weather",
    ...locationLine,
    `Condition: ${sanitizeReceiptText(weather.condition || "Unknown")}`,
    `Temp: ${weather.temperatureF} F (feels ${weather.apparentTemperatureF} F)`,
    `Humidity: ${weather.humidityPercent}%  Wind: ${weather.windMph} mph`,
  ];
}

function normalizeSheetSections(sections) {
  if (!Array.isArray(sections) || sections.length === 0) {
    const error = new Error("Add at least one section to build a sheet.");
    error.status = 400;
    throw error;
  }

  return sections.map((section, index) => normalizeSheetSection(section, index));
}

function normalizeSheetSection(section, index) {
  const type = section?.type;

  if (!SHEET_SECTION_TYPES.includes(type)) {
    const error = new Error(`Unknown section type at position ${index + 1}.`);
    error.status = 400;
    throw error;
  }

  switch (type) {
    case "text": {
      const content = sanitizeReceiptText(section.content || "").trim();
      const datetime = Boolean(section.datetime);

      if (!content && !datetime) {
        const error = new Error(
          "Enter text, or enable insert date/time, for the text section.",
        );
        error.status = 400;
        throw error;
      }

      return {
        type,
        content,
        datetime,
        align: SHEET_TEXT_ALIGNS.includes(section.align) ? section.align : "left",
        size: SHEET_TEXT_SIZES.includes(section.size) ? section.size : "normal",
        allCaps: Boolean(section.allCaps),
        bold: Boolean(section.bold),
        underline: Boolean(section.underline),
        checkbox: Boolean(section.checkbox),
      };
    }
    case "divider":
      return { type };
    case "blank":
      return { type, lines: clampBlankLines(section.lines) };
    case "image":
      return { type, bitmap: normalizeCustomBitmap(section.bitmap) };
    case "qr":
      return {
        type,
        url: normalizeQrUrl(section.url),
        caption: sanitizeReceiptText(section.caption || "").trim(),
      };
    case "weather":
      return { type, weatherData: section.weatherData || null };
    default:
      return { type };
  }
}

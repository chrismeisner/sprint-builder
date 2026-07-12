import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { mintAgentToken } from "@/lib/printAuth";

// Files that make up the downloadable agent bundle (vendored at printer-agent/).
// The .env is generated per-download, so it is NOT listed here.
const BUNDLE_FILES = [
  "agent.js",
  "printer.js",
  "version.js",
  "package.json",
  "README.md",
  "test-connection.mjs",
  "test-connection.command",
  "start-agent.command",
  "install-service.command",
  "uninstall-service.command",
  "com.studio.printagent.plist",
];

// Executable bits for the double-click launchers (JSZip unixPermissions).
const EXECUTABLE = /\.(command)$/;

function resolveServerUrl(request: NextRequest): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/$/, "");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || new URL(request.url).host;
  return `${proto}://${host}`;
}

// POST /api/print/agents/:id/installer — admin: mint a fresh key for this agent
// (invalidating any prior bundle), then stream a turnkey .zip with a pre-filled
// .env. See docs/studio-printer-plan.md §8.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();

    const agentRes = await pool.query(
      `SELECT id, name FROM print_agents WHERE id = $1`,
      [params.id]
    );
    if (agentRes.rowCount === 0) {
      return NextResponse.json({ error: "agent not found." }, { status: 404 });
    }
    const agent = agentRes.rows[0] as { id: string; name: string };

    // Default the .env PRINTERS list to this agent's registered printers.
    const printersRes = await pool.query(
      `SELECT cups_name FROM printers WHERE agent_id = $1 ORDER BY created_at`,
      [agent.id]
    );
    const printers = printersRes.rows.map((r) => r.cups_name).join(",") || "EPSON_TM_T88V";

    // Mint + persist a fresh key. The plaintext only ever lives in this .zip.
    const { token, hash } = mintAgentToken();
    await pool.query(`UPDATE print_agents SET key_hash = $2 WHERE id = $1`, [agent.id, hash]);

    const serverUrl = resolveServerUrl(request);
    const envFile =
      `# Studio print agent — generated for "${agent.name}". Keep this secret.\n` +
      `SERVER_URL=${serverUrl}\n` +
      `AGENT_KEY=${token}\n` +
      `PRINTERS=${printers}\n` +
      `POLL_INTERVAL_MS=5000\n` +
      `MAX_CLAIM=5\n` +
      `# DRY_RUN=1  # uncomment to log receipts instead of printing (testing)\n`;

    const bundleDir = path.join(process.cwd(), "printer-agent");
    const zip = new JSZip();
    const root = zip.folder("studio-print-agent")!;
    root.file(".env", envFile);
    for (const name of BUNDLE_FILES) {
      const contents = fs.readFileSync(path.join(bundleDir, name));
      root.file(name, contents, EXECUTABLE.test(name) ? { unixPermissions: 0o755 } : undefined);
    }

    const buffer = await zip.generateAsync({
      type: "nodebuffer",
      platform: "UNIX",
      compression: "DEFLATE",
    });
    const safeName = agent.name.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
    const filename = `studio-print-agent-${safeName}.zip`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error building agent installer:", error);
    return NextResponse.json({ error: "Failed to build installer" }, { status: 500 });
  }
}

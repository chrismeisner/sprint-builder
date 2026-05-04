import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const HUB_DIR = path.join(process.cwd(), "lib", "design-system", "hub");

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

/**
 * GET /sandboxes/miles-proto-4/hub/manifest
 *
 * Returns the design system hub manifest (token set order, paths, Figma file key, outputs).
 * Useful for tooling or plugins that need the hub index.
 */
export async function GET() {
  try {
    const manifestPath = path.join(HUB_DIR, "manifest.json");
    const raw = await fs.promises.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw);
    return withCors(
      NextResponse.json(manifest, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json",
        },
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return withCors(
      NextResponse.json(
        { error: "Failed to load manifest", detail: message },
        { status: 500 }
      )
    );
  }
}

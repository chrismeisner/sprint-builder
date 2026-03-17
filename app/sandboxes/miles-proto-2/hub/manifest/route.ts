import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const HUB_DIR = path.join(process.cwd(), "lib", "design-system", "hub");

/**
 * GET /sandboxes/miles-proto-2/hub/manifest
 *
 * Returns the design system hub manifest (token set order, paths, Figma file key, outputs).
 * Useful for tooling or plugins that need the hub index.
 */
export async function GET() {
  try {
    const manifestPath = path.join(HUB_DIR, "manifest.json");
    const raw = await fs.promises.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw);
    return NextResponse.json(manifest, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to load manifest", detail: message },
      { status: 500 }
    );
  }
}

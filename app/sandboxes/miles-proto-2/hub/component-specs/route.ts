import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const HUB_DIR = path.join(process.cwd(), "lib", "design-system", "hub");

/**
 * GET /sandboxes/miles-proto-2/hub/component-specs
 *
 * Returns the component contract (Button, Card, Input, etc.) with token usage.
 * Plugins or design tools can use this to map Figma components to token names.
 */
export async function GET() {
  try {
    const specsPath = path.join(HUB_DIR, "component-specs.json");
    const raw = await fs.promises.readFile(specsPath, "utf8");
    const specs = JSON.parse(raw);
    return NextResponse.json(specs, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to load component specs", detail: message },
      { status: 500 }
    );
  }
}

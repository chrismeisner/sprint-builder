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
    return withCors(
      NextResponse.json(specs, {
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
        { error: "Failed to load component specs", detail: message },
        { status: 500 }
      )
    );
  }
}

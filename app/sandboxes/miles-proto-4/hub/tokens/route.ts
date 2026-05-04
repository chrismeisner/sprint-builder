import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const TOKENS_DIR = path.join(
  process.cwd(),
  "lib",
  "design-system",
  "tokens"
);

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
 * GET /sandboxes/miles-proto-4/hub/tokens
 *
 * Returns a single JSON object in the format expected by Tokens Studio for Figma
 * (and other plugins that consume DTCG design tokens). Use this URL in the plugin's
 * "Sync from URL" or "Load tokens from URL" to pull primitives, typography, state,
 * semantic-light, semantic-dark, and sizing token sets with tokenSetOrder.
 */
export async function GET() {
  try {
    const metadataPath = path.join(TOKENS_DIR, "$metadata.json");
    const primitivesPath = path.join(TOKENS_DIR, "primitives.json");
    const semanticLightPath = path.join(TOKENS_DIR, "semantic-light.json");
    const semanticDarkPath = path.join(TOKENS_DIR, "semantic-dark.json");
    const sizingPath = path.join(TOKENS_DIR, "sizing.json");
    const typographyPath = path.join(TOKENS_DIR, "typography.json");
    const statePath = path.join(TOKENS_DIR, "state.json");

    const [$metadata, primitives, typography, state, semanticLight, semanticDark, sizing] =
      await Promise.all([
        fs.promises.readFile(metadataPath, "utf8").then(JSON.parse),
        fs.promises.readFile(primitivesPath, "utf8").then(JSON.parse),
        fs.promises.readFile(typographyPath, "utf8").then(JSON.parse),
        fs.promises.readFile(statePath, "utf8").then(JSON.parse),
        fs.promises.readFile(semanticLightPath, "utf8").then(JSON.parse),
        fs.promises.readFile(semanticDarkPath, "utf8").then(JSON.parse),
        fs.promises.readFile(sizingPath, "utf8").then(JSON.parse),
      ]);

    const combined = {
      $metadata: $metadata,
      primitives,
      typography,
      state,
      "semantic-light": semanticLight,
      "semantic-dark": semanticDark,
      sizing,
    };

    return withCors(
      NextResponse.json(combined, {
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
        { error: "Failed to load tokens", detail: message },
        { status: 500 }
      )
    );
  }
}

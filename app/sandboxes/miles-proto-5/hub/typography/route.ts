import { NextResponse } from "next/server";
import { iosTypographyScale } from "@/lib/design-system/ios-typography";

export const dynamic = "force-dynamic";

/**
 * Returns one Figma text style per iOS typography token.
 * Style names follow the pattern: Miles/{name}  (e.g. "Miles/Large Title")
 *
 * No mobile/desktop split — this is an iOS handoff reference and every
 * style maps directly to a single iOS HIG Dynamic Type role or a named
 * custom size.
 */

type FigmaTextStyle = {
  name: string;
  fontFamily: string;
  fontStyle: string;
  fontSizePx: number;
  lineHeightPx: number;
  letterSpacingPercent: number;
};

function fontStyleFromWeight(weight: number): string {
  if (weight >= 900) return "Black";
  if (weight >= 800) return "Extra Bold";
  if (weight >= 700) return "Bold";
  if (weight >= 600) return "Semi Bold";
  if (weight >= 500) return "Medium";
  if (weight >= 400) return "Regular";
  if (weight >= 300) return "Light";
  return "Regular";
}

function buildStyles(): FigmaTextStyle[] {
  return iosTypographyScale.map((token) => ({
    name: `Miles/${token.name}`,
    // AI voice styles use Roboto Mono (widely available in Figma);
    // all others use Inter (maps to SF Pro on iOS).
    fontFamily: token.mono ? "Roboto Mono" : "Inter",
    fontStyle: fontStyleFromWeight(token.fontWeightNumeric),
    fontSizePx: token.sizePx,
    lineHeightPx: token.lineHeightPx,
    // Convert em → percent (Figma uses percent for letter spacing)
    letterSpacingPercent: token.letterSpacingEm * 100,
  }));
}

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  return withCors(
    NextResponse.json(
      { styles: buildStyles() },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json",
        },
      }
    )
  );
}

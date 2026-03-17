import { NextResponse } from "next/server";
import { typographyScale } from "@/lib/design-system/tokens";

export const dynamic = "force-dynamic";

type TypographyStyle = {
  name: string;
  fontFamily: string;
  fontWeight: number;
  fontStyle: string;
  fontSizePx: number;
  lineHeightPx: number;
  letterSpacingPercent: number;
};

function parseToPx(input: string): number {
  const value = input.trim().toLowerCase();
  if (value.endsWith("px")) {
    return parseFloat(value.slice(0, -2));
  }
  if (value.endsWith("rem")) {
    return parseFloat(value.slice(0, -3)) * 16;
  }
  const asNum = parseFloat(value);
  return Number.isFinite(asNum) ? asNum : 0;
}

function parseWeight(input: string): number {
  const m = input.match(/(\d{3})/);
  return m ? parseInt(m[1], 10) : 400;
}

function fontStyleFromWeight(weight: number): string {
  if (weight >= 900) return "Black";
  if (weight >= 800) return "Extra Bold";
  if (weight >= 700) return "Bold";
  if (weight >= 600) return "Semi Bold";
  if (weight >= 500) return "Medium";
  if (weight >= 300) return "Light";
  return "Regular";
}

function inferLetterSpacingPercent(baseClass: string): number {
  const m = baseClass.match(/tracking-\[(-?\d*\.?\d+)em\]/);
  if (!m) return 0;
  return parseFloat(m[1]) * 100;
}

function buildStyles(): TypographyStyle[] {
  const styles: TypographyStyle[] = [];

  typographyScale.forEach((token) => {
    const weight = parseWeight(token.fontWeight);
    const fontStyle = fontStyleFromWeight(weight);
    const letterSpacingPercent = inferLetterSpacingPercent(token.baseClass);
    const family = token.fontFamily.includes("Inter") ? "Inter" : "Inter";

    styles.push({
      name: `Miles/${token.id}/mobile`,
      fontFamily: family,
      fontWeight: weight,
      fontStyle,
      fontSizePx: parseToPx(token.mobile.rem),
      lineHeightPx: parseToPx(token.mobile.lineHeight),
      letterSpacingPercent,
    });

    styles.push({
      name: `Miles/${token.id}/desktop`,
      fontFamily: family,
      fontWeight: weight,
      fontStyle,
      fontSizePx: parseToPx(token.desktop.rem),
      lineHeightPx: parseToPx(token.desktop.lineHeight),
      letterSpacingPercent,
    });
  });

  return styles;
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
      {
        styles: buildStyles(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json",
        },
      }
    )
  );
}

import { NextResponse } from "next/server";
import JSZip from "jszip";
import fs from "fs";
import path from "path";

// ─── Token helpers ────────────────────────────────────────────────────────────

type TokenValue = { $value?: string | number; $type?: string };
interface TokenNode { [key: string]: TokenValue | TokenNode }

function flattenTokens(
  node: TokenNode,
  prefix = ""
): Array<{ name: string; value: string; type: string }> {
  const out: Array<{ name: string; value: string; type: string }> = [];
  for (const [key, v] of Object.entries(node)) {
    const p = prefix ? `${prefix}/${key}` : key;
    if (v && typeof v === "object" && "$value" in v) {
      out.push({ name: p, value: String((v as TokenValue).$value ?? ""), type: String((v as TokenValue).$type ?? "") });
    } else if (v && typeof v === "object" && !("$value" in v)) {
      out.push(...flattenTokens(v as TokenNode, p));
    }
  }
  return out;
}

// "text/primary" → "textPrimary"
function toSwiftName(tokenPath: string): string {
  return tokenPath
    .split("/")
    .map((seg, i) => (i === 0 ? seg : seg.charAt(0).toUpperCase() + seg.slice(1)))
    .join("");
}

// ─── Swift file generators ────────────────────────────────────────────────────

const UIColor_HEX_SWIFT = `import UIKit

extension UIColor {
  convenience init(hex: String, alpha: CGFloat = 1.0) {
    var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    hexSanitized = hexSanitized.hasPrefix("#") ? String(hexSanitized.dropFirst()) : hexSanitized
    var rgb: UInt64 = 0
    Scanner(string: hexSanitized).scanHexInt64(&rgb)
    let r = CGFloat((rgb & 0xFF0000) >> 16) / 255.0
    let g = CGFloat((rgb & 0x00FF00) >> 8) / 255.0
    let b = CGFloat(rgb & 0x0000FF) / 255.0
    self.init(red: r, green: g, blue: b, alpha: alpha)
  }
}
`;

function generateMilesTokensSwift(
  lightTokens: Array<{ name: string; value: string; type: string }>,
  darkTokens: Array<{ name: string; value: string; type: string }>,
  sizingTokens: Array<{ name: string; value: string; type: string }>,
  version: string,
  generatedAt: string
): string {
  const darkMap = new Map(darkTokens.map((t) => [t.name, t.value]));
  const colorTokens = lightTokens.filter((t) => t.type === "color");
  const radiusTokens = sizingTokens.filter((t) => t.name.startsWith("borderRadius/"));
  const spacingTokens = sizingTokens.filter(
    (t) => t.name.startsWith("spacing/") && t.type === "dimension"
  );

  const parsePx = (v: string) => v.replace("px", "");

  const colorLines = colorTokens.map((t) => {
    const swiftName = toSwiftName(t.name);
    const dark = darkMap.get(t.name) ?? t.value;
    return (
      `  /// Light: \`${t.value}\`  Dark: \`${dark}\`\n` +
      `  static let ${swiftName} = Color(UIColor { traits in\n` +
      `    traits.userInterfaceStyle == .dark\n` +
      `      ? UIColor(hex: "${dark}")\n` +
      `      : UIColor(hex: "${t.value}")\n` +
      `  })`
    );
  });

  const radiusLines = radiusTokens.map((t) => {
    const swiftName = toSwiftName(t.name); // borderRadius/card → borderRadiusCard
    const val = t.value === "9999px" ? "9999" : parsePx(t.value);
    return `  static let ${swiftName}: CGFloat = ${val}`;
  });

  const spacingLines = spacingTokens.map((t) => {
    const swiftName = toSwiftName(t.name);
    return `  static let ${swiftName}: CGFloat = ${parsePx(t.value)}`;
  });

  return `// MilesTokens.swift
// Generated from Miles Design Hub · token-version: ${version}
// Generated: ${generatedAt}
//
// Usage:
//   .foregroundColor(MilesColor.semanticSuccess)
//   .cornerRadius(MilesRadius.borderRadiusCard)
//   .padding(MilesSpacing.spacing4)
//
// Colors are adaptive — they resolve automatically in Light and Dark mode.
// Import UIColor+Hex.swift into the same target.

import SwiftUI
import UIKit

// MARK: — Colors

enum MilesColor {
${colorLines.join("\n\n")}
}

// MARK: — Border Radius

enum MilesRadius {
${radiusLines.join("\n")}
}

// MARK: — Spacing

enum MilesSpacing {
${spacingLines.join("\n")}
}
`;
}

function generateReadme(version: string, generatedAt: string): string {
  return `# Miles Design System — iOS Package
Generated: ${generatedAt} · token-version: ${version}

## Files

| File | Description |
|---|---|
| \`swift/UIColor+Hex.swift\` | UIColor hex initialiser helper — required by MilesTokens.swift |
| \`swift/MilesTokens.swift\` | Adaptive Color, Radius, and Spacing constants — ready to drop into Xcode |
| \`tokens/semantic-light.json\` | Semantic color tokens · light mode |
| \`tokens/semantic-dark.json\` | Semantic color tokens · dark mode |
| \`tokens/sizing.json\` | Spacing, border-radius, shadow |
| \`tokens/primitives.json\` | Base color palette (all raw primitives) |

## Quick start

1. Add both files in \`swift/\` to your Xcode target.
2. Use the enums directly:

\`\`\`swift
Text("Hello")
  .foregroundColor(MilesColor.semanticSuccess)

RoundedRectangle(cornerRadius: MilesRadius.borderRadiusCard)
  .padding(MilesSpacing.spacing4)
\`\`\`

## Colors

All colors in \`MilesColor\` are adaptive — they use \`UIColor(dynamicProvider:)\` so they
resolve to the correct light or dark value automatically based on the device appearance setting.
No manual light/dark switching needed.

## Staying in sync

This package is generated on demand from the live design hub. Re-download any time after
a token update to pick up the latest values — the Swift enum names stay stable, only the
hex values change.

Hub URL: http://localhost:3000/sandboxes/miles-proto-4/hub
`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET() {
  const tokensDir = path.join(process.cwd(), "lib", "design-system", "tokens");

  const semanticLight = JSON.parse(fs.readFileSync(path.join(tokensDir, "semantic-light.json"), "utf8")) as TokenNode;
  const semanticDark  = JSON.parse(fs.readFileSync(path.join(tokensDir, "semantic-dark.json"),  "utf8")) as TokenNode;
  const sizing        = JSON.parse(fs.readFileSync(path.join(tokensDir, "sizing.json"),          "utf8")) as TokenNode;
  const primitives    = JSON.parse(fs.readFileSync(path.join(tokensDir, "primitives.json"),      "utf8")) as TokenNode;
  const typography    = JSON.parse(fs.readFileSync(path.join(tokensDir, "typography.json"),      "utf8")) as TokenNode;

  const lightTokens   = flattenTokens(semanticLight);
  const darkTokens    = flattenTokens(semanticDark);
  const sizingTokens  = flattenTokens(sizing);

  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as { version: string };
  const version = pkg.version ?? "0.0.0";
  const generatedAt = new Date().toISOString().slice(0, 16).replace("T", " ");

  const swiftTokens  = generateMilesTokensSwift(lightTokens, darkTokens, sizingTokens, version, generatedAt);
  const readme       = generateReadme(version, generatedAt);

  const zip = new JSZip();
  const root = zip.folder("miles-design-system")!;

  root.file("README.md", readme);

  const swiftFolder = root.folder("swift")!;
  swiftFolder.file("UIColor+Hex.swift", UIColor_HEX_SWIFT);
  swiftFolder.file("MilesTokens.swift", swiftTokens);

  const tokensFolder = root.folder("tokens")!;
  tokensFolder.file("semantic-light.json", JSON.stringify(semanticLight, null, 2));
  tokensFolder.file("semantic-dark.json",  JSON.stringify(semanticDark,  null, 2));
  tokensFolder.file("sizing.json",         JSON.stringify(sizing,        null, 2));
  tokensFolder.file("primitives.json",     JSON.stringify(primitives,    null, 2));
  tokensFolder.file("typography.json",     JSON.stringify(typography,    null, 2));

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const filename = `miles-design-system-${version}-${generatedAt.replace(/[ :]/g, "-")}.zip`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

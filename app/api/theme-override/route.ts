import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import {
  DEFAULT_THEME_MODE,
  THEME_OVERRIDE_COOKIE,
  ThemeMode,
  ThemeOverrideSelection,
  normalizeThemeSelection,
} from "@/lib/theme-mode";

function isValidSelection(value: unknown): value is ThemeOverrideSelection {
  return value === "default" || value === "dark" || value === "light";
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const isProduction = process.env.NODE_ENV === "production";

  let mode: unknown;
  try {
    const body = await request.json();
    mode = body?.mode;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!isValidSelection(mode)) {
    return NextResponse.json(
      { error: "Mode must be one of: default, dark, light" },
      { status: 400 }
    );
  }

  const cookieStore = cookies();
  if (mode === "default") {
    cookieStore.delete(THEME_OVERRIDE_COOKIE);
  } else {
    cookieStore.set(THEME_OVERRIDE_COOKIE, mode, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      secure: isProduction,
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  const effectiveMode = normalizeThemeSelection(mode);
  return NextResponse.json({
    mode: effectiveMode,
    selection: mode,
  });
}

export async function GET() {
  await requireAdmin();
  const cookieStore = cookies();
  const current =
    cookieStore.get(THEME_OVERRIDE_COOKIE)?.value ??
    ("default" satisfies ThemeOverrideSelection);
  const selection: ThemeOverrideSelection = isValidSelection(current)
    ? current
    : "default";

  return NextResponse.json({
    mode: normalizeThemeSelection(selection),
    selection,
    defaultMode: DEFAULT_THEME_MODE,
  });
}



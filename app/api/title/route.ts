import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      // Avoid sending credentials; this is a simple pass-through for title lookup.
      redirect: "follow",
    });
    const html = await res.text();
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = match?.[1]?.trim() || parsed.hostname;
    return NextResponse.json({ title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch title";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "AI sprint generation is disabled", status: "disabled" },
    { status: 410 }
  );
}

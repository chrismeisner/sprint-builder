import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";

export async function POST() {
  try {
    await ensureSchema();
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}



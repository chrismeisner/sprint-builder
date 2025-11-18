import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { DEFAULT_SPRINT_SYSTEM_PROMPT, DEFAULT_SPRINT_USER_PROMPT } from "@/lib/prompts";

export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();
    await pool.query(
      `
        INSERT INTO app_settings (key, value, updated_at)
        VALUES
          ('sprint_system_prompt', $1, now()),
          ('sprint_user_prompt', $2, now())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = now()
      `,
      [DEFAULT_SPRINT_SYSTEM_PROMPT, DEFAULT_SPRINT_USER_PROMPT]
    );
    return NextResponse.json({ ok: true, seeded: ["sprint_system_prompt", "sprint_user_prompt"] });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}



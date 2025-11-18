import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { DEFAULT_SPRINT_SYSTEM_PROMPT, DEFAULT_SPRINT_USER_PROMPT } from "@/lib/prompts";

const KEYS = {
  sprintSystemPrompt: "sprint_system_prompt",
  sprintUserPrompt: "sprint_user_prompt",
} as const;

export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    const res = await pool.query(
      `SELECT key, value FROM app_settings WHERE key = ANY($1::text[])`,
      [[KEYS.sprintSystemPrompt, KEYS.sprintUserPrompt]]
    );
    const map = new Map<string, string | null>(
      res.rows.map((r: { key: string; value: string | null }) => [r.key, r.value]),
    );
    return NextResponse.json({
      sprintSystemPrompt: map.get(KEYS.sprintSystemPrompt) ?? DEFAULT_SPRINT_SYSTEM_PROMPT,
      sprintUserPrompt: map.get(KEYS.sprintUserPrompt) ?? DEFAULT_SPRINT_USER_PROMPT,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = (await request.json().catch(() => ({}))) as unknown;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { sprintSystemPrompt, sprintUserPrompt } = body as {
      sprintSystemPrompt?: unknown;
      sprintUserPrompt?: unknown;
    };
    const updates: Array<{ key: string; value: string }> = [];
    if (typeof sprintSystemPrompt === "string") {
      updates.push({ key: KEYS.sprintSystemPrompt, value: sprintSystemPrompt });
    }
    if (typeof sprintUserPrompt === "string") {
      updates.push({ key: KEYS.sprintUserPrompt, value: sprintUserPrompt });
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }
    const pool = getPool();
    for (const u of updates) {
      await pool.query(
        `
          INSERT INTO app_settings (key, value, updated_at)
          VALUES ($1, $2, now())
          ON CONFLICT (key)
          DO UPDATE SET value = EXCLUDED.value, updated_at = now()
        `,
        [u.key, u.value]
      );
    }
    return NextResponse.json({ ok: true, updated: updates.map((u) => u.key) });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

 


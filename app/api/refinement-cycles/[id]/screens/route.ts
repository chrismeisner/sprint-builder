import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

type Params = { params: { id: string } };

const MAX_TEXT = 5000;

function clipText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_TEXT) : null;
}

export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const pool = getPool();
    const cycleRes = await pool.query(
      `SELECT status, submitter_email
       FROM refinement_cycles WHERE id = $1 LIMIT 1`,
      [params.id]
    );
    if (cycleRes.rowCount === 0) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }
    const cycleRow = cycleRes.rows[0] as {
      status: string;
      submitter_email: string | null;
    };

    const isAdmin = Boolean(user.isAdmin);
    const isSubmitter =
      cycleRow.submitter_email != null &&
      cycleRow.submitter_email.toLowerCase() === user.email.toLowerCase();
    if (!isAdmin && !isSubmitter) {
      return NextResponse.json(
        { error: "Only the studio or the original submitter can edit scope" },
        { status: 403 }
      );
    }

    if (cycleRow.status !== "submitted") {
      return NextResponse.json(
        { error: "Scope is locked once the cycle is accepted or declined" },
        { status: 409 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: unknown;
      notes?: unknown;
      adminNote?: unknown;
      screenshotUrl?: unknown;
    };

    const name = clipText(body.name);
    const notes = clipText(body.notes);
    // Submitter-added screens never carry an admin_note (it's a studio-only
    // annotation). Ignore the field if the caller isn't an admin.
    const adminNote = isAdmin ? clipText(body.adminNote) : null;
    const screenshotUrl =
      typeof body.screenshotUrl === "string" && body.screenshotUrl.trim()
        ? body.screenshotUrl.trim().slice(0, 1000)
        : null;
    const addedBy: "client" | "admin" = isAdmin ? "admin" : "client";

    const sortRes = await pool.query(
      `SELECT COALESCE(MAX(sort_order) + 1, 0) AS next_sort
       FROM refinement_cycle_screens
       WHERE refinement_cycle_id = $1`,
      [params.id]
    );
    const sortOrder = Number(sortRes.rows[0].next_sort ?? 0);

    const id = randomUUID();
    const insertRes = await pool.query(
      `
      INSERT INTO refinement_cycle_screens (
        id, refinement_cycle_id, name, notes, screenshot_url,
        added_by, admin_note, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, notes, screenshot_url, added_by, admin_note,
                sort_order, created_at
      `,
      [id, params.id, name, notes, screenshotUrl, addedBy, adminNote, sortOrder]
    );

    // Stamp the parent cycle's last-edited fields so the studio sees the
    // scope changed before they accept/decline.
    await pool.query(
      `UPDATE refinement_cycles
       SET last_edited_at = now(),
           last_edited_by = $1,
           updated_at = now()
       WHERE id = $2`,
      [user.accountId, params.id]
    );

    const row = insertRes.rows[0];
    return NextResponse.json(
      {
        screen: {
          id: row.id as string,
          name: (row.name as string | null) ?? null,
          notes: (row.notes as string | null) ?? null,
          screenshotUrl: (row.screenshot_url as string | null) ?? null,
          addedBy: row.added_by as "client" | "admin",
          adminNote: (row.admin_note as string | null) ?? null,
          sortOrder: Number(row.sort_order ?? 0),
          createdAt:
            row.created_at instanceof Date
              ? row.created_at.toISOString()
              : (row.created_at as string),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[RefinementCycle screens POST]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to add screen" },
      { status: 500 }
    );
  }
}

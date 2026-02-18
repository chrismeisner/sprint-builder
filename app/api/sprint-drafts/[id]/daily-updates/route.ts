import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ATTITUDE_THEMES } from "@/lib/sprintProcess";

type Params = { params: { id: string } };

type UpdateLink = { url: string; label: string };
type UpdateAttachment = { url: string; fileName: string; mimetype: string; fileSizeBytes: number };

/**
 * GET /api/sprint-drafts/[id]/daily-updates
 * Returns all daily updates for a sprint, ordered by sprint_day then created_at.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const { id } = params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const sprintRes = await pool.query(
      `SELECT sd.id, sd.project_id, d.account_id
       FROM sprint_drafts sd
       LEFT JOIN documents d ON sd.document_id = d.id
       WHERE sd.id = $1`,
      [id]
    );
    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const sprint = sprintRes.rows[0] as {
      id: string;
      project_id: string | null;
      account_id: string | null;
    };

    const isOwner = sprint.account_id === user.accountId;
    const isAdmin = user.isAdmin;
    let isProjectMember = false;
    if (sprint.project_id) {
      const memberRes = await pool.query(
        `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
        [sprint.project_id, user.email]
      );
      isProjectMember = (memberRes.rowCount ?? 0) > 0;
    }

    if (!isOwner && !isAdmin && !isProjectMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Ensure attachments column exists
    await pool.query(`
      ALTER TABLE sprint_daily_updates ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'
    `);

    const result = await pool.query(
      `SELECT
         sdu.id,
         sdu.sprint_day,
         sdu.total_days,
         sdu.frame,
         sdu.body,
         sdu.links,
         sdu.attachments,
         sdu.created_at,
         sdu.updated_at,
         a.first_name,
         a.last_name,
         a.name,
         a.email
       FROM sprint_daily_updates sdu
       JOIN accounts a ON sdu.account_id = a.id
       WHERE sdu.sprint_draft_id = $1
       ORDER BY sdu.sprint_day ASC, sdu.created_at ASC`,
      [id]
    );

    const updates = result.rows.map((r) => ({
      id: r.id as string,
      sprintDay: Number(r.sprint_day),
      totalDays: Number(r.total_days),
      frame: r.frame as string | null,
      body: r.body as string,
      links: (r.links ?? []) as UpdateLink[],
      attachments: (r.attachments ?? []) as UpdateAttachment[],
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
      authorName:
        [r.first_name, r.last_name].filter(Boolean).join(" ") ||
        (r.name as string | null) ||
        (r.email as string),
    }));

    return NextResponse.json({ updates });
  } catch (err) {
    console.error("GET sprint daily-updates error:", err);
    return NextResponse.json(
      { error: "Failed to load daily updates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sprint-drafts/[id]/daily-updates
 * Create a new daily update. Admin only.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const { id } = params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const sprintRes = await pool.query(
      `SELECT id, weeks, start_date FROM sprint_drafts WHERE id = $1`,
      [id]
    );
    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const sprint = sprintRes.rows[0] as {
      id: string;
      weeks: number | null;
      start_date: string | Date | null;
    };

    const body = await request.json();
    const {
      sprintDay,
      frame,
      body: updateBody,
      links,
      attachments,
    } = body as {
      sprintDay?: number;
      frame?: string;
      body?: string;
      links?: UpdateLink[];
      attachments?: UpdateAttachment[];
    };

    const totalDays = (sprint.weeks ?? 2) * 5;

    // Auto-calculate sprint day from start_date if not provided
    let day = sprintDay;
    if (day == null && sprint.start_date) {
      const start = new Date(sprint.start_date);
      const now = new Date();
      let businessDays = 0;
      const current = new Date(start);
      while (current <= now) {
        const dow = current.getDay();
        if (dow !== 0 && dow !== 6) businessDays++;
        current.setDate(current.getDate() + 1);
      }
      day = Math.max(1, Math.min(businessDays, totalDays));
    }

    if (day == null || day < 1) {
      return NextResponse.json(
        { error: "sprintDay is required (or sprint must have a start_date)" },
        { status: 400 }
      );
    }

    if (!updateBody || typeof updateBody !== "string" || !updateBody.trim()) {
      return NextResponse.json(
        { error: "Update body text is required" },
        { status: 400 }
      );
    }

    if (frame && !ATTITUDE_THEMES.includes(frame as typeof ATTITUDE_THEMES[number])) {
      return NextResponse.json(
        { error: `Invalid frame. Must be one of: ${ATTITUDE_THEMES.join(", ")}` },
        { status: 400 }
      );
    }

    const safeLinks: UpdateLink[] = Array.isArray(links)
      ? links
          .filter(
            (l): l is UpdateLink =>
              typeof l === "object" &&
              l !== null &&
              typeof l.url === "string" &&
              typeof l.label === "string"
          )
          .map((l) => ({ url: l.url.trim(), label: l.label.trim() }))
      : [];

    const safeAttachments: UpdateAttachment[] = Array.isArray(attachments)
      ? attachments.filter(
          (a): a is UpdateAttachment =>
            typeof a === "object" &&
            a !== null &&
            typeof a.url === "string" &&
            typeof a.fileName === "string" &&
            typeof a.mimetype === "string"
        )
      : [];

    // Ensure attachments column exists
    await pool.query(`
      ALTER TABLE sprint_daily_updates ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'
    `);

    const updateId = randomBytes(12).toString("hex");
    await pool.query(
      `INSERT INTO sprint_daily_updates (id, sprint_draft_id, account_id, sprint_day, total_days, frame, body, links, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        updateId,
        id,
        user.accountId,
        day,
        totalDays,
        frame || null,
        updateBody.trim(),
        JSON.stringify(safeLinks),
        JSON.stringify(safeAttachments),
      ]
    );

    return NextResponse.json(
      {
        update: {
          id: updateId,
          sprintDay: day,
          totalDays,
          frame: frame || null,
          body: updateBody.trim(),
          links: safeLinks,
          attachments: safeAttachments,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authorName:
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.name ||
            user.email,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST sprint daily-update error:", err);
    return NextResponse.json(
      { error: "Failed to create daily update" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sprint-drafts/[id]/daily-updates
 * Edit an existing daily update. Admin only.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const { id } = params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { updateId, sprintDay, frame, body: updateBody, links, attachments } = body as {
      updateId?: string;
      sprintDay?: number;
      frame?: string | null;
      body?: string;
      links?: UpdateLink[];
      attachments?: UpdateAttachment[];
    };

    if (!updateId) {
      return NextResponse.json({ error: "updateId is required" }, { status: 400 });
    }

    const existing = await pool.query(
      `SELECT id FROM sprint_daily_updates WHERE id = $1 AND sprint_draft_id = $2`,
      [updateId, id]
    );
    if (existing.rowCount === 0) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (sprintDay != null) {
      sets.push(`sprint_day = $${idx++}`);
      vals.push(sprintDay);
    }
    if (frame !== undefined) {
      if (frame !== null && !ATTITUDE_THEMES.includes(frame as typeof ATTITUDE_THEMES[number])) {
        return NextResponse.json(
          { error: `Invalid frame. Must be one of: ${ATTITUDE_THEMES.join(", ")}` },
          { status: 400 }
        );
      }
      sets.push(`frame = $${idx++}`);
      vals.push(frame);
    }
    if (updateBody != null) {
      sets.push(`body = $${idx++}`);
      vals.push(updateBody.trim());
    }
    if (links !== undefined) {
      const safeLinks: UpdateLink[] = Array.isArray(links)
        ? links
            .filter(
              (l): l is UpdateLink =>
                typeof l === "object" &&
                l !== null &&
                typeof l.url === "string" &&
                typeof l.label === "string"
            )
            .map((l) => ({ url: l.url.trim(), label: l.label.trim() }))
        : [];
      sets.push(`links = $${idx++}`);
      vals.push(JSON.stringify(safeLinks));
    }

    if (attachments !== undefined) {
      const safeAttachments: UpdateAttachment[] = Array.isArray(attachments)
        ? attachments.filter(
            (a): a is UpdateAttachment =>
              typeof a === "object" &&
              a !== null &&
              typeof a.url === "string" &&
              typeof a.fileName === "string" &&
              typeof a.mimetype === "string"
          )
        : [];
      sets.push(`attachments = $${idx++}`);
      vals.push(JSON.stringify(safeAttachments));
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    sets.push(`updated_at = now()`);
    vals.push(updateId);

    await pool.query(
      `UPDATE sprint_daily_updates SET ${sets.join(", ")} WHERE id = $${idx}`,
      vals
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH sprint daily-update error:", err);
    return NextResponse.json(
      { error: "Failed to update daily update" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sprint-drafts/[id]/daily-updates
 * Remove a daily update. Admin only.
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const { id } = params;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const updateId = searchParams.get("updateId");
    if (!updateId) {
      return NextResponse.json({ error: "updateId query param is required" }, { status: 400 });
    }

    const existing = await pool.query(
      `SELECT id FROM sprint_daily_updates WHERE id = $1 AND sprint_draft_id = $2`,
      [updateId, id]
    );
    if (existing.rowCount === 0) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    await pool.query(`DELETE FROM sprint_daily_updates WHERE id = $1`, [updateId]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE sprint daily-update error:", err);
    return NextResponse.json(
      { error: "Failed to delete daily update" },
      { status: 500 }
    );
  }
}

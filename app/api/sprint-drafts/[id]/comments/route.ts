import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: { id: string } };

/**
 * GET /api/sprint-drafts/[id]/comments
 * Returns all comments for a sprint, ordered oldest-first.
 * Public — anyone with the sprint ID can read comments.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const { id } = params;

    const result = await pool.query(
      `SELECT
         sc.id,
         sc.body,
         sc.created_at,
         a.first_name,
         a.last_name,
         a.name,
         a.email
       FROM sprint_comments sc
       JOIN accounts a ON sc.account_id = a.id
       WHERE sc.sprint_draft_id = $1
       ORDER BY sc.created_at ASC`,
      [id]
    );

    const comments = result.rows.map((r) => ({
      id: r.id as string,
      body: r.body as string,
      createdAt: r.created_at as string,
      authorName:
        [r.first_name, r.last_name].filter(Boolean).join(" ") ||
        (r.name as string | null) ||
        (r.email as string),
      authorEmail: r.email as string,
    }));

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("GET sprint comments error:", err);
    return NextResponse.json(
      { error: "Failed to load comments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sprint-drafts/[id]/comments
 * Add a comment. Requires login AND the user must be an admin or a member of the sprint's project.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const { id } = params;

    // Auth required
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    // Verify sprint exists and get project_id
    const sprintRes = await pool.query(
      `SELECT id, project_id FROM sprint_drafts WHERE id = $1`,
      [id]
    );
    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const sprint = sprintRes.rows[0] as {
      id: string;
      project_id: string | null;
    };

    // Check authorization: must be admin or a project member
    if (!user.isAdmin && sprint.project_id) {
      const memberRes = await pool.query(
        `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
        [sprint.project_id, user.email]
      );
      if ((memberRes.rowCount ?? 0) === 0) {
        // Also check if user is the project owner
        const projectRes = await pool.query(
          `SELECT account_id FROM projects WHERE id = $1`,
          [sprint.project_id]
        );
        const isOwner =
          projectRes.rowCount &&
          (projectRes.rows[0] as { account_id: string | null }).account_id ===
            user.accountId;
        if (!isOwner) {
          return NextResponse.json(
            { error: "Not authorized to comment on this sprint" },
            { status: 403 }
          );
        }
      }
    }

    const body = await request.json();
    const commentBody = (body.body ?? "").trim();
    if (!commentBody) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }

    const commentId = randomBytes(12).toString("hex");
    await pool.query(
      `INSERT INTO sprint_comments (id, sprint_draft_id, account_id, body) VALUES ($1, $2, $3, $4)`,
      [commentId, id, user.accountId, commentBody]
    );

    // Return the new comment
    const newComment = {
      id: commentId,
      body: commentBody,
      createdAt: new Date().toISOString(),
      authorName:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.name ||
        user.email,
      authorEmail: user.email,
    };

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (err) {
    console.error("POST sprint comment error:", err);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}

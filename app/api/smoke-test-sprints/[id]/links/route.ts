import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

type Params = { params: { id: string } };

async function verifyAccess(sprintId: string) {
  const pool = getPool();
  const res = await pool.query(
    `SELECT id FROM smoke_test_sprints WHERE id = $1`,
    [sprintId]
  );
  return res.rowCount !== 0;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    if (!(await verifyAccess(params.id))) {
      return NextResponse.json({ error: "Smoke test sprint not found" }, { status: 404 });
    }

    const res = await pool.query(
      `SELECT id, name, link_type, url, file_url, file_name,
              file_size_bytes, mimetype, description, created_at
       FROM smoke_test_sprint_links
       WHERE smoke_test_sprint_id = $1
       ORDER BY created_at DESC`,
      [params.id]
    );

    const links = res.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      linkType: row.link_type as "url" | "file",
      url: row.url as string | null,
      fileUrl: row.file_url as string | null,
      fileName: row.file_name as string | null,
      fileSizeBytes: row.file_size_bytes ? Number(row.file_size_bytes) : null,
      mimetype: row.mimetype as string | null,
      description: row.description as string | null,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : (row.created_at as string),
    }));

    return NextResponse.json({ links });
  } catch (err) {
    console.error("[SmokeTestSprintLinks GET]", err);
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    if (!(await verifyAccess(params.id))) {
      return NextResponse.json({ error: "Smoke test sprint not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      url?: string;
      description?: string;
    };

    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let parsedHost = "";
    try {
      parsedHost = new URL(url).hostname;
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim().slice(0, 200)
        : parsedHost;
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim().slice(0, 500)
        : null;

    const linkId = randomUUID();
    const now = new Date().toISOString();

    await pool.query(
      `INSERT INTO smoke_test_sprint_links
        (id, smoke_test_sprint_id, name, link_type, url, description, created_by)
       VALUES ($1, $2, $3, 'url', $4, $5, $6)`,
      [linkId, params.id, name, url, description, user.accountId ?? null]
    );

    return NextResponse.json(
      {
        success: true,
        link: {
          id: linkId,
          name,
          linkType: "url" as const,
          url,
          fileUrl: null,
          fileName: null,
          fileSizeBytes: null,
          mimetype: null,
          description,
          createdAt: now,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[SmokeTestSprintLinks POST]", err);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("linkId");
    if (!linkId) {
      return NextResponse.json({ error: "linkId is required" }, { status: 400 });
    }

    const res = await pool.query(
      `DELETE FROM smoke_test_sprint_links
       WHERE id = $1 AND smoke_test_sprint_id = $2`,
      [linkId, params.id]
    );
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[SmokeTestSprintLinks DELETE]", err);
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
  }
}

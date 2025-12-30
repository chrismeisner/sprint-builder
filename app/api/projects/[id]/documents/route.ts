import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const pool = getPool();
    // Allow owners, admins, or project members to view documents
    const projectCheck = await pool.query(
      `SELECT account_id FROM projects WHERE id = $1`,
      [params.id]
    );
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const projectAccountId = (projectCheck.rows[0] as { account_id: string | null }).account_id;
    const isOwner = projectAccountId === user.accountId;
    const isAdmin = Boolean(user.isAdmin);
    const membershipRes = await pool.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
      [params.id, user.email]
    );
    const isMember = (membershipRes?.rowCount ?? 0) > 0;

    if (!isOwner && !isAdmin && !isMember) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const docs = await pool.query(
      `SELECT id, filename, content, created_at
       FROM documents
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [params.id]
    );

    const mapped = docs.rows.map((d) => {
      const content = d.content as { type?: string; mimetype?: string; size?: number; url?: string; title?: string } | null;
      const type = content?.type ?? "upload";
      if (type === "link") {
        return {
          id: d.id as string,
          kind: "link" as const,
          title: content?.title ?? d.filename ?? "Link",
          url: content?.url ?? null,
          createdAt: d.created_at,
        };
      }
      return {
        id: d.id as string,
        kind: "file" as const,
        filename: (d.filename as string | null) ?? "Untitled",
        createdAt: d.created_at,
        mimetype: content?.mimetype ?? null,
        size: content?.size ?? null,
      };
    });

    return NextResponse.json({ documents: mapped });
  } catch (error: unknown) {
    console.error("[ProjectDocuments] GET error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const pool = getPool();
    // Allow owners, admins, or project members to add documents
    const projectCheck = await pool.query(
      `SELECT account_id FROM projects WHERE id = $1`,
      [params.id]
    );
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const projectAccountId = (projectCheck.rows[0] as { account_id: string | null }).account_id;
    const isOwner = projectAccountId === user.accountId;
    const isAdmin = Boolean(user.isAdmin);
    const membershipRes = await pool.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
      [params.id, user.email]
    );
    const isMember = (membershipRes?.rowCount ?? 0) > 0;

    if (!isOwner && !isAdmin && !isMember) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";

    // Branch: JSON body for link
    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => ({}))) as { url?: unknown; title?: unknown };
      if (typeof body.url !== "string" || !body.url.trim()) {
        return NextResponse.json({ error: "url is required" }, { status: 400 });
      }
      const url = body.url.trim();
      const title =
        typeof body.title === "string" && body.title.trim().length > 0
          ? body.title.trim()
          : new URL(url).hostname + " • " + new Date().toLocaleDateString();

      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO documents (id, content, filename, email, account_id, project_id)
         VALUES ($1, $2::jsonb, $3, $4, $5, $6)`,
        [
          id,
          JSON.stringify({
            type: "link",
            url,
            title,
          }),
          title,
          user.email,
          user.accountId,
          params.id,
        ]
      );
      return NextResponse.json({ id }, { status: 201 });
    }

    // Branch: file upload via form-data
    const form = await request.formData();
    const file = form.get("file");
    const isBlobLike = file && typeof (file as Blob).arrayBuffer === "function";
    if (!file || !isBlobLike) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const blob = file as Blob & { name?: string; type?: string };
    const arrayBuffer = await blob.arrayBuffer();
    const size = arrayBuffer.byteLength;
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO documents (id, content, filename, email, account_id, project_id)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6)`,
      [
        id,
        JSON.stringify({
          type: "upload",
          mimetype: blob.type || "application/octet-stream",
          size,
          base64,
        }),
        blob.name || "upload",
        user.email,
        user.accountId,
        params.id,
      ]
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (error: unknown) {
    console.error("[ProjectDocuments] POST error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("id");
    if (!docId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const pool = getPool();
    // Allow owners, admins, or project members to delete project documents
    const projectCheck = await pool.query(
      `SELECT account_id FROM projects WHERE id = $1`,
      [params.id]
    );
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const projectAccountId = (projectCheck.rows[0] as { account_id: string | null }).account_id;
    const isOwner = projectAccountId === user.accountId;
    const isAdmin = Boolean(user.isAdmin);
    const membershipRes = await pool.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
      [params.id, user.email]
    );
    const isMember = membershipRes.rowCount > 0;

    if (!isOwner && !isAdmin && !isMember) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const result = await pool.query(
      `DELETE FROM documents
       WHERE id = $1 AND project_id = $2`,
      [docId, params.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[ProjectDocuments] DELETE error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

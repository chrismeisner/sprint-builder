import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: { id: string; docId: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const pool = getPool();
    // Allow owners, admins, or project members to view the document
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
      `SELECT content, filename
       FROM documents
       WHERE id = $1 AND project_id = $2
       LIMIT 1`,
      [params.docId, params.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const row = result.rows[0];
    const content = row.content as { type?: string; base64?: string; mimetype?: string } | null;
    if (content?.type !== "upload" || !content?.base64) {
      return NextResponse.json({ error: "File content unavailable" }, { status: 400 });
    }

    const buffer = Buffer.from(content.base64, "base64");
    const filename = (row.filename as string | null) ?? "file";
    const mime = content.mimetype || "application/octet-stream";

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("[ProjectDocuments:view] GET error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


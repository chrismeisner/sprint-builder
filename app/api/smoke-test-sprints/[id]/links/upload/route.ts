import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile, getStorage } from "@/lib/storage";
import { randomUUID } from "crypto";

type Params = { params: { id: string } };

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);

const MAX_SIZE = 50 * 1024 * 1024;

export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    if (!getStorage()) {
      return NextResponse.json(
        {
          error:
            "File upload is not configured. Set GCS_PROJECT_ID, GCS_BUCKET_NAME, and GCS credentials.",
        },
        { status: 503 }
      );
    }

    const pool = getPool();
    const sprintRes = await pool.query(
      `SELECT id FROM smoke_test_sprints WHERE id = $1`,
      [params.id]
    );
    if (sprintRes.rowCount === 0) {
      return NextResponse.json(
        { error: "Smoke test sprint not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: `File type not allowed: ${file.type}. Allowed: PDF, images, Word, Excel, text.`,
        },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await uploadFile(buffer, file.name, file.type, {
      prefix: `smoke-test-sprint-links/${params.id}`,
    });

    const linkId = randomUUID();
    const linkName = name?.trim() || file.name;
    const now = new Date().toISOString();

    await pool.query(
      `INSERT INTO smoke_test_sprint_links
        (id, smoke_test_sprint_id, name, link_type,
         file_url, file_name, file_size_bytes, mimetype, description, created_by)
       VALUES ($1, $2, $3, 'file', $4, $5, $6, $7, $8, $9)`,
      [
        linkId,
        params.id,
        linkName,
        fileUrl,
        file.name,
        file.size,
        file.type,
        description?.trim() || null,
        user.accountId ?? null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        link: {
          id: linkId,
          name: linkName,
          linkType: "file" as const,
          url: null,
          fileUrl,
          fileName: file.name,
          fileSizeBytes: file.size,
          mimetype: file.type,
          description: description?.trim() || null,
          createdAt: now,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[SmokeTestSprintLinks Upload]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Upload failed" },
      { status: 500 }
    );
  }
}

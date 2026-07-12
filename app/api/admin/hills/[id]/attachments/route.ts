import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { uploadFileWithPath, getSignedFileUrl } from "@/lib/storage";
import crypto from "crypto";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const SIGNED_URL_TTL = 60 * 60;
const ALLOWED = /^(image\/|application\/pdf)/;

// GET /api/admin/hills/[id]/attachments — files attached to the hill, with
// short-lived signed download URLs.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const rows = (
      await pool.query(
        `SELECT id, filename, mimetype, size_bytes, object_path, created_at
           FROM hill_attachments
          WHERE subject_type = 'hill' AND subject_id = $1
          ORDER BY created_at DESC`,
        [params.id]
      )
    ).rows;

    const attachments = await Promise.all(
      rows.map(async (a) => ({
        id: a.id,
        filename: a.filename,
        mimetype: a.mimetype,
        size_bytes: a.size_bytes,
        created_at: a.created_at,
        url: a.object_path ? await getSignedFileUrl(a.object_path, SIGNED_URL_TTL).catch(() => null) : null,
      }))
    );
    return NextResponse.json({ attachments });
  } catch (error) {
    console.error("Error listing hill attachments:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to list attachments" }, { status: 500 });
  }
}

// POST /api/admin/hills/[id]/attachments — upload a file (multipart, field "file").
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const pool = getPool();

    const hill = await pool.query(`SELECT id FROM hills WHERE id = $1`, [params.id]);
    if (hill.rowCount === 0) return NextResponse.json({ error: "Hill not found" }, { status: 404 });

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const contentType = file.type || "application/octet-stream";
    if (!ALLOWED.test(contentType)) {
      return NextResponse.json({ error: "Only images and PDFs are allowed" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File is too large (max 10MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { objectPath } = await uploadFileWithPath(buffer, file.name, contentType, {
      prefix: `hill-attachments/${params.id}`,
    });

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO hill_attachments (id, subject_type, subject_id, filename, file_url,
         object_path, mimetype, size_bytes, link_type, uploaded_by)
       VALUES ($1, 'hill', $2, $3, $4, $4, $5, $6, 'file', $7)`,
      [id, params.id, file.name, objectPath, contentType, file.size, admin.accountId]
    );

    const url = await getSignedFileUrl(objectPath, SIGNED_URL_TTL).catch(() => null);
    return NextResponse.json(
      { attachment: { id, filename: file.name, mimetype: contentType, size_bytes: file.size, url } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading hill attachment:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
  }
}

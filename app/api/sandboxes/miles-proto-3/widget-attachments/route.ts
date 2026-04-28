import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadFileWithPath } from "@/lib/storage";
import { randomUUID } from "crypto";

const MAX_BYTES = 10 * 1024 * 1024;

export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    const res = await pool.query(
      `SELECT id, widget_name, filename, mimetype, file_url, size_bytes, created_at
       FROM miles_proto3_widget_attachments
       ORDER BY created_at DESC`
    );
    const attachments = res.rows.map((row) => ({
      id: row.id as string,
      widgetName: row.widget_name as string,
      filename: row.filename as string,
      mimetype: row.mimetype as string | null,
      fileUrl: row.file_url as string,
      sizeBytes: row.size_bytes ? Number(row.size_bytes) : null,
      createdAt: row.created_at as string,
    }));
    return NextResponse.json({ attachments });
  } catch (err) {
    console.error("[widget-attachments GET]", err);
    return NextResponse.json({ error: "Failed to list attachments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }

    const formData = await request.formData();
    const widgetName = formData.get("widgetName");
    const file = formData.get("file");

    if (typeof widgetName !== "string" || !widgetName.trim()) {
      return NextResponse.json({ error: "widgetName required" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images supported" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { objectPath, publicUrl } = await uploadFileWithPath(
      buffer,
      file.name,
      file.type,
      { prefix: `miles-proto3/widget-attachments/${widgetName.trim()}` }
    );

    const pool = getPool();
    const id = randomUUID();
    await pool.query(
      `INSERT INTO miles_proto3_widget_attachments
        (id, widget_name, filename, mimetype, file_url, object_path, size_bytes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, widgetName.trim(), file.name, file.type, publicUrl, objectPath, file.size, user.accountId]
    );

    return NextResponse.json({
      attachment: {
        id,
        widgetName: widgetName.trim(),
        filename: file.name,
        mimetype: file.type,
        fileUrl: publicUrl,
        sizeBytes: file.size,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[widget-attachments POST]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile, getStorage } from "@/lib/storage";

type Params = { params: { id: string } };

const ALLOWED_TYPES = new Set([
  // Images
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  // Documents
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

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
        { error: "File upload is not configured." },
        { status: 503 }
      );
    }

    const pool = getPool();
    const sprintRes = await pool.query(
      `SELECT id FROM sprint_drafts WHERE id = $1`,
      [params.id]
    );
    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: images (PNG, JPG, GIF, WebP), PDF, plain text, Markdown, CSV, JSON, Word documents." },
        { status: 400 }
      );
    }

    const maxSize = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileUrl = await uploadFile(buffer, file.name, file.type, {
      prefix: `sprint-daily-attachments/${params.id}`,
    });

    return NextResponse.json({
      url: fileUrl,
      fileName: file.name,
      mimetype: file.type,
      fileSizeBytes: file.size,
    });
  } catch (error: unknown) {
    console.error("[DailyUpdate Attachment Upload] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Upload failed" },
      { status: 500 }
    );
  }
}

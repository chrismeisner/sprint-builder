import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile, getStorage } from "@/lib/storage";
import { randomUUID } from "crypto";

type Params = { params: { id: string } };

// Allowed file types for sprint links
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

    // Check if GCS is configured
    if (!getStorage()) {
      return NextResponse.json(
        { error: "File upload is not configured. Please set GCS_PROJECT_ID, GCS_BUCKET_NAME, and GCS credentials." },
        { status: 503 }
      );
    }

    // Verify sprint exists
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
    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}. Allowed: PDF, images, Word, Excel, text files.` },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to GCS with sprint-specific prefix
    const fileUrl = await uploadFile(buffer, file.name, file.type, {
      prefix: `sprint-links/${params.id}`,
    });

    // Create the link record
    const linkId = randomUUID();
    const linkName = name?.trim() || file.name;

    await pool.query(
      `INSERT INTO sprint_links (
        id, sprint_id, name, link_type, file_url, file_name, 
        file_size_bytes, mimetype, description, created_by
      )
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
        user.accountId,
      ]
    );

    return NextResponse.json({
      success: true,
      link: {
        id: linkId,
        name: linkName,
        linkType: "file",
        fileUrl,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimetype: file.type,
        description: description?.trim() || null,
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("[SprintLinks Upload] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Upload failed" },
      { status: 500 }
    );
  }
}

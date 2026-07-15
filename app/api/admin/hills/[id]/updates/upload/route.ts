import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { uploadFile, getStorage } from "@/lib/storage";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB (matches sprint updates)

// POST /api/admin/hills/[id]/updates/upload — upload one file (multipart, field
// "file") for a hill update attachment. Returns { url, fileName, mimetype,
// fileSizeBytes } for the client to attach on the update POST. Mirrors the
// sprint daily-update upload; stored inline on the update.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();

    if (!getStorage()) {
      return NextResponse.json(
        { error: "File upload is not configured (set GCS_PROJECT_ID, GCS_BUCKET_NAME, and credentials)." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum size is 20 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(buffer, file.name, file.type || "application/octet-stream", {
      prefix: `hill-update-attachments/${params.id}`,
    });

    return NextResponse.json(
      { url, fileName: file.name, mimetype: file.type || "application/octet-stream", fileSizeBytes: file.size },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading hill update attachment:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: (error as Error).message ?? "Upload failed" }, { status: 500 });
  }
}

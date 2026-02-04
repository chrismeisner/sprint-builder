import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { uploadFileWithPath, getSignedFileUrl, deleteFile } from "@/lib/storage";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour
const TASK_ATTACHMENTS_PREFIX = "task-attachments";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

type Attachment = {
  id: string;
  name: string;
  objectPath: string;
  contentType: string;
  size: number;
  uploadedAt: string;
};

// POST /api/admin/tasks/attachments - Upload an attachment to a task
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const taskId = formData.get("taskId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Images (JPEG, PNG, GIF, WebP) and PDFs are accepted." },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Verify task exists
    const taskResult = await pool.query(
      `SELECT id, attachments FROM admin_tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rowCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = taskResult.rows[0];
    const existingAttachments: Attachment[] = task.attachments || [];

    // Upload to GCS
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || "application/octet-stream";

    const { objectPath } = await uploadFileWithPath(buffer, file.name, contentType, {
      prefix: `${TASK_ATTACHMENTS_PREFIX}/${taskId}`,
      makePublic: false,
    });

    // Create attachment record
    const attachment: Attachment = {
      id: crypto.randomUUID(),
      name: file.name,
      objectPath,
      contentType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    // Update task with new attachment
    const updatedAttachments = [...existingAttachments, attachment];
    await pool.query(
      `UPDATE admin_tasks SET attachments = $1, updated_at = now() WHERE id = $2`,
      [JSON.stringify(updatedAttachments), taskId]
    );

    // Get signed URL for the response
    const downloadUrl = await getSignedFileUrl(objectPath, SIGNED_URL_TTL_SECONDS);

    return NextResponse.json({
      success: true,
      attachment: {
        ...attachment,
        downloadUrl,
      },
    });
  } catch (error) {
    console.error("Error uploading attachment:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to upload attachment" }, { status: 500 });
  }
}

// GET /api/admin/tasks/attachments?taskId=xxx - Get attachments for a task with signed URLs
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `SELECT attachments FROM admin_tasks WHERE id = $1`,
      [taskId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const attachments: Attachment[] = result.rows[0].attachments || [];

    // Generate signed URLs for each attachment
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (att) => ({
        ...att,
        downloadUrl: await getSignedFileUrl(att.objectPath, SIGNED_URL_TTL_SECONDS),
      }))
    );

    return NextResponse.json({ attachments: attachmentsWithUrls });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch attachments" }, { status: 500 });
  }
}

// DELETE /api/admin/tasks/attachments?taskId=xxx&attachmentId=xxx - Delete an attachment
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const attachmentId = searchParams.get("attachmentId");

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID is required" }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `SELECT attachments FROM admin_tasks WHERE id = $1`,
      [taskId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const attachments: Attachment[] = result.rows[0].attachments || [];
    const attachmentToDelete = attachments.find((att) => att.id === attachmentId);

    if (!attachmentToDelete) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Delete from GCS
    try {
      await deleteFile(attachmentToDelete.objectPath);
    } catch (err) {
      console.error("Failed to delete file from storage:", err);
      // Continue anyway to remove from database
    }

    // Update task to remove attachment
    const updatedAttachments = attachments.filter((att) => att.id !== attachmentId);
    await pool.query(
      `UPDATE admin_tasks SET attachments = $1, updated_at = now() WHERE id = $2`,
      [JSON.stringify(updatedAttachments), taskId]
    );

    return NextResponse.json({
      success: true,
      message: "Attachment deleted",
    });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
  }
}

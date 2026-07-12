import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";

// DELETE /api/admin/hills/[id]/attachments/[attachmentId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();

    const row = await pool.query(
      `SELECT object_path FROM hill_attachments
        WHERE id = $1 AND subject_type = 'hill' AND subject_id = $2`,
      [params.attachmentId, params.id]
    );
    if (row.rowCount === 0) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });

    await pool.query(`DELETE FROM hill_attachments WHERE id = $1`, [params.attachmentId]);

    const objectPath = row.rows[0].object_path;
    if (objectPath) {
      await deleteFile(objectPath).catch((e) => console.error("GCS delete failed (row already removed):", e));
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting hill attachment:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

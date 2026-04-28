import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";

type Params = { params: { id: string } };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }

    const pool = getPool();
    const res = await pool.query(
      `SELECT object_path FROM miles_proto3_widget_attachments WHERE id = $1`,
      [params.id]
    );
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const objectPath = res.rows[0].object_path as string;

    try {
      await deleteFile(objectPath);
    } catch (err) {
      console.warn("[widget-attachments DELETE] GCS delete failed:", err);
    }

    await pool.query(`DELETE FROM miles_proto3_widget_attachments WHERE id = $1`, [params.id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[widget-attachments DELETE]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

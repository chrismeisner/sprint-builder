import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// DELETE /api/print/printers/:id — admin: remove a printer (cascades its jobs).
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const { rowCount } = await getPool().query(
      `DELETE FROM printers WHERE id = $1`,
      [params.id]
    );
    if (rowCount === 0) {
      return NextResponse.json({ error: "printer not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error deleting printer:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

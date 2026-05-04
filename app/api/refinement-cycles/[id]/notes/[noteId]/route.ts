import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: { id: string; noteId: string } };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const pool = getPool();
    const noteRes = await pool.query(
      `SELECT author_account_id, author_email
       FROM refinement_cycle_notes
       WHERE id = $1 AND refinement_cycle_id = $2
       LIMIT 1`,
      [params.noteId, params.id]
    );
    if (noteRes.rowCount === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    const note = noteRes.rows[0] as {
      author_account_id: string | null;
      author_email: string | null;
    };
    const isAdmin = Boolean(user.isAdmin);
    const isAuthor =
      note.author_account_id === user.accountId ||
      (note.author_email != null &&
        note.author_email.toLowerCase() === user.email.toLowerCase());
    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await pool.query(
      `DELETE FROM refinement_cycle_notes
       WHERE id = $1 AND refinement_cycle_id = $2`,
      [params.noteId, params.id]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[RefinementCycle notes DELETE]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to delete note" },
      { status: 500 }
    );
  }
}

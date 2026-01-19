import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type BlockedEmail = {
  id: string;
  email: string;
  reason: string | null;
  blocked_by: string | null;
  blocked_by_email: string | null;
  created_at: string;
};

// GET /api/admin/blocked-emails - List all blocked emails
export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();

    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        be.id,
        be.email,
        be.reason,
        be.blocked_by,
        a.email as blocked_by_email,
        be.created_at
      FROM blocked_emails be
      LEFT JOIN accounts a ON be.blocked_by = a.id
      ORDER BY be.created_at DESC`
    );

    return NextResponse.json({
      blockedEmails: result.rows as BlockedEmail[],
    });
  } catch (error) {
    console.error("Error fetching blocked emails:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch blocked emails" }, { status: 500 });
  }
}

// POST /api/admin/blocked-emails - Add a blocked email
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();

    const body = await request.json();
    const { email, reason } = body;

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const pool = getPool();

    // Check if email is already blocked
    const existing = await pool.query(
      `SELECT id FROM blocked_emails WHERE email = $1`,
      [normalizedEmail]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: "Email is already blocked" }, { status: 400 });
    }

    // Add to blocked list
    const result = await pool.query(
      `INSERT INTO blocked_emails (id, email, reason, blocked_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, reason, created_at`,
      [crypto.randomUUID(), normalizedEmail, reason || null, admin.accountId]
    );

    return NextResponse.json({
      success: true,
      blockedEmail: result.rows[0],
    });
  } catch (error) {
    console.error("Error blocking email:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to block email" }, { status: 500 });
  }
}

// DELETE /api/admin/blocked-emails?id=xxx - Remove a blocked email
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM blocked_emails WHERE id = $1 RETURNING email`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Blocked email not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `${result.rows[0].email} has been unblocked`,
    });
  } catch (error) {
    console.error("Error unblocking email:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to unblock email" }, { status: 500 });
  }
}

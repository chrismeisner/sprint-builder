import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const pool = getPool();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query(`SELECT COUNT(*) FROM accounts`);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated users
    const result = await pool.query(
      `
      SELECT 
        id,
        email,
        is_admin,
        created_at,
        (SELECT COUNT(*) FROM documents WHERE account_id = accounts.id) as document_count
      FROM accounts
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    return NextResponse.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PATCH /api/admin/users?userId=xxx - Update user admin status
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const body = await request.json();
    const { isAdmin } = body;

    if (typeof isAdmin !== "boolean") {
      return NextResponse.json({ error: "isAdmin must be a boolean" }, { status: 400 });
    }

    const pool = getPool();
    
    // Update the user's admin status
    const result = await pool.query(
      `UPDATE accounts SET is_admin = $1 WHERE id = $2 RETURNING id, email, is_admin`,
      [isAdmin, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// This endpoint is for initial setup only - it allows setting the first admin
// After the first admin is set, use the /api/admin/users endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Check if there are already any admins
    const adminCheck = await pool.query(
      `SELECT COUNT(*) as count FROM accounts WHERE is_admin = true`
    );

    const adminCount = parseInt(adminCheck.rows[0].count);

    // If there are already admins, require authentication
    if (adminCount > 0) {
      return NextResponse.json(
        { 
          error: "Admin users already exist. Use /api/admin/users to manage users (requires admin authentication).",
          existingAdmins: adminCount
        },
        { status: 403 }
      );
    }

    // Check if the user exists
    const userCheck = await pool.query(
      `SELECT id, email, is_admin FROM accounts WHERE email = $1`,
      [email]
    );

    if (userCheck.rowCount === 0) {
      return NextResponse.json(
        { error: `User with email ${email} not found. They need to log in first to create an account.` },
        { status: 404 }
      );
    }

    const user = userCheck.rows[0];

    if (user.is_admin) {
      return NextResponse.json({
        success: true,
        message: "User is already an admin",
        user: {
          email: user.email,
          isAdmin: true,
        },
      });
    }

    // Set the user as admin
    const updateResult = await pool.query(
      `UPDATE accounts SET is_admin = true WHERE email = $1 RETURNING id, email, is_admin`,
      [email]
    );

    const updatedUser = updateResult.rows[0];

    return NextResponse.json({
      success: true,
      message: "Successfully set first admin user",
      user: {
        email: updatedUser.email,
        isAdmin: updatedUser.is_admin,
      },
    });

  } catch (error) {
    console.error("Error setting first admin:", error);
    return NextResponse.json(
      { error: "Failed to set admin user" },
      { status: 500 }
    );
  }
}


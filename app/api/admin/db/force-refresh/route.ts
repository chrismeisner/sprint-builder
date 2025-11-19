import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// Force refresh database schema (bypasses the global cache)
export async function POST() {
  try {
    const pool = getPool();
    
    // Run the name column addition directly
    await pool.query(`
      ALTER TABLE accounts
      ADD COLUMN IF NOT EXISTS name text;
    `);
    
    // Verify it was added
    const result = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'accounts'
      ORDER BY ordinal_position
    `);
    
    return NextResponse.json({ 
      ok: true,
      message: "Schema refreshed",
      columns: result.rows 
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


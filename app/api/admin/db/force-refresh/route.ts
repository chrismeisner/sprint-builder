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
    
    // Create blocked_emails table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocked_emails (
        id text PRIMARY KEY,
        email text NOT NULL UNIQUE,
        reason text,
        blocked_by text REFERENCES accounts(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_blocked_emails_email ON blocked_emails(email);
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


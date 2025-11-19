import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPool();
    
    // Get schema information for the accounts table
    const accountsSchema = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'accounts'
      ORDER BY ordinal_position
    `);

    // Get all table names
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    // Get indexes on accounts table
    const indexes = await pool.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'accounts'
      ORDER BY indexname
    `);

    return NextResponse.json({
      ok: true,
      tables: tables.rows.map(r => r.table_name),
      accounts_schema: accountsSchema.rows,
      accounts_indexes: indexes.rows,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


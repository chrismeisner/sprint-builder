import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

/**
 * POST /api/admin/workshops/reset
 * Deletes all workshops and reseeds them with correct names
 */
export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    // Delete all workshops (this will cascade and remove sprint_package_deliverables entries)
    const deleteResult = await pool.query(
      `DELETE FROM deliverables WHERE deliverable_type = 'workshop' RETURNING id, name`
    );
    
    const deletedCount = deleteResult.rowCount || 0;
    console.log(`Deleted ${deletedCount} existing workshops`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} workshops. Run /api/admin/workshops/seed to create new ones.`,
      deleted: deletedCount,
    });
  } catch (error: unknown) {
    console.error("Error resetting workshops:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


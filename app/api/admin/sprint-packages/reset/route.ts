import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

/**
 * POST /api/admin/sprint-packages/reset
 * Deletes all sprint packages (and their deliverable links via CASCADE)
 */
export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    // Delete all sprint packages (CASCADE will delete sprint_package_deliverables)
    const deleteResult = await pool.query(
      `DELETE FROM sprint_packages RETURNING id, name, slug`
    );
    
    const deletedCount = deleteResult.rowCount || 0;
    console.log(`Deleted ${deletedCount} sprint packages`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} sprint packages. Run /api/admin/sprint-packages/seed to create new ones.`,
      deleted: deletedCount,
    });
  } catch (error: unknown) {
    console.error("Error resetting sprint packages:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


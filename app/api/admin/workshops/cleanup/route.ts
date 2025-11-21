import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/admin/workshops/cleanup
 * 
 * Completely removes workshop deliverables from the system:
 * 1. Removes workshops from all sprint packages (sprint_package_deliverables)
 * 2. Removes workshops from any sprint drafts (sprint_deliverables)
 * 3. Deletes workshop deliverables from deliverables table
 * 
 * This is a destructive operation - workshops will be permanently deleted.
 * Admin-only endpoint.
 */
export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();
    
    // Verify user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Step 1: Get list of workshop deliverable IDs
      const workshopIds = await pool.query(
        `SELECT id, name FROM deliverables WHERE deliverable_type = 'workshop'`
      );

      if (workshopIds.rows.length === 0) {
        await pool.query('COMMIT');
        return NextResponse.json({
          success: true,
          message: "No workshop deliverables found",
          removed: {
            fromPackages: 0,
            fromSprints: 0,
            deliverables: 0,
          },
        });
      }

      const workshopIdList = workshopIds.rows.map((row) => row.id);
      const workshopNames = workshopIds.rows.map((row) => row.name);

      // Step 2: Remove workshops from sprint packages
      const packagesResult = await pool.query(
        `DELETE FROM sprint_package_deliverables 
         WHERE deliverable_id = ANY($1::text[])
         RETURNING id`,
        [workshopIdList]
      );

      // Step 3: Remove workshops from sprint drafts
      const sprintsResult = await pool.query(
        `DELETE FROM sprint_deliverables 
         WHERE deliverable_id = ANY($1::text[])
         RETURNING id`,
        [workshopIdList]
      );

      // Step 4: Delete workshop deliverables
      const deliverablesResult = await pool.query(
        `DELETE FROM deliverables 
         WHERE deliverable_type = 'workshop'
         RETURNING id, name`,
        []
      );

      // Commit transaction
      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Successfully removed ${deliverablesResult.rows.length} workshop deliverables from the system`,
        removed: {
          fromPackages: packagesResult.rows.length,
          fromSprints: sprintsResult.rows.length,
          deliverables: deliverablesResult.rows.length,
        },
        deletedWorkshops: workshopNames,
      });

    } catch (error) {
      // Rollback on error
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error: unknown) {
    console.error("Error cleaning up workshops:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/workshops/cleanup
 * 
 * Preview what will be deleted (dry run)
 */
export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    
    // Verify user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get workshop deliverables
    const workshops = await pool.query(
      `SELECT id, name, category, fixed_hours, fixed_price FROM deliverables WHERE deliverable_type = 'workshop'`
    );

    if (workshops.rows.length === 0) {
      return NextResponse.json({
        message: "No workshop deliverables found",
        workshops: [],
        affectedPackages: 0,
        affectedSprints: 0,
      });
    }

    const workshopIds = workshops.rows.map((row) => row.id);

    // Count affected packages
    const packagesCount = await pool.query(
      `SELECT COUNT(*) as count FROM sprint_package_deliverables WHERE deliverable_id = ANY($1::text[])`,
      [workshopIds]
    );

    // Count affected sprints
    const sprintsCount = await pool.query(
      `SELECT COUNT(*) as count FROM sprint_deliverables WHERE deliverable_id = ANY($1::text[])`,
      [workshopIds]
    );

    // Get package names
    const affectedPackages = await pool.query(
      `SELECT DISTINCT sp.name 
       FROM sprint_packages sp
       JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
       WHERE spd.deliverable_id = ANY($1::text[])`,
      [workshopIds]
    );

    return NextResponse.json({
      message: "Preview of workshops to be deleted",
      workshops: workshops.rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        hours: row.fixed_hours,
        price: row.fixed_price,
      })),
      affectedPackages: Number(packagesCount.rows[0].count),
      affectedSprints: Number(sprintsCount.rows[0].count),
      packageNames: affectedPackages.rows.map((row) => row.name),
    });

  } catch (error: unknown) {
    console.error("Error previewing workshop cleanup:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


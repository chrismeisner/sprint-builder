import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ensureSchema, getPool } from "@/lib/db";
import SprintDraftsClient from "./SprintDraftsClient";

export const dynamic = "force-dynamic";

export default async function SprintDraftsAdminPage() {
  const user = await getCurrentUser();
  
  if (!user?.isAdmin) {
    redirect("/");
  }

  await ensureSchema();
  const pool = getPool();

  // Fetch all sprint drafts with owner info and source
  const result = await pool.query(`
    SELECT 
      sd.id,
      sd.status,
      sd.title,
      sd.deliverable_count,
      sd.total_fixed_price,
      sd.total_fixed_hours,
      sd.total_estimate_points,
      sd.sprint_package_id,
      sd.workshop_generated_at,
      sd.created_at,
      sd.updated_at,
      d.email,
      a.name as account_name,
      a.id as account_id,
      sp.name as package_name
    FROM sprint_drafts sd
    LEFT JOIN documents d ON sd.document_id = d.id
    LEFT JOIN accounts a ON d.account_id = a.id
    LEFT JOIN sprint_packages sp ON sd.sprint_package_id = sp.id
    ORDER BY sd.created_at DESC
  `);

  const sprintDrafts = result.rows.map((row) => ({
    id: row.id,
    status: row.status || "draft",
    title: row.title,
    deliverableCount: Number(row.deliverable_count || 0),
    totalPrice: row.total_fixed_price ? Number(row.total_fixed_price) : null,
    totalHours: row.total_fixed_hours ? Number(row.total_fixed_hours) : null,
    totalPoints: Number(row.total_estimate_points || 0),
    sprintPackageId: row.sprint_package_id,
    packageName: row.package_name,
    workshopGenerated: !!row.workshop_generated_at,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    email: row.email,
    accountName: row.account_name,
    accountId: row.account_id,
  }));

  return (
    <main className="min-h-screen max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sprint Drafts</h1>
        <p className="text-sm opacity-70">
          Manage all sprint drafts in the system. View source, status, and owner information.
        </p>
      </div>

      <SprintDraftsClient sprintDrafts={sprintDrafts} />
    </main>
  );
}


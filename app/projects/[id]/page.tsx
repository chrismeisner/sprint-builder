import { notFound } from "next/navigation";
import Link from "next/link";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import dynamicImport from "next/dynamic";
import Typography from "@/components/ui/Typography";

const AddSprintFromPackage = dynamicImport(() => import("../AddSprintFromPackage"), { ssr: false });
const DeleteSprintButton = dynamicImport(() => import("../DeleteSprintButton"), { ssr: false });
const ProjectDocuments = dynamicImport(() => import("../ProjectDocuments"), { ssr: false });

type PageProps = { params: { id: string } };

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();

  const user = await getCurrentUser();
  if (!user) {
    notFound();
  }

  const projectResult = await pool.query(
    `SELECT id, name, account_id, created_at, updated_at
     FROM projects
     WHERE id = $1`,
    [params.id]
  );

  if (projectResult.rowCount === 0) {
    notFound();
  }

  const project = projectResult.rows[0] as {
    id: string;
    name: string;
    account_id: string | null;
    created_at: string | Date;
    updated_at: string | Date;
  };

  if (project.account_id !== user.accountId) {
    notFound();
  }

  const sprintsResult = await pool.query(
    `SELECT id, title, status, total_estimate_points, total_fixed_hours, total_fixed_price, created_at
     FROM sprint_drafts
     WHERE project_id = $1
     ORDER BY created_at DESC`,
    [project.id]
  );

  const sprints = sprintsResult.rows as Array<{
    id: string;
    title: string | null;
    status: string | null;
    total_estimate_points: number | null;
    total_fixed_hours: number | null;
    total_fixed_price: number | null;
    created_at: string | Date;
  }>;

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-6 font-inter">
      <div className="flex items-center justify-between">
        <div>
          <Typography as="p" scale="mono-sm" className="opacity-70">
            Project
          </Typography>
          <Typography as="h1" scale="h2" className="mt-1">
            {project.name}
          </Typography>
          <Typography as="p" scale="body-sm" className="opacity-70 mt-1">
            Created {new Date(project.created_at).toLocaleDateString()}
            {project.updated_at && ` • Updated ${new Date(project.updated_at).toLocaleDateString()}`}
          </Typography>
        </div>
        <div className="flex gap-2">
          <Link
            href="/profile"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Back to profile
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Typography as="h2" scale="h3">
              Sprints in this project
            </Typography>
            <Typography as="span" scale="body-sm" className="opacity-60">
              {sprints.length} total
            </Typography>
          </div>
          <AddSprintFromPackage projectId={project.id} projectName={project.name} />
        </div>

        {sprints.length === 0 ? (
          <Typography as="div" scale="body-sm" className="opacity-70">
            No sprints yet. Create one from the profile page.
          </Typography>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/15">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Title</th>
                  <th className="text-left px-4 py-2 font-semibold">Status</th>
                  <th className="text-right px-4 py-2 font-semibold">Points</th>
                  <th className="text-right px-4 py-2 font-semibold">Hours</th>
                  <th className="text-right px-4 py-2 font-semibold">Price</th>
                  <th className="text-right px-4 py-2 font-semibold">Created</th>
                  <th className="text-right px-4 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/15">
                {sprints.map((s) => (
                  <tr key={s.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <td className="px-4 py-2">
                      <Link href={`/sprints/${s.id}`} className="font-medium hover:underline">
                        {s.title || "Untitled sprint"}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center rounded-full bg-black/10 dark:bg-white/10 px-2 py-0.5 text-xs">
                        {s.status || "draft"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">{s.total_estimate_points ?? 0}</td>
                    <td className="px-4 py-2 text-right">
                      {s.total_fixed_hours != null ? `${Number(s.total_fixed_hours).toFixed(1)}h` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {s.total_fixed_price != null ? `$${Number(s.total_fixed_price).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <DeleteSprintButton sprintId={s.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Documents */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-4">
        <ProjectDocuments projectId={project.id} />
      </section>
    </main>
  );
}

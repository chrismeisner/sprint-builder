import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import dynamicImport from "next/dynamic";
import Typography from "@/components/ui/Typography";

const DeleteSprintButton = dynamicImport(() => import("../DeleteSprintButton"), { ssr: false });
const ProjectDocuments = dynamicImport(() => import("../ProjectDocuments"), { ssr: false });
const ProjectDemos = dynamicImport(() => import("../ProjectDemos"), { ssr: false });
const AddAppLinkButton = dynamicImport(() => import("../AddAppLinkButton"), { ssr: false });
const EditAppLinkButton = dynamicImport(() => import("../EditAppLinkButton"), { ssr: false });
const MemberCard = dynamicImport(() => import("../MemberCard"), { ssr: false });

type PageProps = { params: { id: string } };

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/projects/${params.id}`)}`);
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

  // Allow owners, admins, or explicit project members to view.
  const isOwner = project.account_id === user.accountId;
  const isAdmin = Boolean(user.isAdmin);
  const membershipRes = await pool.query(
    `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
    [project.id, user.email]
  );
  const isMember = (membershipRes?.rowCount ?? 0) > 0;

  if (!isOwner && !isAdmin && !isMember) {
    notFound();
  }

  const sprintsResult = await pool.query(
    `SELECT id, title, status, total_estimate_points, total_fixed_hours, total_fixed_price, deliverable_count, created_at
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
    deliverable_count: number | null;
    created_at: string | Date;
  }>;

  // Fetch app links for this project
  const appLinksResult = await pool.query(
    `SELECT id, name, folder_name, url, link_type, description, is_public, created_at
     FROM sandboxes
     WHERE project_id = $1
     ORDER BY created_at DESC`,
    [project.id]
  );

  const appLinks = appLinksResult.rows as Array<{
    id: string;
    name: string;
    folder_name: string | null;
    url: string | null;
    link_type: "folder" | "url";
    description: string | null;
    is_public: boolean;
    created_at: string | Date;
  }>;

  // Fetch members with account data
  const membersResult = await pool.query(
    `SELECT 
      pm.email,
      pm.title,
      pm.created_at,
      a.name,
      a.first_name,
      a.last_name
    FROM project_members pm
    LEFT JOIN accounts a ON lower(pm.email) = lower(a.email)
    WHERE pm.project_id = $1
    ORDER BY pm.created_at ASC`,
    [project.id]
  );

  const members = membersResult.rows as Array<{
    email: string;
    title: string | null;
    created_at: string | Date;
    name: string | null;
    first_name: string | null;
    last_name: string | null;
  }>;

  // Calculate last activity date from all related entities
  const activityDates: Date[] = [new Date(project.updated_at)];
  
  // Add sprint dates
  for (const sprint of sprints) {
    activityDates.push(new Date(sprint.created_at));
  }
  
  // Add member dates
  for (const member of members) {
    activityDates.push(new Date(member.created_at));
  }
  
  // Add app link dates
  for (const appLink of appLinks) {
    activityDates.push(new Date(appLink.created_at));
  }
  
  // Get the most recent date
  const lastActivityDate = activityDates.reduce((latest, date) => 
    date > latest ? date : latest
  , activityDates[0]);

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
            {` • Last activity ${lastActivityDate.toLocaleDateString()}`}
          </Typography>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projects/${project.id}/settings`}
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Settings
          </Link>
          <Link
            href="/my-dashboard"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      {/* Sprints */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Typography as="h2" scale="h3">
              Sprints
            </Typography>
            <Typography as="span" scale="body-sm" className="opacity-60">
              {sprints.length} total
            </Typography>
          </div>
          {isAdmin && (
            <Link
              href={`/dashboard/sprint-builder?projectId=${project.id}`}
              className="inline-flex items-center rounded-md bg-black text-white px-3 py-1.5 text-sm hover:bg-black/80 transition"
            >
              New sprint
            </Link>
          )}
        </div>

        {sprints.length === 0 ? (
          <Typography as="div" scale="body-sm" className="opacity-70">
            No sprints yet.{isAdmin && " Click New sprint to create one."}
          </Typography>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/15">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Title</th>
                  <th className="text-left px-4 py-2 font-semibold">Status</th>
                  <th className="text-right px-4 py-2 font-semibold">Deliverables</th>
                  <th className="text-right px-4 py-2 font-semibold">Price</th>
                  <th className="text-right px-4 py-2 font-semibold">Created</th>
                  {isAdmin && <th className="text-right px-4 py-2 font-semibold">Actions</th>}
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
                    <td className="px-4 py-2 text-right">
                      {s.deliverable_count != null ? s.deliverable_count : 0}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {s.total_fixed_price != null ? `$${Number(s.total_fixed_price).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2 text-right">
                        <DeleteSprintButton sprintId={s.id} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Apps */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Typography as="h2" scale="h3">
              Apps
            </Typography>
            <Typography as="span" scale="body-sm" className="opacity-60">
              {appLinks.length} total
            </Typography>
          </div>
          {isAdmin && (
            <AddAppLinkButton projectId={project.id} />
          )}
        </div>

        {appLinks.length === 0 ? (
          <Typography as="div" scale="body-sm" className="opacity-70">
            None
          </Typography>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/15">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Name</th>
                  <th className="text-left px-4 py-2 font-semibold">Type</th>
                  <th className="text-left px-4 py-2 font-semibold">Description</th>
                  <th className="text-left px-4 py-2 font-semibold">Visibility</th>
                  <th className="text-right px-4 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/15">
                {appLinks.map((appLink) => {
                  const linkUrl = appLink.link_type === "url" 
                    ? appLink.url 
                    : `/api/sandbox-files/${appLink.folder_name}/index.html`;
                  
                  return (
                    <tr key={appLink.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                      <td className="px-4 py-2">
                        <a
                          href={linkUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                        >
                          {appLink.name}
                        </a>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          appLink.link_type === "url"
                            ? "bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400"
                            : "bg-black/10 dark:bg-white/10"
                        }`}>
                          {appLink.link_type === "url" ? "URL" : "Folder"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="opacity-70">{appLink.description || "—"}</span>
                      </td>
                      <td className="px-4 py-2">
                        {appLink.is_public ? (
                          <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 text-xs">
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-black/10 dark:bg-white/10 px-2 py-0.5 text-xs">
                            Private
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {isAdmin && (
                            <EditAppLinkButton appLink={appLink} />
                          )}
                          <a
                            href={linkUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline inline-flex items-center gap-1"
                          >
                            View ↗
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Demos (admin only) */}
      {isAdmin && (
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-4">
          <ProjectDemos projectId={project.id} projectName={project.name} />
        </section>
      )}

      {/* Documents (hidden for non-admins) */}
      {isAdmin && (
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-4">
          <ProjectDocuments projectId={project.id} />
        </section>
      )}

      {/* Members */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-3">
        <div className="flex items-center gap-3">
          <Typography as="h2" scale="h3">
            Members
          </Typography>
          <Typography as="span" scale="body-sm" className="opacity-60">
            {members.length} total
          </Typography>
        </div>

        {members.length === 0 ? (
          <Typography as="div" scale="body-sm" className="opacity-70">
            No members yet. Add members in project settings.
          </Typography>
        ) : (
          <div className="flex flex-wrap gap-4">
            {members.map((member) => (
              <MemberCard key={member.email} member={member} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

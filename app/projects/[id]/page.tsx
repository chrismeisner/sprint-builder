import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import dynamicImport from "next/dynamic";
import Typography from "@/components/ui/Typography";

const DeleteSprintButton = dynamicImport(() => import("../DeleteSprintButton"), { ssr: false });
const AdminSprintStatusDropdown = dynamicImport(() => import("@/app/components/AdminSprintStatusDropdown"), { ssr: false });
const SprintShareLink = dynamicImport(() => import("../SprintShareLink"), { ssr: false });
const ProjectDocuments = dynamicImport(() => import("../ProjectDocuments"), { ssr: false });
const ProjectDemos = dynamicImport(() => import("../ProjectDemos"), { ssr: false });
const ProjectTasks = dynamicImport(() => import("../ProjectTasks"), { ssr: false });
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
    `SELECT id, title, status, total_estimate_points, total_fixed_hours, total_fixed_price, deliverable_count, created_at, share_token, type, parent_sprint_id
     FROM sprint_drafts
     WHERE project_id = $1
     ORDER BY created_at DESC`,
    [project.id]
  );

  type SprintRow = {
    id: string;
    title: string | null;
    status: string | null;
    total_estimate_points: number | null;
    total_fixed_hours: number | null;
    total_fixed_price: number | null;
    deliverable_count: number | null;
    created_at: string | Date;
    share_token: string | null;
    type: string | null;
    parent_sprint_id: string | null;
  };

  const draftSprints = sprintsResult.rows as Array<SprintRow>;

  const smokeSprintsResult = await pool.query(
    `SELECT id, status, title, whats_next, total_price, implied_hours, created_at
     FROM smoke_test_sprints
     WHERE project_id = $1
     ORDER BY created_at DESC`,
    [project.id]
  );

  const smokeSprints: Array<SprintRow> = smokeSprintsResult.rows.map((row) => ({
    id: row.id as string,
    title:
      (row.title as string | null) ??
      (row.whats_next as string | null) ??
      null,
    status: (row.status as string | null) ?? "draft",
    total_estimate_points: null,
    total_fixed_hours: row.implied_hours != null ? Number(row.implied_hours) : null,
    total_fixed_price: row.total_price != null ? Number(row.total_price) : null,
    deliverable_count: null,
    created_at: row.created_at as string | Date,
    share_token: null,
    type: "smoke_test",
    parent_sprint_id: null,
  }));

  const sprints: Array<SprintRow> = [...draftSprints, ...smokeSprints].sort((a, b) => {
    const aTs = a.created_at instanceof Date ? a.created_at.getTime() : new Date(a.created_at).getTime();
    const bTs = b.created_at instanceof Date ? b.created_at.getTime() : new Date(b.created_at).getTime();
    return bTs - aTs;
  });

  const hasAnySprints = sprints.some((s) => (s.type ?? "sprint") === "sprint");

  const refinementCyclesResult = await pool.query(
    `SELECT id, title, status, submitter_email, total_price, delivery_date,
            submitted_at, accepted_at, declined_at, deposit_paid_at,
            delivered_at, expired_at,
            (SELECT COUNT(*)::int FROM refinement_cycle_screens
             WHERE refinement_cycle_id = refinement_cycles.id) AS screen_count
     FROM refinement_cycles
     WHERE project_id = $1
     ORDER BY submitted_at DESC`,
    [project.id]
  );
  const refinementCycles = refinementCyclesResult.rows as Array<{
    id: string;
    title: string | null;
    status: string;
    submitter_email: string | null;
    total_price: string | number | null;
    delivery_date: string | Date | null;
    submitted_at: string | Date;
    accepted_at: string | Date | null;
    declined_at: string | Date | null;
    deposit_paid_at: string | Date | null;
    delivered_at: string | Date | null;
    expired_at: string | Date | null;
    screen_count: number;
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
      pm.role,
      pm.created_at,
      a.name,
      a.first_name,
      a.last_name,
      COALESCE(a.is_admin, false) AS is_admin,
      a.profile_image_url
    FROM project_members pm
    LEFT JOIN accounts a ON lower(pm.email) = lower(a.email)
    WHERE pm.project_id = $1
    ORDER BY
      CASE WHEN COALESCE(a.is_admin, false) = true THEN 0 ELSE 1 END,
      pm.created_at ASC`,
    [project.id]
  );

  const members = membersResult.rows as Array<{
    email: string;
    title: string | null;
    role: string;
    is_admin: boolean;
    created_at: string | Date;
    name: string | null;
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
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
    <main className="min-h-screen max-w-6xl mx-auto p-6 space-y-6 font-inter">
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
          {isAdmin && (
            <Link
              href={`/projects/${project.id}/settings`}
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Settings
            </Link>
          )}
          <Link
            href="/projects"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Back to projects
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
            <div className="flex gap-2">
              <Link
                href={`/dashboard/sprint-builder?projectId=${project.id}`}
                className="inline-flex items-center rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity duration-150"
              >
                New sprint
              </Link>
              {hasAnySprints && (
                <Link
                  href={`/dashboard/update-cycle-builder?projectId=${project.id}`}
                  className="inline-flex items-center rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
                >
                  New update cycle
                </Link>
              )}
              <Link
                href={`/dashboard/smoke-test-sprint-builder?projectId=${project.id}`}
                className="inline-flex items-center rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
              >
                New smoke test sprint
              </Link>
            </div>
          )}
        </div>

        {sprints.length === 0 ? (
          <Typography as="div" scale="body-sm" className="opacity-70">
            No sprints yet.{isAdmin && " Click New sprint to create one."}
          </Typography>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Title</th>
                  <th className="text-left px-4 py-2 font-semibold w-28">Type</th>
                  <th className="text-left px-4 py-2 font-semibold w-32">Status</th>
                  <th className="text-left px-4 py-2 font-semibold w-32">Price</th>
                  <th className="text-left px-4 py-2 font-semibold w-32">Created</th>
                  <th className="text-left px-4 py-2 font-semibold">Actions</th>
                  {isAdmin && <th className="text-left px-4 py-2 font-semibold w-24">Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {sprints.map((s) => {
                  const sprintType = s.type ?? "sprint";
                  const isUpdateCycle = sprintType === "update_cycle";
                  const isSmokeTest = sprintType === "smoke_test";
                  const titleFallback = isUpdateCycle
                    ? "Untitled update cycle"
                    : isSmokeTest
                    ? "Untitled smoke test sprint"
                    : "Untitled sprint";
                  return (
                    <tr key={`${sprintType}-${s.id}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150">
                      <td className="px-4 py-2">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {s.title || titleFallback}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {isUpdateCycle ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-2 py-0.5 text-xs font-medium">
                            Update
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                            Sprint
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isAdmin && !isSmokeTest ? (
                          <AdminSprintStatusDropdown
                            sprintId={s.id}
                            currentStatus={s.status || "draft"}
                            compact
                          />
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs">
                            {s.status || "draft"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 tabular-nums text-neutral-600 dark:text-neutral-400">
                        {s.total_fixed_price != null ? `$${Number(s.total_fixed_price).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        {isSmokeTest ? (
                          <Link
                            href={`/dashboard/smoke-test-sprint-builder?draftId=${s.id}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Open
                          </Link>
                        ) : (
                          <SprintShareLink sprintId={s.id} shareToken={s.share_token} status={s.status} isAdmin={isAdmin} />
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-2">
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                            {!isSmokeTest && <DeleteSprintButton sprintId={s.id} />}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Refinement Cycles */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Typography as="h2" scale="h3">
              Refinement Cycles
            </Typography>
            <Typography as="span" scale="body-sm" className="opacity-60">
              {refinementCycles.length} total
            </Typography>
          </div>
          <Link
            href={`/dashboard/refinement-cycles/new?projectId=${project.id}`}
            className="inline-flex items-center rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity duration-150 self-start md:self-auto"
          >
            New refinement cycle
          </Link>
        </div>
        {refinementCycles.length === 0 ? (
          <Typography as="div" scale="body-sm" className="opacity-70">
            No refinement cycles yet. Submit one for fast, fixed-price design
            refinement work — $1,200 per cycle, next-business-day delivery.
          </Typography>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Title</th>
                  <th className="text-left px-4 py-2 font-semibold">Status</th>
                  <th className="text-left px-4 py-2 font-semibold">Submitter</th>
                  <th className="text-left px-4 py-2 font-semibold">Scope</th>
                  <th className="text-left px-4 py-2 font-semibold w-32">Submitted</th>
                  <th className="text-left px-4 py-2 font-semibold w-32">Delivery</th>
                  <th className="text-left px-4 py-2 font-semibold w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {refinementCycles.map((rc) => {
                  const submittedAt =
                    rc.submitted_at instanceof Date
                      ? rc.submitted_at
                      : new Date(rc.submitted_at);
                  const deliveryDate = rc.delivery_date
                    ? rc.delivery_date instanceof Date
                      ? rc.delivery_date.toISOString().slice(0, 10)
                      : (rc.delivery_date as string)
                    : null;
                  const statusLabel: Record<string, string> = {
                    submitted: "Submitted",
                    accepted: "Accepted",
                    awaiting_deposit: "Awaiting deposit",
                    in_progress: "In progress",
                    delivered: "Delivered",
                    declined: "Declined",
                    expired: "Expired",
                  };
                  return (
                    <tr
                      key={rc.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
                    >
                      <td className="px-4 py-2 font-medium text-neutral-900 dark:text-neutral-100">
                        {rc.title || "Untitled"}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                          {statusLabel[rc.status] ?? rc.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 opacity-80">
                        {rc.submitter_email ?? "—"}
                      </td>
                      <td className="px-4 py-2 opacity-70">
                        {rc.screen_count} screen
                        {rc.screen_count === 1 ? "" : "s"}
                      </td>
                      <td className="px-4 py-2 opacity-70">
                        {submittedAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-2 opacity-70">
                        {deliveryDate
                          ? new Date(`${deliveryDate}T12:00:00Z`).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", timeZone: "UTC" }
                            )
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/dashboard/refinement-cycles/${rc.id}`}
                          className="text-neutral-700 dark:text-neutral-300 underline hover:opacity-80"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
              <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Name</th>
                  <th className="text-left px-4 py-2 font-semibold w-32">Visibility</th>
                  <th className="text-left px-4 py-2 font-semibold w-24"></th>
                  <th className="text-left px-4 py-2 font-semibold w-32"></th>
                  <th className="text-left px-4 py-2 font-semibold w-32"></th>
                  <th className="text-left px-4 py-2 font-semibold">Actions</th>
                  {isAdmin && <th className="text-left px-4 py-2 font-semibold w-24"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {appLinks.map((appLink) => {
                  const linkUrl = appLink.link_type === "url" 
                    ? appLink.url 
                    : `/api/sandbox-files/${appLink.folder_name}/index.html`;
                  
                  return (
                    <tr key={appLink.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150">
                      <td className="px-4 py-2">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {appLink.name}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {appLink.is_public ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-2 py-0.5 text-xs">
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs">
                            Private
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <EditAppLinkButton appLink={appLink} />
                          )}
                          <a
                            href={linkUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-1 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-150"
                          >
                            View
                          </a>
                        </div>
                      </td>
                      {isAdmin && <td className="px-4 py-2"></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Figma brand / Design system hub */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Typography as="h2" scale="h3">
              Figma brand
            </Typography>
            <Typography as="span" scale="body-sm" className="opacity-60">
              Design system hub
            </Typography>
          </div>
          <Link
            href={`/projects/${project.id}/hub`}
            className="inline-flex items-center gap-1.5 rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Open hub
            <span aria-hidden>→</span>
          </Link>
        </div>
        <Typography as="p" scale="body-sm" className="opacity-70">
          Link your Figma source of truth, sync on demand, and view the project’s design tokens and component reference.
        </Typography>
      </section>

      {/* Tasks (admin only) */}
      {isAdmin && (
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-4">
          <ProjectTasks projectId={project.id} />
        </section>
      )}

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

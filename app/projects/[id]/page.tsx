import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import dynamicImport from "next/dynamic";
import Typography from "@/components/ui/Typography";

const ProjectDocuments = dynamicImport(() => import("../ProjectDocuments"), { ssr: false });
const ProjectDemos = dynamicImport(() => import("../ProjectDemos"), { ssr: false });
const ProjectTasks = dynamicImport(() => import("../ProjectTasks"), { ssr: false });
const AddAppLinkButton = dynamicImport(() => import("../AddAppLinkButton"), { ssr: false });
const EditAppLinkButton = dynamicImport(() => import("../EditAppLinkButton"), { ssr: false });
const MemberCard = dynamicImport(() => import("../MemberCard"), { ssr: false });
const CopyEmailButton = dynamicImport(() => import("../CopyEmailButton"), { ssr: false });

type PageProps = {
  params: { id: string };
  searchParams?: { view?: string; archived?: string };
};

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: PageProps) {
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

  // Admin "view as client" toggle — preserves access (admins can always see
  // the page) but hides admin-only UI when active. The toggle itself is only
  // rendered for real admins, regardless of the current effective view.
  const viewingAsClient = isAdmin && searchParams?.view === "client";
  const effectiveIsAdmin = isAdmin && !viewingAsClient;

  if (!isOwner && !isAdmin && !isMember) {
    notFound();
  }

  // Client engagements now live as HILLS (type sprint | refinement_cycle):
  // pricing on hill_deliverables, billing on hill_invoices. (Replaces the
  // legacy sprint_drafts + refinement_cycles reads.)
  const clientHillsResult = await pool.query(
    `SELECT h.id, h.title, h.type, h.status, h.phase, h.completed, h.created_at,
            (h.type_data->>'agreement_markdown') IS NOT NULL AS has_agreement,
            COALESCE((SELECT SUM(price * COALESCE(quantity, 1))
                        FROM hill_deliverables
                       WHERE hill_id = h.id AND dismissed_at IS NULL), 0) AS total,
            (SELECT COUNT(*)::int FROM hill_deliverables
              WHERE hill_id = h.id AND dismissed_at IS NULL) AS deliverable_count
       FROM hills h
      WHERE h.project_id = $1 AND h.type IN ('sprint', 'refinement_cycle')
      ORDER BY h.created_at DESC`,
    [project.id]
  );
  type ClientHill = {
    id: string;
    title: string | null;
    type: string;
    status: string | null;
    phase: string | null;
    completed: boolean;
    created_at: string | Date;
    has_agreement: boolean;
    total: string | number | null;
    deliverable_count: number;
  };
  const clientHills = clientHillsResult.rows as ClientHill[];

  type ClientInvoice = {
    id: string;
    label: string;
    amount: string | number | null;
    invoice_status: string;
    invoice_url: string | null;
  };
  const invoicesByHill = new Map<string, ClientInvoice[]>();
  const clientHillIds = clientHills.map((h) => h.id);
  if (clientHillIds.length > 0) {
    const invRes = await pool.query(
      `SELECT id, hill_id, label, amount, invoice_status, invoice_url
         FROM hill_invoices
        WHERE hill_id = ANY($1) AND invoice_status <> 'voided'
        ORDER BY sort_order, created_at`,
      [clientHillIds]
    );
    for (const row of invRes.rows) {
      const list = invoicesByHill.get(row.hill_id as string) ?? [];
      list.push(row as ClientInvoice);
      invoicesByHill.set(row.hill_id as string, list);
    }
  }

  // Smoke test sprints — a separate lightweight scoping artifact (its own table,
  // not part of the legacy sprint/refinement pipeline). Retained as-is.
  const smokeSprintsResult = await pool.query(
    `SELECT id, status, title, whats_next, total_price, created_at
     FROM smoke_test_sprints
     WHERE project_id = $1
     ORDER BY created_at DESC`,
    [project.id]
  );
  type SmokeRow = {
    id: string;
    title: string | null;
    status: string | null;
    total_price: number | null;
    created_at: string | Date;
  };
  const smokeSprints: SmokeRow[] = smokeSprintsResult.rows.map((row) => ({
    id: row.id as string,
    title: (row.title as string | null) ?? (row.whats_next as string | null) ?? null,
    status: (row.status as string | null) ?? "draft",
    total_price: row.total_price != null ? Number(row.total_price) : null,
    created_at: row.created_at as string | Date,
  }));

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
  
  // Add engagement + smoke-test dates
  for (const hill of clientHills) {
    activityDates.push(new Date(hill.created_at));
  }
  for (const smoke of smokeSprints) {
    activityDates.push(new Date(smoke.created_at));
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
      {isAdmin && (
        <div className="flex items-center justify-between rounded-md border border-black/10 dark:border-white/15 bg-neutral-50 dark:bg-neutral-900 px-3 py-2">
          <Typography as="span" scale="body-sm" className="opacity-70">
            Admin view
          </Typography>
          <div className="inline-flex rounded-md border border-black/10 dark:border-white/15 p-0.5">
            <Link
              href={`/projects/${project.id}`}
              scroll={false}
              className={`rounded px-3 py-1 text-sm transition ${
                viewingAsClient
                  ? "opacity-60 hover:opacity-100"
                  : "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              }`}
            >
              Admin
            </Link>
            <Link
              href={`/projects/${project.id}?view=client`}
              scroll={false}
              className={`rounded px-3 py-1 text-sm transition ${
                viewingAsClient
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              Client
            </Link>
          </div>
        </div>
      )}

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
          {effectiveIsAdmin && (
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

      {/* Get in touch */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-3">
        <div className="space-y-1">
          <Typography as="h2" scale="h3">
            Get in touch
          </Typography>
          <Typography as="p" scale="body-sm" className="opacity-70">
            Want to talk through anything — direction, scope, ideas, or just
            say hi? Book a jam session, or email me at chris@chrismeisner.com.
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://cal.com/chrismeisner/jam-session"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity duration-150"
          >
            Book a jam session
          </a>
          <CopyEmailButton email="chris@chrismeisner.com" />
        </div>
      </section>

      {/* Engagements — client work as hills (sprints + refinement cycles) */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Typography as="h2" scale="h3">
              Engagements
            </Typography>
            <Typography as="span" scale="body-sm" className="opacity-60">
              {clientHills.length} total
            </Typography>
          </div>
          {effectiveIsAdmin && (
            <Link
              href="/dashboard/hills"
              className="inline-flex items-center rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity duration-150 self-start md:self-auto"
            >
              Manage in Hills
            </Link>
          )}
        </div>
        {clientHills.length === 0 ? (
          <Typography as="div" scale="body-sm" className="opacity-70">
            No engagements yet.{effectiveIsAdmin && " Scope one from the Hills dashboard."}
          </Typography>
        ) : (
          <div className="flex flex-col gap-3">
            {clientHills.map((h) => {
              const invoices = invoicesByHill.get(h.id) ?? [];
              const typeLabel = h.type === "refinement_cycle" ? "Refinement" : "Sprint";
              const phaseLabel: Record<string, string> = {
                scope: "Scoping",
                climb: "In progress",
                descend: "Wrapping up",
              };
              const stateLabel = h.completed
                ? "Complete"
                : h.phase
                ? phaseLabel[h.phase] ?? h.phase
                : h.status ?? "—";
              return (
                <div
                  key={h.id}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {h.title || "Untitled engagement"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      {typeLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                      {stateLabel}
                    </span>
                    {Number(h.total) > 0 && (
                      <span className="ml-auto tabular-nums text-sm text-neutral-700 dark:text-neutral-300">
                        ${Number(h.total).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs opacity-70">
                    {h.deliverable_count} deliverable{h.deliverable_count === 1 ? "" : "s"}
                    {h.has_agreement && (
                      <>
                        {" · "}
                        <span className="opacity-80">agreement ready</span>
                      </>
                    )}
                  </div>

                  {invoices.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {invoices.map((inv) => {
                        const isPaid = inv.invoice_status === "paid";
                        const payable =
                          !isPaid &&
                          Boolean(inv.invoice_url) &&
                          ["sent", "processing", "failed"].includes(inv.invoice_status);
                        return (
                          <div key={inv.id} className="flex items-center gap-2 text-sm">
                            <span className="flex-1 truncate text-neutral-700 dark:text-neutral-300">
                              {inv.label}
                            </span>
                            <span className="tabular-nums text-neutral-600 dark:text-neutral-400">
                              ${Number(inv.amount ?? 0).toLocaleString()}
                            </span>
                            {isPaid ? (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                Paid ✓
                              </span>
                            ) : payable ? (
                              <a
                                href={inv.invoice_url as string}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-2.5 py-1 text-xs font-medium hover:opacity-90"
                              >
                                {inv.invoice_status === "processing" ? "Processing…" : "Pay invoice"}
                              </a>
                            ) : (
                              <span className="text-xs opacity-60">{inv.invoice_status}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {effectiveIsAdmin && (
                    <div className="mt-2">
                      <Link
                        href={`/dashboard/hills/${h.id}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Manage →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Smoke test sprints — a separate lightweight scoping artifact */}
      {(smokeSprints.length > 0 || effectiveIsAdmin) && (
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Typography as="h2" scale="h3">
                Smoke test sprints
              </Typography>
              <Typography as="span" scale="body-sm" className="opacity-60">
                {smokeSprints.length} total
              </Typography>
            </div>
            {effectiveIsAdmin && (
              <Link
                href={`/dashboard/smoke-test-sprint-builder?projectId=${project.id}`}
                className="inline-flex items-center rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150 self-start md:self-auto"
              >
                New smoke test sprint
              </Link>
            )}
          </div>
          {smokeSprints.length === 0 ? (
            <Typography as="div" scale="body-sm" className="opacity-70">
              None yet.
            </Typography>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Title</th>
                    <th className="text-left px-4 py-2 font-semibold w-32">Status</th>
                    <th className="text-left px-4 py-2 font-semibold w-32">Price</th>
                    <th className="text-left px-4 py-2 font-semibold w-32">Created</th>
                    <th className="text-left px-4 py-2 font-semibold w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {smokeSprints.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-150"
                    >
                      <td className="px-4 py-2 font-medium text-neutral-900 dark:text-neutral-100">
                        {s.title || "Untitled smoke test sprint"}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs">
                          {s.status || "draft"}
                        </span>
                      </td>
                      <td className="px-4 py-2 tabular-nums text-neutral-600 dark:text-neutral-400">
                        {s.total_price != null ? `$${Number(s.total_price).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        {effectiveIsAdmin && (
                          <Link
                            href={`/dashboard/smoke-test-sprint-builder?draftId=${s.id}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Open
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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
          {effectiveIsAdmin && (
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
                  {effectiveIsAdmin && <th className="text-left px-4 py-2 font-semibold w-24"></th>}
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
                          {effectiveIsAdmin && (
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
                      {effectiveIsAdmin && <td className="px-4 py-2"></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Figma brand / Design system hub — temporarily hidden. Wrap in
          `{true && (...)}` (or just remove the `false &&`) to bring it back. */}
      {false && (
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
      )}

      {/* Tasks (admin only) */}
      {effectiveIsAdmin && (
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-4">
          <ProjectTasks projectId={project.id} />
        </section>
      )}

      {/* Demos (admin only) — temporarily hidden; sprints are where this happens now.
          Flip to `{effectiveIsAdmin && (...)}` to restore. */}
      {false && effectiveIsAdmin && (
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-4">
          <ProjectDemos projectId={project.id} projectName={project.name} />
        </section>
      )}

      {/* Project Files / Documents — temporarily hidden; sprints are where
          this happens now. Flip to `{effectiveIsAdmin && (...)}` to restore. */}
      {false && effectiveIsAdmin && (
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

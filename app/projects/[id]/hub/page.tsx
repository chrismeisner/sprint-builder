import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Typography from "@/components/ui/Typography";
import ProjectHubClient from "./ProjectHubClient";

type PageProps = { params: { id: string } };

export const dynamic = "force-dynamic";

export default async function ProjectHubPage({ params }: PageProps) {
  const { id } = params;
  await ensureSchema();
  const pool = getPool();

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/projects/${id}/hub`)}`);
  }

  const projectResult = await pool.query(
    `SELECT id, name, account_id, figma_file_url, hub_last_synced_at FROM projects WHERE id = $1`,
    [id]
  );

  if (projectResult.rowCount === 0) {
    notFound();
  }

  const project = projectResult.rows[0] as {
    id: string;
    name: string;
    account_id: string | null;
    figma_file_url: string | null;
    hub_last_synced_at: string | Date | null;
  };

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

  return (
    <main className="min-h-screen max-w-6xl mx-auto p-6 space-y-6 font-inter">
      <div className="flex items-center justify-between">
        <div>
          <Typography as="p" scale="mono-sm" className="opacity-70">
            <Link href={`/projects/${project.id}`} className="hover:underline">
              {project.name}
            </Link>
            {" / Figma brand"}
          </Typography>
          <Typography as="h1" scale="h2" className="mt-1">
            Design system hub
          </Typography>
          <Typography as="p" scale="body-sm" className="opacity-70 mt-1">
            Link your Figma source of truth, sync on demand, and view tokens and components.
          </Typography>
        </div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          Back to project
        </Link>
      </div>

      <ProjectHubClient
        projectId={project.id}
        projectName={project.name}
        figmaFileUrl={project.figma_file_url ?? ""}
        hubLastSyncedAt={project.hub_last_synced_at ? new Date(project.hub_last_synced_at).toISOString() : null}
      />
    </main>
  );
}

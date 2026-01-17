import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Typography from "@/components/ui/Typography";
import dynamicImport from "next/dynamic";

const ProjectActions = dynamicImport(() => import("../../ProjectActions"), { ssr: false });
const ProjectNameForm = dynamicImport(() => import("../../ProjectNameForm"), { ssr: false });

type PageProps = { params: { id: string } };

export const dynamic = "force-dynamic";

export default async function ProjectSettingsPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/projects/${params.id}/settings`)}`);
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
    updated_at: string | Date | null;
  };

  // Allow owners, admins, or explicit project members to view settings
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
    <main className="min-h-screen max-w-3xl mx-auto p-6 space-y-6 font-inter">
      <div className="flex items-center justify-between">
        <div>
          <Typography as="p" scale="mono-sm" className="opacity-70">
            Project settings
          </Typography>
          <Typography as="h1" scale="h2" className="mt-1">
            {project.name}
          </Typography>
          <Typography as="p" scale="body-sm" className="opacity-70 mt-1">
            Created {new Date(project.created_at).toLocaleDateString()}
            {project.updated_at && ` • Updated ${new Date(project.updated_at).toLocaleDateString()}`}
          </Typography>
        </div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          Back to project
        </Link>
      </div>

      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-4">
        <ProjectNameForm projectId={project.id} initialName={project.name} />
      </section>

      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-4">
        <ProjectActions projectId={project.id} projectName={project.name} isOwner={isOwner} />
      </section>
    </main>
  );
}


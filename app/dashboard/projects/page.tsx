import { ensureSchema, getPool } from "@/lib/db";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  year: number | null;
  involvement_type: string | null;
  published: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string;
};

export default async function ProjectsPage() {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, title, slug, description, year, involvement_type, published, featured, sort_order, created_at
     FROM past_projects
     ORDER BY sort_order ASC, created_at DESC`
  );

  const projects: Project[] = result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    year: row.year,
    involvement_type: row.involvement_type,
    published: row.published,
    featured: row.featured,
    sort_order: row.sort_order,
    created_at: new Date(row.created_at).toISOString(),
  }));

  return (
    <div className="container max-w-6xl py-10">
      <ProjectsClient initialProjects={projects} />
    </div>
  );
}


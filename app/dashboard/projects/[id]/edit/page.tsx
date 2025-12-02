import { ensureSchema, getPool } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectFormClient from "../../ProjectFormClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

type Outcomes = {
  metrics?: string[];
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  } | null;
};

export default async function EditProjectPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, title, slug, description, story, year, involvement_type, project_scale, industry,
            outcomes, thumbnail_url, images, project_url, published, featured
     FROM past_projects
     WHERE id = $1`,
    [params.id]
  );

  if (result.rowCount === 0) {
    notFound();
  }

  const row = result.rows[0];
  const rawOutcomes = (row.outcomes as Outcomes) || { metrics: [], testimonial: null };
  const project = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || "",
    story: row.story || "",
    year: row.year,
    involvement_type: row.involvement_type || "",
    project_scale: row.project_scale || "",
    industry: row.industry || "",
    outcomes: {
      metrics: rawOutcomes.metrics || [],
      testimonial: rawOutcomes.testimonial || null,
    },
    thumbnail_url: row.thumbnail_url || "",
    images: (row.images as string[]) || [],
    project_url: row.project_url || "",
    published: row.published,
    featured: row.featured,
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center text-sm opacity-70 hover:opacity-100 transition"
        >
          ← Back to projects
        </Link>
      </div>
      
      <h1 className="text-2xl font-semibold mb-6">Edit Project</h1>
      
      <ProjectFormClient mode="edit" project={project} />
    </div>
  );
}


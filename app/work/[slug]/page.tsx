import { ensureSchema, getPool } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string };
};

type Outcomes = {
  metrics?: string[];
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  } | null;
};

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  story: string | null;
  year: number | null;
  involvement_type: string | null;
  project_scale: string | null;
  industry: string | null;
  outcomes: Outcomes | null;
  thumbnail_url: string | null;
  images: string[] | null;
  project_url: string | null;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, title, slug, description, story, year, involvement_type, project_scale, industry,
            outcomes, thumbnail_url, images, project_url
     FROM past_projects
     WHERE slug = $1 AND published = true`,
    [params.slug]
  );

  if (result.rowCount === 0) {
    notFound();
  }

  const row = result.rows[0];
  const project: Project = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    story: row.story,
    year: row.year,
    involvement_type: row.involvement_type,
    project_scale: row.project_scale,
    industry: row.industry,
    outcomes: row.outcomes as Outcomes | null,
    thumbnail_url: row.thumbnail_url,
    images: row.images as string[] | null,
    project_url: row.project_url,
  };

  return (
    <main className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <section className="bg-gradient-to-b from-black/5 to-transparent dark:from-white/5 py-12">
        <div className="container max-w-4xl space-y-4">
          <Link
            href="/work"
            className="inline-flex items-center text-sm opacity-70 hover:opacity-100 transition"
          >
            ← Back to all work
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold">{project.title}</h1>
          {project.description && (
            <p className="text-lg sm:text-xl opacity-80">{project.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {project.year && (
              <span className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-3 py-1">
                {project.year}
              </span>
            )}
            {project.involvement_type && (
              <span className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-3 py-1">
                {project.involvement_type}
              </span>
            )}
            {project.project_scale && (
              <span className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-3 py-1">
                {project.project_scale}
              </span>
            )}
            {project.industry && (
              <span className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-3 py-1">
                {project.industry}
              </span>
            )}
            {project.project_url && (
              <a
                href={project.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-black/10 dark:border-white/15 px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Visit project →
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container max-w-4xl py-12 space-y-12">
        {/* Hero Image */}
        {project.thumbnail_url && (
          <div className="rounded-lg overflow-hidden border border-black/10 dark:border-white/15">
            <img
              src={project.thumbnail_url}
              alt={project.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Key Outcomes */}
        {project.outcomes?.metrics && project.outcomes.metrics.length > 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-6">
            <h2 className="text-xl font-semibold mb-4">Key Outcomes</h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {project.outcomes.metrics.map((metric, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span className="text-sm">{metric}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Story */}
        {project.story && (
          <div className="prose prose-sm sm:prose-base max-w-none">
            <h2 className="text-xl font-semibold mb-4">The Story</h2>
            <div className="whitespace-pre-wrap opacity-90 leading-relaxed">
              {project.story}
            </div>
          </div>
        )}

        {/* Additional Images */}
        {project.images && project.images.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Project Gallery</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {project.images.map((img, i) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden border border-black/10 dark:border-white/15"
                >
                  <img src={img} alt={`${project.title} ${i + 1}`} className="w-full h-auto" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonial */}
        {project.outcomes?.testimonial && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-6">
            <blockquote className="space-y-4">
              <p className="text-lg italic">&ldquo;{project.outcomes.testimonial.quote}&rdquo;</p>
              <footer className="text-sm opacity-80">
                <strong>{project.outcomes.testimonial.author}</strong>
                {project.outcomes.testimonial.role && (
                  <>, {project.outcomes.testimonial.role}</>
                )}
              </footer>
            </blockquote>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container max-w-4xl py-16 text-center space-y-6 border-t border-black/10 dark:border-white/15">
        <h2 className="text-2xl font-bold">Like what you see?</h2>
        <p className="text-lg opacity-80">
          Start your own 2-week sprint and get results like this.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/how-it-works"
            className="inline-flex items-center rounded-full bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            How it works →
          </Link>
          <Link
            href="/work"
            className="inline-flex items-center rounded-full border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            View more work
          </Link>
        </div>
      </section>
    </main>
  );
}


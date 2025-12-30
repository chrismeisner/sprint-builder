import Image from "next/image";
import { ensureSchema, getPool } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  year: number | null;
  involvement_type: string | null;
  featured: boolean;
  thumbnail_url: string | null;
};

export default async function WorkPage() {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, title, slug, description, year, involvement_type, featured, thumbnail_url
     FROM past_projects
     WHERE published = true
     ORDER BY featured DESC, sort_order ASC, created_at DESC`
  );

  const projects: Project[] = result.rows;
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <main className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-black/5 to-transparent dark:from-white/5 py-16">
        <div className="container max-w-4xl text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Past Work
          </h1>
          <p className="text-lg sm:text-xl opacity-80 max-w-2xl mx-auto">
            Selected projects from startups, agencies, and collaborative ventures across design and development.
          </p>
        </div>
      </section>

      {/* Featured Projects */}
      {featured.length > 0 && (
        <section className="container max-w-6xl py-12">
          <h2 className="text-2xl font-bold mb-6">Featured Work</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((project) => (
              <Link
                key={project.id}
                href={`/work/${project.slug}`}
                className="group rounded-lg border border-black/10 dark:border-white/15 overflow-hidden hover:border-black/20 dark:hover:border-white/25 transition"
              >
                {project.thumbnail_url ? (
                  <div className="aspect-video bg-black/5 dark:bg-white/5 relative">
                    <Image
                      src={project.thumbnail_url}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center">
                    <span className="text-4xl opacity-20">📁</span>
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-lg group-hover:underline">
                      {project.title}
                    </h3>
                    {project.year && (
                      <span className="text-xs opacity-60">{project.year}</span>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-sm opacity-80 line-clamp-3">
                      {project.description}
                    </p>
                  )}
                  {project.involvement_type && (
                    <div className="pt-2">
                      <span className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-2.5 py-0.5 text-xs">
                        {project.involvement_type}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Other Projects */}
      {others.length > 0 && (
        <section className="container max-w-6xl py-12">
          {featured.length > 0 && <h2 className="text-2xl font-bold mb-6">More Projects</h2>}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {others.map((project) => (
              <Link
                key={project.id}
                href={`/work/${project.slug}`}
                className="group rounded-lg border border-black/10 dark:border-white/15 overflow-hidden hover:border-black/20 dark:hover:border-white/25 transition"
              >
                {project.thumbnail_url ? (
                  <div className="aspect-video bg-black/5 dark:bg-white/5 relative">
                    <Image
                      src={project.thumbnail_url}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center">
                    <span className="text-4xl opacity-20">📁</span>
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-lg group-hover:underline">
                      {project.title}
                    </h3>
                    {project.year && (
                      <span className="text-xs opacity-60">{project.year}</span>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-sm opacity-80 line-clamp-3">
                      {project.description}
                    </p>
                  )}
                  {project.involvement_type && (
                    <div className="pt-2">
                      <span className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-2.5 py-0.5 text-xs">
                        {project.involvement_type}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {projects.length === 0 && (
        <section className="container max-w-4xl py-16 text-center">
          <p className="text-lg opacity-70">No published projects yet. Check back soon!</p>
        </section>
      )}

      {/* CTA */}
      <section className="container max-w-4xl py-16 text-center space-y-6 border-t border-black/10 dark:border-white/15">
        <h2 className="text-2xl font-bold">Ready to start your sprint?</h2>
        <p className="text-lg opacity-80">
          Get a custom sprint plan for your project in minutes.
        </p>
        <Link
          href="/how-it-works"
          className="inline-flex items-center rounded-full bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
        >
          Learn how it works →
        </Link>
      </section>
    </main>
  );
}


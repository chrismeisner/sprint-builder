import { ensureSchema, getPool } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

type NumericLike = number | string | null;

function toNumber(value: NumericLike): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function getComplexityMeta(pointsLike: NumericLike) {
  const points = toNumber(pointsLike);
  if (!points || points <= 3) {
    return {
      label: "Light",
      tone: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
      description: "Quick add-on deliverable",
    };
  }
  if (points <= 8) {
    return {
      label: "Core",
      tone: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
      description: "Standard 2-week sprint fit",
    };
  }
  return {
    label: "Intensive",
    tone: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200",
    description: "Heavier lift, anchor deliverable",
  };
}

export default async function DeliverableDetailPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.isAdmin === true;

  // Try to find by ID first, then by slug
  const result = await pool.query(
    `SELECT 
      id, name, description, category, points, scope, format,
      presentation_content, example_images, slug, active,
      template_data, created_at, updated_at
     FROM deliverables 
     WHERE id = $1 OR slug = $1
     LIMIT 1`,
    [params.id]
  );

  if (result.rowCount === 0) {
    notFound();
  }

  const deliverable = result.rows[0] as {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    points: NumericLike;
    scope: string | null;
    format: string | null;
    presentation_content: string | null;
    example_images: string[] | null;
    slug: string | null;
    active: boolean;
    template_data: Record<string, unknown> | null;
    created_at: string | Date;
    updated_at: string | Date;
  };

  const complexity = getComplexityMeta(deliverable.points);
  const scopeLines = deliverable.scope
    ? deliverable.scope.split("\n").map((l) => l.trim()).filter(Boolean)
    : [];

  const t = {
    pageTitle: typography.headingSection,
    subhead: `${getTypographyClassName("body-sm")} text-text-secondary`,
    body: `${getTypographyClassName("body-md")} text-text-secondary`,
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    label: `${getTypographyClassName("subtitle-sm")} text-text-muted`,
    monoLabel: `${getTypographyClassName("mono-sm")} text-text-muted`,
    sectionHeading: `${getTypographyClassName("h3")} text-text-primary`,
    cardHeading: typography.headingCard,
  };

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-8">
      {/* Breadcrumb */}
      <nav className={`flex items-center gap-2 ${t.bodySm}`}>
        <Link href="/deliverables" className="hover:underline">
          ← All Deliverables
        </Link>
      </nav>

      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full bg-black/10 dark:bg-white/10 px-3 py-1 ${getTypographyClassName("mono-sm")} text-black/70 dark:text-white/60`}>
                {deliverable.category ?? "Deliverable"}
              </span>
              {!deliverable.active && (
                <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/40 px-3 py-1 text-xs text-red-800 dark:text-red-200">
                  Inactive
                </span>
              )}
            </div>
            <h1 className={t.pageTitle}>{deliverable.name}</h1>
            {deliverable.description && (
              <p className={t.body}>{deliverable.description}</p>
            )}
          </div>
          <div className={`flex flex-col items-end rounded-xl px-4 py-3 ${complexity.tone}`}>
            <span className="text-sm font-semibold">{complexity.label}</span>
            <span className="text-2xl font-bold">{deliverable.points ?? "—"}</span>
            <span className="text-xs opacity-80">points</span>
          </div>
        </div>

        {isAdmin && (
          <Link
            href={`/dashboard/deliverables?edit=${deliverable.id}`}
            className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition ${getTypographyClassName("button-sm")}`}
          >
            Edit deliverable
          </Link>
        )}
      </header>

      {/* Scope & Format */}
      <section className="rounded-xl border border-black/10 dark:border-white/15 p-6 space-y-4 bg-white/40 dark:bg-black/40">
        <h2 className={t.sectionHeading}>Scope & Format</h2>
        
        {scopeLines.length > 0 && (
          <div className="space-y-2">
            <p className={t.label}>What&apos;s Included</p>
            <ul className="space-y-2">
              {scopeLines.map((line, i) => (
                <li key={i} className={`flex items-start gap-2 ${t.bodySm}`}>
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>{line.replace(/^[•\-]\s*/, "")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {deliverable.format && (
          <div className="space-y-2">
            <p className={t.label}>Delivery Format</p>
            <p className={t.bodySm}>{deliverable.format}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/10 dark:border-white/10">
          <div className="rounded-lg bg-black/5 dark:bg-white/5 p-4 text-center">
            <p className={t.monoLabel}>Complexity</p>
            <p className="text-xl font-bold">{deliverable.points ?? "—"} pts</p>
            <p className={t.bodySm}>{complexity.description}</p>
          </div>
          <div className="rounded-lg bg-black/5 dark:bg-white/5 p-4 text-center">
            <p className={t.monoLabel}>Category</p>
            <p className="text-xl font-bold">{deliverable.category ?? "General"}</p>
          </div>
        </div>
      </section>

      {/* Example Images */}
      {deliverable.example_images && deliverable.example_images.length > 0 && (
        <section className="rounded-xl border border-black/10 dark:border-white/15 p-6 space-y-4 bg-white/40 dark:bg-black/40">
          <h2 className={t.sectionHeading}>Examples</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {deliverable.example_images.map((url, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-black/10 dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`${deliverable.name} example ${i + 1}`} className="w-full h-auto" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="pt-4">
        <Link
          href="/deliverables"
          className={`inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition ${getTypographyClassName("button-sm")}`}
        >
          ← Back to all deliverables
        </Link>
      </div>
    </main>
  );
}


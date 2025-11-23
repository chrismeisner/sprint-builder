import Link from "next/link";
import { ensureSchema, getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

type NumericLike = number | string | null;

type Deliverable = {
  id: string;
  name: string;
  description: string | null;
  scope: string | null;
  category: string | null;
  defaultEstimatePoints: NumericLike;
  fixedHours: NumericLike;
  fixedPrice: NumericLike;
};

type ComplexityMeta = {
  label: string;
  tone: string;
  description: string;
};

function toNumber(value: NumericLike): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function getComplexityMeta(pointsLike: NumericLike): ComplexityMeta {
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

function formatCurrency(valueLike: NumericLike) {
  const value = toNumber(valueLike);
  if (value == null) return "Custom";
  return `$${value.toLocaleString()}`;
}

function formatHours(valueLike: NumericLike) {
  const value = toNumber(valueLike);
  if (value == null) return "N/A";
  return `${value.toFixed(1).replace(/\.0$/, "")}h`;
}

export default async function DeliverablesPage() {
  await ensureSchema();
  const pool = getPool();

  const result = await pool.query(
    `
      SELECT 
        id,
        name,
        description,
        scope,
        category,
        default_estimate_points AS "defaultEstimatePoints",
        fixed_hours AS "fixedHours",
        fixed_price AS "fixedPrice"
      FROM deliverables
      WHERE active = true
      ORDER BY category ASC, name ASC
    `
  );

  const deliverables: Deliverable[] = result.rows;

  const grouped = deliverables.reduce<Record<string, Deliverable[]>>((acc, item) => {
    const key = item.category ?? "Other";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const orderedCategories = ["Branding", "Product", "Other"].filter(
    (category) => grouped[category]?.length
  );

  const categoryMeta: Record<
    string,
    { label: string; description: string; icon: string }
  > = {
    Branding: {
      label: "Brand Foundation Deliverables",
      description:
        "Everything you can plug into a Brand or Extend & Iterate sprint once your foundation is set.",
      icon: "🎨",
    },
    Product: {
      label: "Product & Experience Deliverables",
      description:
        "UX, UI, and build-focused outputs for product foundations or follow-on sprints.",
      icon: "💻",
    },
    Other: {
      label: "Additional Deliverables",
      description: "Miscellaneous items that can be layered into any sprint.",
      icon: "✨",
    },
  };

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-black/70 dark:text-white/70">
            Deliverables Library
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Everything we can ship in a sprint
          </h1>
          <p className="text-lg sm:text-xl opacity-80">
            Browse the deliverables available inside Brand/Product Foundations and Extend &amp;
            Iterate sprints. Each item includes scope, pricing, hours, and complexity so you can mix
            and match with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/packages"
              className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              View Foundation Packages
            </Link>
            <Link
              href="/intake"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Request Extend &amp; Iterate sprint →
            </Link>
          </div>
          <p className="text-sm opacity-60">
            📌 Every new client starts with Brand or Product Foundations. These deliverables unlock
            once your foundation is complete.
          </p>
        </div>
      </section>

      {/* Category Sections */}
      <section className="max-w-6xl mx-auto px-6 py-16 space-y-16">
        {orderedCategories.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <h2 className="text-2xl font-semibold">No deliverables available yet</h2>
            <p className="text-base opacity-70">
              We&apos;re updating the library. Check back soon or{" "}
              <Link href="/packages" className="underline hover:opacity-100">
                view current sprint packages
              </Link>
              .
            </p>
          </div>
        )}

        {orderedCategories.map((category) => {
          const meta = categoryMeta[category] ?? categoryMeta.Other;
          const items = grouped[category];

          return (
            <div key={category} className="space-y-8">
              <div className="text-center space-y-3">
                <div className="text-4xl">{meta.icon}</div>
                <h2 className="text-3xl font-bold">{meta.label}</h2>
                <p className="text-base opacity-70">{meta.description}</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {items.map((item) => {
                  const complexity = getComplexityMeta(item.defaultEstimatePoints);
                  const scopeLines = item.scope
                    ? item.scope
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 flex flex-col gap-4 shadow-sm hover:shadow-lg transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm opacity-80 mt-1">{item.description}</p>
                          )}
                        </div>
                        <div
                          className={`inline-flex flex-col items-end rounded-lg px-3 py-2 text-xs font-semibold ${complexity.tone}`}
                        >
                          <span>{complexity.label}</span>
                          <span className="opacity-80">
                            {item.defaultEstimatePoints ?? "—"} pts
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center text-sm font-medium">
                        <div className="rounded-lg bg-black/5 dark:bg-white/5 p-3">
                          <p className="text-xs uppercase tracking-wide opacity-60">Investment</p>
                          <p className="text-lg">{formatCurrency(item.fixedPrice)}</p>
                        </div>
                        <div className="rounded-lg bg-black/5 dark:bg-white/5 p-3">
                          <p className="text-xs uppercase tracking-wide opacity-60">Hours</p>
                          <p className="text-lg">{formatHours(item.fixedHours)}</p>
                        </div>
                        <div className="rounded-lg bg-black/5 dark:bg-white/5 p-3">
                          <p className="text-xs uppercase tracking-wide opacity-60">Pairing</p>
                          <p className="text-lg">{complexity.description}</p>
                        </div>
                      </div>

                      {scopeLines.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
                            Scope highlights
                          </p>
                          <ul className="space-y-1 text-sm opacity-80">
                            {scopeLines.map((line, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-black/40 dark:text-white/40 mt-1">•</span>
                                <span>{line.replace(/^•\s*/, "")}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* CTA */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <h2 className="text-3xl font-bold">Ready to build your sprint?</h2>
          <p className="text-base sm:text-lg opacity-80">
            Pick your foundation sprint, then plug in deliverables from this library. Once your
            foundation is complete, rebook Extend &amp; Iterate sprints whenever you need momentum.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/packages"
              className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              Start with Foundations →
            </Link>
            <Link
              href="/intake"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Plan Extend &amp; Iterate sprint
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}



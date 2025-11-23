"use client";

import Link from "next/link";

type Package = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  tagline: string | null;
  flat_fee: number | null;      // NULL = dynamic (calculate from deliverables)
  flat_hours: number | null;    // NULL = dynamic (calculate from deliverables)
  featured: boolean;
  deliverables: Array<{
    deliverableId: string;
    name: string;
    description: string | null;
    scope: string | null;
    fixedHours: number | null;
    fixedPrice: number | null;
    quantity: number;
    complexityScore: number;
  }>;
};

type Props = {
  packages: Package[];
};

export default function PackagesClient({ packages }: Props) {
  // Calculate package totals dynamically from deliverables (base complexity 1.0)
  function calculatePackageTotal(pkg: Package): { hours: number; price: number } {
    let totalHours = 0;
    let totalPrice = 0;

    pkg.deliverables.forEach((d) => {
      const baseHours = d.fixedHours ?? 0;
      const basePrice = d.fixedPrice ?? 0;
      const qty = d.quantity ?? 1;
      const complexityMultiplier = d.complexityScore ?? 1.0; // Base complexity is 1.0
      
      // Apply complexity adjustment
      totalHours += baseHours * complexityMultiplier * qty;
      totalPrice += basePrice * complexityMultiplier * qty;
    });

    return { hours: totalHours, price: totalPrice };
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-black dark:bg-white text-white dark:text-black py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Foundation Packages</h1>
          <p className="text-xl opacity-90 mb-8">
            Two clear entry points for new clients. Both start with our 3-hour Foundation Workshop, then diverge into Brand or Product execution.
          </p>
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-white dark:bg-black text-black dark:text-white px-6 py-3 text-sm font-medium hover:opacity-90 transition"
          >
            Back to Home
          </Link>
        </div>
      </section>

      {/* Foundation Packages */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Foundation</h2>
            <p className="text-base sm:text-lg opacity-70 max-w-2xl mx-auto">
              Every new client begins with the same Foundation Workshop (3 hours) to align on goals and strategy. Then we diverge into your chosen track.
            </p>
          </div>
          {packages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg opacity-70 mb-4">No packages available yet.</p>
              <Link
                href="/"
                className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Back to home
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} featured={pkg.featured} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Already a client?</h2>
          <p className="text-base sm:text-lg opacity-80 mb-8">
            Looking for iteration or expansion sprints? Request specific deliverables for your follow-on project.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/intake"
              className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-sm font-medium hover:opacity-90 transition"
            >
              Submit intake form →
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              How it works
            </Link>
          </div>
          <p className="text-xs sm:text-sm opacity-60 mt-6 max-w-lg mx-auto">
            All follow-on sprints begin with a Mini Foundation Workshop (1 hour) to quickly realign and confirm deliverables.
          </p>
        </div>
      </section>
    </main>
  );

  function PackageCard({ pkg, featured }: { pkg: Package; featured: boolean }) {
    const { price: finalPrice, hours: finalHours } = calculatePackageTotal(pkg);

    return (
      <div
        className={
          featured
            ? "rounded-xl border-2 border-yellow-500 dark:border-yellow-400 bg-white dark:bg-black p-6 shadow-lg hover:shadow-xl transition flex flex-col"
            : "rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 hover:border-black/20 dark:hover:border-white/20 hover:shadow-lg transition flex flex-col"
        }
      >
        {/* Header */}
        <div className="mb-4">
          {featured && (
            <div className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-medium mb-2">
              ⭐ Featured
            </div>
          )}
          {pkg.category && (
            <div className="inline-flex items-center rounded-full bg-blue-600/10 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-xs font-medium mb-2 ml-2">
              {pkg.category}
            </div>
          )}
          <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
          {pkg.tagline && <p className="text-sm opacity-80 mb-3">{pkg.tagline}</p>}
        </div>

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">${finalPrice.toLocaleString()}</span>
            <span className="text-sm opacity-70">/ {finalHours.toFixed(1)}h</span>
          </div>
          <p className="text-xs opacity-60 mt-1">
            Dynamically calculated from deliverables
          </p>
        </div>

        {/* Description */}
        {pkg.description && <p className="text-sm opacity-80 mb-4">{pkg.description}</p>}

        {/* Deliverables */}
        <div className="mb-6 flex-1">
          <div className="text-xs font-semibold uppercase opacity-70 mb-2">What&apos;s Included</div>
          <ul className="space-y-2">
            {pkg.deliverables.map((d, i) => (
              <li key={`${d.deliverableId}-${i}`} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <div className="flex-1">
                  <div className="font-medium">
                    {d.name}
                    {d.quantity > 1 && ` (×${d.quantity})`}
                  </div>
                  {d.scope && (
                    <div className="text-xs opacity-70 mt-0.5 whitespace-pre-wrap">
                      {d.scope}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Link
          href={`/packages/${pkg.slug}`}
          className={
            featured
              ? "inline-flex items-center justify-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-3 text-sm font-medium hover:opacity-90 transition w-full"
              : "inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/15 px-4 py-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition w-full"
          }
        >
          Learn More →
        </Link>
      </div>
    );
  }
}


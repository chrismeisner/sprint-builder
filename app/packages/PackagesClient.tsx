"use client";

import Link from "next/link";
import { calculatePackageTotal, type SprintPackage } from "../components/PackageCard";

type Package = SprintPackage & {
  flat_fee: number | null;      // NULL = dynamic (calculate from deliverables)
  flat_hours: number | null;    // NULL = dynamic (calculate from deliverables)
  featured: boolean;
};

type Props = {
  packages: Package[];
};

export default function PackagesClient({ packages }: Props) {
  const foundationPackages = packages.filter(
    (pkg) => pkg.package_type === "foundation"
  );
  const extendPackages = packages.filter(
    (pkg) => pkg.package_type === "extend"
  );
  const hasPackages = packages.length > 0;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="container max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Foundation &amp; Expansion Sprints
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Start with a 2-week Foundation Sprint to lock your strategy, then stack Expansion Sprints whenever you need a launch, prototype, or feature refresh—same cadence, zero re-onboarding.
          </p>
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-white text-black px-6 py-3 text-sm font-medium hover:opacity-90 transition"
          >
            Back to Home
          </Link>
        </div>
      </section>

      {/* Packages */}
      <section className="py-12">
        <div className="container space-y-16">
          {!hasPackages ? (
            <div className="text-center py-12">
              <p className="text-lg opacity-70 mb-4">
                No sprint packages are available yet.
              </p>
              <Link
                href="/"
                className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Back to home
              </Link>
            </div>
          ) : (
            <>
              <div>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">Start with a Foundation Sprint</h2>
                  <p className="text-base sm:text-lg opacity-70 max-w-2xl mx-auto">
                    Every new client begins with our 3-hour Foundation Workshop to align on goals and strategy. Choose Brand or Product foundations to set the source of truth for every future sprint.
                  </p>
                </div>
                {foundationPackages.length === 0 ? (
                  <p className="text-center text-sm opacity-70">
                    Foundation packages are currently unavailable.
                  </p>
                ) : (
                  <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
                    {foundationPackages.map((pkg) => (
                      <PackageCard key={pkg.id} pkg={pkg} featured={pkg.featured} />
                    ))}
                  </div>
                )}
              </div>

              {extendPackages.length > 0 && (
                <div>
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Expansion Sprints</h2>
                    <p className="text-base sm:text-lg opacity-70 max-w-2xl mx-auto">
                      Unlocked after a Foundation Sprint. Each Expansion Sprint starts with a 1-hour Mini Foundation Workshop, then ships focused deliverables in the same 10-day cadence.
                    </p>
                  </div>
                  <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
                    {extendPackages.map((pkg) => (
                      <PackageCard key={pkg.id} pkg={pkg} featured={pkg.featured} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-16">
        <div className="container max-w-4xl text-center space-y-6">
          <h2 className="text-3xl font-bold">Need something different?</h2>
          <p className="text-base sm:text-lg opacity-80 max-w-2xl mx-auto">
            The packages above are our most common starting points, but we can build a custom sprint around any combination of deliverables. Browse the full library, then reach out to scope a 2-week sprint that fits your exact needs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/deliverables"
              className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-sm font-medium hover:opacity-90 transition"
            >
              Browse deliverables
            </Link>
            <Link
              href="/intake"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Request custom sprint
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              How it works
            </Link>
          </div>
          <p className="text-xs sm:text-sm opacity-60 max-w-2xl mx-auto">
            Every Expansion Sprint starts with a 1-hour Mini Foundation Workshop to quickly realign on scope and direction—no repeat discovery, just execution.
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
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {featured && (
              <div className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-medium">
                ⭐ Featured
              </div>
            )}
            <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              pkg.package_type === "extend" 
                ? "bg-emerald-500/90 text-white" 
                : "bg-blue-500/90 text-white"
            }`}>
              {pkg.package_type === "extend" ? "🚀 Expansion Sprint" : "🏗️ Foundation Sprint"}
            </div>
            {pkg.category && (
              <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                pkg.category === "Branding" ? "bg-purple-500/90 text-white" :
                pkg.category === "Product" ? "bg-cyan-500/90 text-white" :
                pkg.category === "Brand Extend" ? "bg-violet-500/90 text-white" :
                pkg.category === "Product Extend" ? "bg-teal-500/90 text-white" :
                "bg-black/10 dark:bg-white/10 text-black dark:text-white"
              }`}>
                {pkg.category === "Branding" ? "🎨 Branding" :
                 pkg.category === "Product" ? "⚡ Product" :
                 pkg.category === "Brand Extend" ? "✨ Brand Extend" :
                 pkg.category === "Product Extend" ? "🔧 Product Extend" :
                 pkg.category}
              </div>
            )}
          </div>
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



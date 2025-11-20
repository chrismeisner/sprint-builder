"use client";

import { useState } from "react";
import Link from "next/link";

type Package = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  tagline: string | null;
  flat_fee: number | null;
  flat_hours: number | null;
  discount_percentage: number | null;
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  function calculatePackageTotal(pkg: Package): { hours: number; price: number } {
    let totalHours = 0;
    let totalPrice = 0;

    pkg.deliverables.forEach((d) => {
      const baseHours = d.fixedHours ?? 0;
      const basePrice = d.fixedPrice ?? 0;
      const qty = d.quantity ?? 1;
      const complexityMultiplier = (d.complexityScore ?? 2.5) / 2.5;
      
      // Apply complexity adjustment
      totalHours += baseHours * complexityMultiplier * qty;
      totalPrice += basePrice * complexityMultiplier * qty;
    });

    return { hours: totalHours, price: totalPrice };
  }

  function getFinalPrice(pkg: Package): number {
    if (pkg.flat_fee != null) return pkg.flat_fee;
    const { price } = calculatePackageTotal(pkg);
    if (pkg.discount_percentage != null) {
      return price * (1 - pkg.discount_percentage / 100);
    }
    return price;
  }

  function getFinalHours(pkg: Package): number {
    if (pkg.flat_hours != null) return pkg.flat_hours;
    const { hours } = calculatePackageTotal(pkg);
    return hours;
  }

  // Get unique categories
  const categories = Array.from(new Set(packages.map((p) => p.category).filter(Boolean)));

  // Filter packages by category
  const filteredPackages =
    selectedCategory === null
      ? packages
      : packages.filter((p) => p.category === selectedCategory);

  const featuredPackages = filteredPackages.filter((p) => p.featured);
  const regularPackages = filteredPackages.filter((p) => !p.featured);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-black dark:bg-white text-white dark:text-black py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Sprint Packages</h1>
          <p className="text-xl opacity-90 mb-8">
            Pre-packaged 2-week sprints with fixed pricing. Get started fast with clarity and
            confidence.
          </p>
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-white dark:bg-black text-black dark:text-white px-6 py-3 text-sm font-medium hover:opacity-90 transition"
          >
            Start Your Project
          </Link>
        </div>
      </section>

      {/* Category Filter */}
      {categories.length > 0 && (
        <section className="border-b border-black/10 dark:border-white/15 py-4 px-6">
          <div className="max-w-6xl mx-auto flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">Filter:</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className={
                selectedCategory === null
                  ? "inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-3 py-1 text-sm transition"
                  : "inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
              }
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={
                  selectedCategory === cat
                    ? "inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-3 py-1 text-sm transition"
                    : "inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Featured Packages */}
      {featuredPackages.length > 0 && (
        <section className="py-12 px-6 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>⭐</span> Featured Packages
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Packages */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {featuredPackages.length > 0 && (
            <h2 className="text-2xl font-bold mb-6">All Packages</h2>
          )}
          {filteredPackages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg opacity-70 mb-4">No packages available yet.</p>
              <Link
                href="/"
                className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Contact us for a custom sprint
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} featured={false} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black dark:bg-white text-white dark:text-black py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg opacity-90 mb-8">
            Choose a package or tell us about your project for a custom sprint plan.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center rounded-md bg-white dark:bg-black text-black dark:text-white px-6 py-3 text-sm font-medium hover:opacity-90 transition"
            >
              Start Your Project
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center rounded-md border border-white/15 dark:border-black/15 text-white dark:text-black px-6 py-3 text-sm font-medium hover:bg-white/10 dark:hover:bg-black/10 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </main>
  );

  function PackageCard({ pkg, featured }: { pkg: Package; featured: boolean }) {
    const finalPrice = getFinalPrice(pkg);
    const finalHours = getFinalHours(pkg);
    const { price: calculatedPrice } = calculatePackageTotal(pkg);
    const savings =
      pkg.discount_percentage != null && pkg.flat_fee == null
        ? calculatedPrice - finalPrice
        : pkg.flat_fee != null && calculatedPrice > pkg.flat_fee
        ? calculatedPrice - pkg.flat_fee
        : 0;

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
            <span className="text-sm opacity-70">/ {finalHours}h</span>
          </div>
          {savings > 0 && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Save ${savings.toLocaleString()} vs. individual deliverables
            </p>
          )}
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


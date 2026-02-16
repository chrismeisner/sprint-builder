"use client";

import Link from "next/link";
import HeroSection from "../components/HeroSection";
import SectionIntro from "../components/SectionIntro";
import SectionHeader from "../components/SectionHeader";
import { typography } from "../components/typography";
import PackageCard, { type SprintPackage } from "../components/PackageCard";
import { calculatePricingFromDeliverables } from "@/lib/pricing";

type Package = SprintPackage & {
  flat_fee: number | null;
  flat_hours: number | null;
  featured: boolean;
  deliverables: Array<
    SprintPackage["deliverables"][number] & {
      points: number | null;
      quantity: number;
    }
  >;
};

type Props = {
  packages: Package[];
};

export default function PackagesClient({ packages }: Props) {
  const hasPackages = packages.length > 0;

  const displayPackages: Package[] = packages.map((pkg) => {
    const { price, hours } = calculatePricingFromDeliverables(pkg.deliverables);

    return {
      ...pkg,
      priceLabel: `$${Math.round(price).toLocaleString()}`,
      priceSuffix: `${Math.round(hours)} hours · points-based budget`,
    };
  });

  return (
    <main className="min-h-screen">
      <HeroSection
        title="Sprint packages ready to book"
        subtitle="Each package is a curated set of deliverables with transparent, pre-modeled pricing so you know exactly what you’re getting."
        primaryCta={{ label: "Talk to us", href: "/intake" }}
        secondaryCta={{ label: "Back to home", href: "/" }}
        primaryVariant="accent"
        align="center"
        maxWidth="md"
      />

      <section className="py-12">
        <div className="container max-w-6xl space-y-10">
          <SectionIntro text="Sprint packages" />
          {!hasPackages ? (
            <div className="text-center py-12 space-y-3">
              <p className={typography.bodyBase}>No sprint packages are available yet.</p>
              <Link
                href="/intake"
                className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                Request a custom sprint
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {displayPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} className="h-full" />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-16">
        <div className="container max-w-4xl text-center space-y-8">
          <SectionHeader
            heading="Need something different?"
            description="The packages above are our most common starting points, but we can build a custom sprint around any combination of deliverables. Browse the full library, then reach out to scope a 2-week sprint that fits your needs."
            maxWidth="lg"
          />
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
            Prefer something custom? We can shape a sprint around any combination of deliverables.
          </p>
        </div>
      </section>
    </main>
  );
}

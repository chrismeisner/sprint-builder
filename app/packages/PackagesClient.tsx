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
      priceSuffix: `${Math.round(hours)} hours · 2-week sprint`,
    };
  });

  return (
    <main className="min-h-screen">
      <HeroSection
        title="Sprint packages"
        subtitle="Curated starting points built from the deliverable library. Each package is priced transparently from its deliverables—pick one as-is or use it as a starting point."
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
            description="The packages above are curated starting points. Every sprint can be customized—browse the full deliverable library and we'll build a proposal around the exact scope you need."
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
            Sprints start around $8,000 and scale with the deliverables you choose. Always 2 weeks.
          </p>
          <p className="text-xs sm:text-sm opacity-50 max-w-2xl mx-auto">
            Already shipped a sprint? Ask about <strong>Monthly Support</strong>—starting at $4,000/month for biweekly check-ins and ongoing deliverable updates.
          </p>
        </div>
      </section>
    </main>
  );
}

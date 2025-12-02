import Link from "next/link";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "./typography";

export type PackageDeliverable = {
  deliverableId: string;
  name: string;
  description: string | null;
  scope: string | null;
  fixedHours: number | null;
  fixedPrice: number | null;
  quantity: number;
  complexityScore: number;
};

export type SprintPackage = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  summary?: string | null;
  category: string | null;
  package_type?: "foundation" | "extend";
  tagline: string | null;
  featured?: boolean;
  deliverables: PackageDeliverable[];
  highlights?: string[];
  badgeLabel?: string | null;
  priceLabel?: string | null;
  priceSuffix?: string | null;
  priceFootnote?: string | null;
  finePrint?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
};

export function calculatePackageTotal(pkg: SprintPackage): { hours: number; price: number } {
  let totalHours = 0;
  let totalPrice = 0;

  pkg.deliverables.forEach((d) => {
    const baseHours = d.fixedHours ?? 0;
    const basePrice = d.fixedPrice ?? 0;
    const qty = d.quantity ?? 1;
    const complexityMultiplier = d.complexityScore ?? 1.0;
    
    totalHours += baseHours * complexityMultiplier * qty;
    totalPrice += basePrice * complexityMultiplier * qty;
  });

  return { hours: totalHours, price: totalPrice };
}

type PackageCardProps = {
  pkg: SprintPackage;
  /**
   * Variants are kept for backwards compatibility though the new layout is shared.
   */
  variant?: "default" | "compact" | "detailed";
  showEmojis?: boolean;
  className?: string;
};

const badgeTypography = getTypographyClassName("label");
const buttonTypography = typography.linkLabel;

export default function PackageCard({ pkg, className }: PackageCardProps) {
  const { price, hours } = calculatePackageTotal(pkg);
  
  const badgeLabel =
    pkg.badgeLabel ?? (pkg.package_type === "foundation" ? "New clients" : pkg.package_type === "extend" ? "Expansion sprint" : undefined);
  const summary = pkg.summary ?? pkg.tagline ?? pkg.description ?? "";
  const highlights = buildHighlights(pkg);
  const priceLabel = pkg.priceLabel ?? formatCurrency(price || 0);
  const priceSuffix =
    pkg.priceSuffix ??
    (pkg.package_type === "foundation"
      ? "Flat fee"
      : hours
        ? `${Math.round(hours)} hours`
        : "Scope determined");
  const footnote = pkg.priceFootnote ?? pkg.finePrint ?? "";
  const ctaLabel = pkg.ctaLabel ?? "Get started";
  const ctaHref = pkg.ctaHref ?? `/packages/${pkg.slug}`;

  return (
    <article
      data-component="package-card"
      className={cx(
        "flex h-full flex-col rounded-[28px] border border-black/10 bg-white p-8 text-black shadow-[0_25px_70px_rgba(15,15,15,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_35px_90px_rgba(15,15,15,0.12)]",
        "dark:border-white/15 dark:bg-[#040404] dark:text-white",
        className,
      )}
    >
      <div className="space-y-4">
        {badgeLabel && (
          <p className={cx(badgeTypography, "text-amber-500 dark:text-amber-300")} data-typography-id="label">
            {badgeLabel}
          </p>
        )}
        <div className="space-y-3">
          <h3 className={cx(typography.headingCard, "text-balance text-black dark:text-white")}>{pkg.name}</h3>
          {summary && (
            <p className={cx(typography.supportingLarge, "text-black/70 dark:text-white/70 text-balance")}>
              {summary}
          </p>
          )}
        </div>
        </div>
        
      {highlights.length > 0 && (
        <ul className="mt-6 space-y-2">
          {highlights.map((item, index) => (
            <li key={`${pkg.id}-highlight-${index}`} className="flex items-start gap-3">
              <span className="mt-1 text-lg text-emerald-500 dark:text-emerald-300">✓</span>
              <span className={cx(typography.bodyBase, "text-black/75 dark:text-white/80")}>{item}</span>
            </li>
              ))}
        </ul>
      )}

      <div className="mt-8 space-y-6">
            <div className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className={typography.price} data-typography-id="display-sm">
              {priceLabel}
            </span>
            {priceSuffix && (
              <span className={cx(typography.bodySm, "uppercase tracking-wide text-black/60 dark:text-white/70")} data-typography-id="body-sm">
                {priceSuffix}
              </span>
            )}
          </div>
          {footnote && (
            <p className={cx(typography.bodyXs, "text-black/55 dark:text-white/60")} data-typography-id="caption">
              {footnote}
            </p>
          )}
        </div>
        <Link
          href={ctaHref}
          className={cx(
            buttonTypography,
            "inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            "bg-black text-white hover:bg-black/90 focus-visible:outline-black",
            "dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:focus-visible:outline-white",
          )}
          data-typography-id="subtitle-sm"
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}

function buildHighlights(pkg: SprintPackage): string[] {
  if (pkg.highlights && pkg.highlights.length > 0) {
    return pkg.highlights;
  }

  if (!Array.isArray(pkg.deliverables)) {
    return [];
  }

  return pkg.deliverables.slice(0, 3).map((deliverable) => {
    const suffix = deliverable.quantity && deliverable.quantity > 1 ? ` (×${deliverable.quantity})` : "";
    return `${deliverable.name}${suffix}`;
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}


import Link from "next/link";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "./typography";
import { calculatePricingFromDeliverables } from "@/lib/pricing";

export type PackageDeliverable = {
  deliverableId: string;
  name: string;
  description: string | null;
  scope: string | null;
  fixedHours: number | null;
  fixedPrice: number | null;
  points?: number | null;
  quantity: number;
  complexityScore: number;
};

export type SprintPackage = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  summary?: string | null;
  package_type?: "foundation" | "extend";
  tagline: string | null;
  emoji?: string | null;
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
  const { price, hours } = calculatePricingFromDeliverables(pkg.deliverables);
  return { hours, price };
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

const badgeTypography = getTypographyClassName("subtitle-sm");
const buttonTypography = getTypographyClassName("button-sm");
const summaryTypography = getTypographyClassName("body-md");
const bulletTypography = getTypographyClassName("body-sm");
const priceTypography = getTypographyClassName("mono-lg");
const priceMetaTypography = getTypographyClassName("body-sm");

export default function PackageCard({ pkg, className }: PackageCardProps) {
  const { price, hours } = calculatePackageTotal(pkg);
  
  const badgeLabel =
    pkg.badgeLabel ?? (pkg.package_type === "foundation" ? "New clients" : pkg.package_type === "extend" ? "Expansion sprint" : undefined);
  const summary = pkg.summary ?? pkg.tagline ?? pkg.description ?? "";
  const highlights = buildHighlights(pkg);
  const priceLabel = pkg.priceLabel ?? formatCurrency(price || 0);
  const priceSuffix =
    pkg.priceSuffix ??
    (hours ? `${Math.round(hours)} hours · points-based budget` : "Points-based budget");
  const footnote = pkg.priceFootnote ?? pkg.finePrint ?? "";
  const ctaLabel = pkg.ctaLabel ?? "Learn more";
  const ctaHref = pkg.ctaHref ?? `/packages/${pkg.slug}`;

  return (
    <article
      data-component="package-card"
      className={cx(
        "flex h-full flex-col rounded-[2px] border border-stroke-muted bg-surface-card p-8 text-text-primary shadow-[0_25px_70px_rgba(15,15,15,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_35px_90px_rgba(15,15,15,0.12)]",
        className,
      )}
    >
      <div className="space-y-4">
        {badgeLabel && (
          <p className={cx(badgeTypography, "text-semantic-warning")} data-typography-id="subtitle-sm">
            {badgeLabel}
          </p>
        )}
        <div className="space-y-3">
          <h3 className={cx(typography.headingCard, "text-balance text-text-primary flex items-center gap-2")}>
            {pkg.emoji && <span aria-hidden className="text-2xl leading-none">{pkg.emoji}</span>}
            <span>{pkg.name}</span>
          </h3>
          {summary && (
            <p className={cx(summaryTypography, "text-text-secondary text-balance")} data-typography-id="body-md">
              {summary}
          </p>
          )}
        </div>
        </div>
        
      {highlights.length > 0 && (
        <ul className="mt-6 space-y-2">
          {highlights.map((item, index) => (
            <li key={`${pkg.id}-highlight-${index}`}>
              <div className="flex items-stretch gap-3">
                <div className={cx(bulletTypography, "flex items-center text-semantic-success leading-none")} aria-hidden>
                  ✓
                </div>
                <div className={cx(bulletTypography, "text-text-secondary")} data-typography-id="body-sm">
                  {item}
                </div>
              </div>
            </li>
              ))}
        </ul>
      )}

      <div className="mt-8 space-y-6">
            <div className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className={cx(priceTypography, "text-text-primary")} data-typography-id="mono-lg">
              {priceLabel}
            </span>
            {priceSuffix && (
              <span className={cx(priceMetaTypography, "text-text-muted")} data-typography-id="body-sm">
                {priceSuffix}
              </span>
            )}
          </div>
          {footnote && (
            <p className={cx(typography.bodyXs, "text-text-muted")} data-typography-id="body-sm">
              {footnote}
            </p>
          )}
        </div>
        <Link
          href={ctaHref}
          className={cx(
            buttonTypography,
            "inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            "bg-brand-primary text-brand-inverse border border-brand-primary hover:opacity-90 focus-visible:outline-brand-primary",
          )}
          data-typography-id="button-sm"
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


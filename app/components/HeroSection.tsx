import Link from "next/link";
import type { ReactNode } from "react";
import { getTypographyClassName, type TypographyScaleId } from "@/lib/design-system/typography-classnames";
import { typography } from "./typography";

// Reusable hero section ensuring a consistent H1 + sentence + dual CTA layout.

type HeroCta = {
  label: string;
  href: string;
};

export type HeroSectionProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  body?: ReactNode;
  /**
   * @deprecated use `body`
   */
  supportingText?: ReactNode;
  eyebrow?: ReactNode;
  eyebrowClassName?: string;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
  primaryVariant?: "primary" | "accent";
  align?: "center" | "left";
  maxWidth?: "sm" | "md" | "lg";
  /**
   * When true, apply a tall minimum height to keep the hero at ~80vh.
   */
  minHeight?: boolean;
  className?: string;
  titleScale?: TypographyScaleId;
  titleClassName?: string;
  supportingClassName?: string;
  ctaTarget?: "_self" | "_blank";
  ctaRel?: string;
};

const widthClassMap: Record<NonNullable<HeroSectionProps["maxWidth"]>, string> = {
  sm: "max-w-2xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
};

const buttonTypographyId: TypographyScaleId = "button-md";
const buttonTypographyClasses = getTypographyClassName(buttonTypographyId);

const buttonBase = cx(
  buttonTypographyClasses,
  "inline-flex items-center rounded-md font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2",
);
const primaryButtonStyles = "bg-brand-primary text-brand-inverse border border-brand-primary hover:opacity-90";
const accentButtonStyles = "bg-brand-accent text-brand-inverse border border-brand-accent hover:opacity-90";
const secondaryButtonStyles =
  "border border-stroke-muted text-text-primary bg-surface-subtle hover:bg-surface-strong";

export default function HeroSection({
  title,
  subtitle,
  body,
  supportingText,
  eyebrow,
  eyebrowClassName,
  primaryCta,
  secondaryCta,
  primaryVariant = "primary",
  align = "center",
  maxWidth = "md",
  minHeight = true,
  className,
  titleScale = "h1",
  titleClassName,
  supportingClassName,
  ctaTarget = "_self",
  ctaRel,
}: HeroSectionProps) {
  const resolvedWidthKey = maxWidth ?? "md";
  const sectionClasses = cx(
    "p-6",
    minHeight ? "min-h-[75vh] grid place-items-center" : "py-16",
    className,
  );

  const alignmentClass = align === "center" ? "text-center mx-auto" : "text-left";
  const ctaAlignmentClass = align === "center" ? "justify-center" : "justify-start";
  const headingClasses = cx(
    getTypographyClassName(titleScale),
    "text-text-primary text-balance",
    titleClassName,
  );

  return (
    <section className={sectionClasses}>
      <div className={cx("space-y-6 w-full", widthClassMap[resolvedWidthKey], alignmentClass)}>
        <div className="space-y-3">
          {eyebrow && (
            <p
              className={cx(
                typography.eyebrow,
                align === "center" && "mx-auto",
                eyebrowClassName,
              )}
            >
              {eyebrow}
            </p>
          )}
          <h1 className={headingClasses} data-typography-id={titleScale}>
            {title}
          </h1>
          {subtitle && (
            <p className={cx(typography.supportingLarge, "text-text-secondary text-balance")}>{subtitle}</p>
          )}
        </div>

        {(body ?? supportingText) && (
          <p
            className={cx(
              typography.bodyBase,
              "text-text-secondary",
              supportingClassName,
              align === "center" && "mx-auto",
              "text-balance",
            )}
          >
            {body ?? supportingText}
          </p>
        )}

        <div className={cx("flex flex-col gap-3 sm:flex-row sm:items-center", ctaAlignmentClass)}>
          <Link
            href={primaryCta.href}
            className={cx(
              buttonBase,
              primaryVariant === "accent" ? accentButtonStyles : primaryButtonStyles,
              "px-6 py-3 focus-visible:outline-offset-4",
            )}
            data-typography-id={buttonTypographyId}
            target={ctaTarget}
            rel={ctaRel}
          >
            {primaryCta.label}
          </Link>

          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              className={cx(buttonBase, secondaryButtonStyles, "px-6 py-3 focus-visible:outline-offset-4")}
              data-typography-id={buttonTypographyId}
              target={ctaTarget}
              rel={ctaRel}
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}


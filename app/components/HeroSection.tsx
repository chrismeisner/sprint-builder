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
  supportingText: ReactNode;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
  align?: "center" | "left";
  maxWidth?: "sm" | "md" | "lg";
  minHeight?: boolean;
  className?: string;
  titleScale?: TypographyScaleId;
  titleClassName?: string;
  supportingClassName?: string;
};

const widthClassMap: Record<NonNullable<HeroSectionProps["maxWidth"]>, string> = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-3xl",
};

const buttonTypographyId: TypographyScaleId = "body";
const buttonTypographyClasses = getTypographyClassName(buttonTypographyId);

const buttonBase = cx(
  buttonTypographyClasses,
  "inline-flex items-center rounded-md font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
);
const primaryButtonStyles = "bg-black dark:bg-white text-white dark:text-black hover:opacity-90 focus-visible:outline-black/70";
const secondaryButtonStyles =
  "border border-black/10 dark:border-white/15 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-black/50 dark:focus-visible:outline-white/60";

export default function HeroSection({
  title,
  supportingText,
  primaryCta,
  secondaryCta,
  align = "center",
  maxWidth = "md",
  minHeight = false,
  className,
  titleScale = "display-lg",
  titleClassName,
  supportingClassName,
}: HeroSectionProps) {
  const resolvedWidthKey = maxWidth ?? "md";
  const sectionClasses = cx(
    "p-6",
    minHeight ? "min-h-[60vh] grid place-items-center" : "py-16",
    className,
  );

  const alignmentClass = align === "center" ? "text-center mx-auto" : "text-left";
  const ctaAlignmentClass = align === "center" ? "justify-center" : "justify-start";
  const headingClasses = cx(
    getTypographyClassName(titleScale),
    "text-black dark:text-white text-balance",
    titleClassName,
  );

  return (
    <section className={sectionClasses}>
      <div className={cx("space-y-6 w-full", widthClassMap[resolvedWidthKey], alignmentClass)}>
        <h1 className={headingClasses} data-typography-id={titleScale}>
          {title}
        </h1>

        <p
          className={cx(
            typography.supportingLarge,
            "opacity-90",
            supportingClassName,
            align === "center" && "mx-auto",
            "text-balance",
          )}
        >
          {supportingText}
        </p>

        <div className={cx("flex flex-col gap-3 sm:flex-row sm:items-center", ctaAlignmentClass)}>
          <Link
            href={primaryCta.href}
            className={cx(buttonBase, primaryButtonStyles, "px-6 py-3 focus-visible:outline-offset-4")}
            data-typography-id={buttonTypographyId}
          >
            {primaryCta.label}
          </Link>

          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              className={cx(buttonBase, secondaryButtonStyles, "px-6 py-3 focus-visible:outline-offset-4")}
              data-typography-id={buttonTypographyId}
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


import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "./typography";

type SectionHeaderProps = {
  heading: string;
  description: string;
  maxWidth?: "sm" | "md" | "lg";
  className?: string;
  headingClassName?: string;
  descriptionClassName?: string;
  /** When provided, renders a Wikipedia-style § anchor that appears on hover next to the heading */
  anchorId?: string;
};

const widthMap: Record<NonNullable<SectionHeaderProps["maxWidth"]>, string> = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-3xl",
};

export default function SectionHeader({
  heading,
  description,
  maxWidth = "md",
  className,
  headingClassName,
  descriptionClassName,
  anchorId,
}: SectionHeaderProps) {
  const resolvedWidthKey = maxWidth ?? "md";
  const alignmentClass = "text-center";
  const containerAlignment = "mx-auto";
  const headingClasses = mergeClasses(typography.headingSection, "text-balance", headingClassName);
  const descriptionClasses = mergeClasses(
    getTypographyClassName("subtitle-md"),
    "text-text-secondary",
    "text-balance",
    descriptionClassName,
  );

  return (
    <div className={`w-full ${alignmentClass}`}>
      <div className={`${widthMap[resolvedWidthKey]} ${containerAlignment} space-y-4 ${className ?? ""}`}>
        <h2 className={mergeClasses(headingClasses, anchorId ? "group/anchor inline-flex items-center justify-center gap-1.5" : undefined)} data-typography-id="h2">
          {heading}
          {anchorId && (
            <a
              href={`#${anchorId}`}
              className="opacity-0 group-hover/anchor:opacity-50 text-text-muted hover:text-text-primary transition-opacity duration-150 select-none font-normal text-[0.65em]"
              aria-label="Link to section"
            >
              §
            </a>
          )}
        </h2>
        <p className={descriptionClasses} data-typography-id="subtitle-lg">
          {description}
        </p>
      </div>
    </div>
  );
}

function mergeClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}


import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "./typography";

type SectionHeaderProps = {
  heading: string;
  description: string;
  maxWidth?: "sm" | "md" | "lg";
  className?: string;
  headingClassName?: string;
  descriptionClassName?: string;
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
        <h2 className={headingClasses} data-typography-id="h2">
          {heading}
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


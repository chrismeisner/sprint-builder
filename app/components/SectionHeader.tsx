import { typography } from "./typography";

type SectionHeaderProps = {
  label: string;
  heading?: string;
  description: string;
  align?: "center" | "left";
  maxWidth?: "sm" | "md" | "lg";
  className?: string;
  labelClassName?: string;
  headingClassName?: string;
  descriptionClassName?: string;
};

const widthMap: Record<NonNullable<SectionHeaderProps["maxWidth"]>, string> = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-3xl",
};

export default function SectionHeader({
  label,
  heading,
  description,
  align = "center",
  maxWidth = "md",
  className,
  labelClassName,
  headingClassName,
  descriptionClassName,
}: SectionHeaderProps) {
  const resolvedWidthKey = maxWidth ?? "md";
  const alignmentClass = align === "center" ? "text-center" : "text-left";
  const containerAlignment = align === "center" ? "mx-auto" : "";
  const labelClasses = mergeClasses(typography.eyebrow, labelClassName);
  const headingClasses = mergeClasses(typography.headingSection, "text-balance", headingClassName);
  const descriptionClasses = mergeClasses(typography.supportingLarge, "text-balance", descriptionClassName);

  return (
    <div className={`w-full ${alignmentClass}`}>
      <div className={`${widthMap[resolvedWidthKey]} ${containerAlignment} space-y-4 ${className ?? ""}`}>
        <p className={labelClasses} data-typography-id="label">
          {label}
        </p>
        {heading && (
          <h2 className={headingClasses} data-typography-id="h1">
            {heading}
          </h2>
        )}
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


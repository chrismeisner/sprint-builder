import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { getTypographyClassName, type TypographyScaleId } from "@/lib/design-system/typography-classnames";

type SectionIntroAlign = "center" | "left" | "right";
type SectionIntroTone = "default" | "muted";

type SectionIntroProps<T extends ElementType = "p"> = {
  as?: T;
  text: ReactNode;
  align?: SectionIntroAlign;
  uppercase?: boolean;
  tone?: SectionIntroTone;
  scale?: TypographyScaleId;
  className?: string;
  /** When provided, renders a Wikipedia-style § anchor that appears on hover */
  anchorId?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const WRAPPER_ALIGN_CLASSES: Record<SectionIntroAlign, string> = {
  center: "text-center",
  left: "text-left",
  right: "text-right",
};

const TONE_CLASSES: Record<SectionIntroTone, string> = {
  default: "text-text-secondary",
  muted: "text-text-muted",
};

export default function SectionIntro<T extends ElementType = "p">({
  as,
  text,
  align = "center",
  uppercase = true,
  tone = "default",
  scale = "button-sm",
  className,
  anchorId,
  ...rest
}: SectionIntroProps<T>) {
  const Component = as ?? ("p" as ElementType);
  const wrapperClass = WRAPPER_ALIGN_CLASSES[align] ?? WRAPPER_ALIGN_CLASSES.center;
  const baseTracking = "tracking-[0.35em]";
  const textClasses = [
    "inline-flex items-center justify-center",
    getTypographyClassName(scale),
    uppercase ? ["uppercase", baseTracking] : "normal-case tracking-[0.2em]",
    TONE_CLASSES[tone],
    anchorId ? "group/anchor" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass}>
      <Component className={textClasses} {...rest}>
        {text}
        {anchorId && (
          <a
            href={`#${anchorId}`}
            className="ml-1.5 opacity-0 group-hover/anchor:opacity-50 text-text-muted hover:text-text-primary transition-opacity duration-150 select-none"
            aria-label={`Link to section`}
          >
            §
          </a>
        )}
      </Component>
    </div>
  );
}


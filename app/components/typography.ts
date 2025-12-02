import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

const textPrimary = "text-black dark:text-white";
const textSecondary = "text-black/70 dark:text-white/75";
const textAccent = "text-black/60 dark:text-white/65";

export const typography = {
  eyebrow: `${getTypographyClassName("label")} ${textAccent}`,
  labelPill: `${getTypographyClassName("label")} text-black/80 dark:text-white/80`,
  headingHero: `${getTypographyClassName("display-md")} ${textPrimary}`,
  headingSection: `${getTypographyClassName("h1")} ${textPrimary}`,
  headingCard: `${getTypographyClassName("h3")} ${textPrimary}`,
  supportingLarge: `${getTypographyClassName("subtitle-lg")} ${textSecondary}`,
  bodyBase: `${getTypographyClassName("body")} ${textSecondary}`,
  bodySm: `${getTypographyClassName("body-sm")} ${textSecondary}`,
  bodyXs: `${getTypographyClassName("caption")} ${textAccent}`,
  stepTitle: `${getTypographyClassName("subtitle-sm")} ${textPrimary}`,
  stepDescription: `${getTypographyClassName("body")} ${textSecondary}`,
  price: `${getTypographyClassName("display-sm")} ${textPrimary}`,
  priceMeta: `${getTypographyClassName("label")} ${textAccent}`,
  linkLabel: `${getTypographyClassName("subtitle-sm")}`,
};


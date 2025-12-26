import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

const textPrimary = "text-text-primary";
const textSecondary = "text-text-secondary";
const textAccent = "text-text-muted";

export const typography = {
  eyebrow: `${getTypographyClassName("subtitle-sm")} ${textAccent}`,
  labelPill: `${getTypographyClassName("subtitle-sm")} text-black/80 dark:text-white/80`,
  headingHero: `${getTypographyClassName("h1")} ${textPrimary}`,
  headingSection: `${getTypographyClassName("h2")} ${textPrimary}`,
  headingCard: `${getTypographyClassName("h3")} ${textPrimary}`,
  supportingLarge: `${getTypographyClassName("subtitle-lg")} ${textSecondary}`,
  bodyBase: `${getTypographyClassName("body-md")} ${textSecondary}`,
  bodySm: `${getTypographyClassName("body-sm")} ${textSecondary}`,
  bodyXs: `${getTypographyClassName("body-sm")} ${textAccent}`,
  stepTitle: `${getTypographyClassName("subtitle-sm")} ${textPrimary}`,
  stepDescription: `${getTypographyClassName("body-md")} ${textSecondary}`,
  price: `${getTypographyClassName("h2")} ${textPrimary}`,
  priceMeta: `${getTypographyClassName("subtitle-sm")} ${textAccent}`,
  linkLabel: `${getTypographyClassName("button-md")}`,
  buttonSm: `${getTypographyClassName("button-sm")}`,
  monoLg: `${getTypographyClassName("mono-lg")} ${textPrimary}`,
  monoMd: `${getTypographyClassName("mono-md")} ${textPrimary}`,
  monoSm: `${getTypographyClassName("mono-sm")} ${textSecondary}`,
};


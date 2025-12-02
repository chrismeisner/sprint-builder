import { typographyScale } from "./tokens";

export type TypographyScaleId = (typeof typographyScale)[number]["id"];

type TypographyClassMap = Record<TypographyScaleId, string>;

const buildResponsiveSizeClasses = (token: (typeof typographyScale)[number]) => {
  const classes: string[] = [];
  const mobileSize = token.mobile.sizeClass.trim();
  const desktopSize = token.desktop.sizeClass.trim();

  if (mobileSize) {
    classes.push(mobileSize);
  }

  if (desktopSize && desktopSize !== mobileSize) {
    classes.push(`md:${desktopSize}`);
  }

  return classes;
};

const buildResponsiveLeadingClasses = (token: (typeof typographyScale)[number]) => {
  const classes: string[] = [];
  const mobileLeading = token.mobile.lineHeight.trim();
  const desktopLeading = token.desktop.lineHeight.trim();

  if (mobileLeading) {
    classes.push(`leading-[${mobileLeading}]`);
  }

  if (desktopLeading && desktopLeading !== mobileLeading) {
    classes.push(`md:leading-[${desktopLeading}]`);
  }

  return classes;
};

const typographyClassMap: TypographyClassMap = typographyScale.reduce((acc, token) => {
  const sizeClasses = buildResponsiveSizeClasses(token);
  const lineHeightClasses = buildResponsiveLeadingClasses(token);

  acc[token.id] = [token.baseClass, ...sizeClasses, ...lineHeightClasses].filter(Boolean).join(" ");

  return acc;
}, {} as TypographyClassMap);

export function getTypographyClassName(id: TypographyScaleId): string {
  return typographyClassMap[id];
}

export const typographyClassNames = typographyClassMap;



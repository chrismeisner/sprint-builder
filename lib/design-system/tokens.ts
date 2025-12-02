export type FontVariant = {
  id: string;
  label: string;
  className: string;
  description?: string;
  sample?: string;
};

export type FontToken = {
  id: string;
  label: string;
  description: string;
  samples: string[];
  baseClass: string;
  tailwindClass: string;
  variants: FontVariant[];
};

const sentenceSample = ["The quick brown fox jumps over the lazy dog", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz", "0123456789"];

export const fontTokens: FontToken[] = [
  {
    id: "gt-america",
    label: "GT America",
    description: "Primary display family for expressive hero statements, badges, and impact numerals.",
    samples: sentenceSample,
    baseClass: "font-gt-america",
    tailwindClass: "font-gt-america",
    variants: [
      {
        id: "condensed-black",
        label: "Condensed Black / 900",
        className: "font-gt-america font-black tracking-tight",
        description: "Primary hero headlines and marquee numbers.",
      },
      {
        id: "compressed-bold",
        label: "Compressed Bold / 700",
        className: "font-gt-compressed-bold tracking-tight",
        description: "Bold, narrow display moments like CTA badges.",
      },
      {
        id: "compressed-black",
        label: "Compressed Black / 900",
        className: "font-gt-compressed-black tracking-tight",
        description: "Maximum-impact shout headlines and overlays.",
      },
    ],
  },
  {
    id: "akkurat-pro",
    label: "Akkurat Pro",
    description: "Core sans serif family for UI, body copy, and supporting headings throughout the product.",
    samples: sentenceSample,
    baseClass: "font-akkurat",
    tailwindClass: "font-akkurat",
    variants: [
      {
        id: "regular",
        label: "Regular / 400",
        className: "font-akkurat",
        description: "Default paragraphs, tables, and labels.",
      },
      {
        id: "bold",
        label: "Bold / 700",
        className: "font-akkurat font-bold",
        description: "Section headings, CTA labels, and emphasis text.",
      },
      {
        id: "light",
        label: "Light / 300",
        className: "font-akkurat-light font-light",
        description: "Secondary paragraphs, captions, and airy layouts.",
      },
      {
        id: "italic",
        label: "Italic / 400",
        className: "font-akkurat italic",
        description: "Callouts and inline emphasis.",
      },
      {
        id: "mono",
        label: "Mono / 400",
        className: "font-akkurat-mono tracking-tight",
        description: "Technical data, IDs, and monospace snippets.",
      },
    ],
  },
  {
    id: "general",
    label: "General Grotesque",
    description: "Characterful sans for editorial headlines and expressive marketing copy.",
    samples: sentenceSample,
    baseClass: "font-general",
    tailwindClass: "font-general",
    variants: [
      {
        id: "thin",
        label: "Thin / 100",
        className: "font-general font-thin tracking-[0.08em]",
        description: "Ultra-light hero statements and elegant numerals.",
      },
      {
        id: "light",
        label: "Light / 300",
        className: "font-general font-light tracking-[0.04em]",
        description: "Refined eyebrow copy and secondary headings.",
      },
      {
        id: "book",
        label: "Book / 400",
        className: "font-general font-normal",
        description: "Editorial body copy or long-form content.",
      },
      {
        id: "bold",
        label: "Bold / 700",
        className: "font-general font-bold tracking-tight",
        description: "Expressive headlines and pull quotes.",
      },
      {
        id: "bold-italic",
        label: "Bold Italic / 700",
        className: "font-general font-bold italic tracking-tight",
        description: "Dynamic emphasis inside hero callouts.",
      },
      {
        id: "mono-thin",
        label: "Mono Thin / 100",
        className: "font-general-mono font-thin tracking-[0.08em]",
        description: "Monospaced ultra-light hero lines and stats.",
      },
      {
        id: "mono-light",
        label: "Mono Light / 300",
        className: "font-general-mono font-light tracking-[0.06em]",
        description: "Lightweight monospace captions and badges.",
      },
      {
        id: "mono-book",
        label: "Mono Book / 400",
        className: "font-general-mono font-normal tracking-[0.04em]",
        description: "Editorial monospace copy and supporting notes.",
      },
      {
        id: "mono-regular",
        label: "Mono Regular / 500",
        className: "font-general-mono font-medium tracking-[0.02em]",
        description: "Default monospace body text and UI labels.",
      },
      {
        id: "mono-demi",
        label: "Mono Demi / 600",
        className: "font-general-mono font-semibold tracking-tight",
        description: "Semibold monospace for metadata callouts.",
      },
      {
        id: "mono-bold",
        label: "Mono Bold / 700",
        className: "font-general-mono font-bold tracking-tight",
        description: "Bold mono headlines and primary stats.",
      },
      {
        id: "mono-extra-bold",
        label: "Mono ExtraBold / 800",
        className: "font-general-mono font-extrabold tracking-tight",
        description: "High-impact monospace hero figures.",
      },
      {
        id: "mono-heavy",
        label: "Mono Heavy / 900",
        className: "font-general-mono font-black tracking-tight",
        description: "Maximum-weight mono for punchy overlays.",
      },
    ],
  },
  {
    id: "inter",
    label: "Inter",
    description: "System-friendly sans serif used within dashboards, tables, and app chrome for parity with Vercel surfaces.",
    samples: sentenceSample,
    baseClass: "font-inter",
    tailwindClass: "font-inter",
    variants: [
      {
        id: "inter-regular",
        label: "Regular / 400",
        className: "font-inter",
        description: "Baseline UI text and paragraphs.",
      },
      {
        id: "inter-medium",
        label: "Medium / 500",
        className: "font-inter font-medium",
        description: "Table headers, form labels, and subtle emphasis.",
      },
      {
        id: "inter-semibold",
        label: "Semibold / 600",
        className: "font-inter font-semibold",
        description: "Navigation labels and compact headings.",
      },
    ],
  },
  {
    id: "system",
    label: "System Sans",
    description: "Operating system default sans serif stack used as a fallback everywhere fonts are not explicitly loaded.",
    samples: sentenceSample,
    baseClass: "font-system",
    tailwindClass: "font-system",
    variants: [
      {
        id: "system-regular",
        label: "System Regular",
        className: "font-system",
        description: "Displays the exact fallback stack users will see if web fonts fail to load.",
      },
    ],
  },
  {
    id: "noto-emoji",
    label: "Noto Emoji",
    description: "Color emoji family for inline reactions, highlight stats, and expressive UI moments.",
    samples: ["🚀✨💡📣", "🎯✅📅🧠", "⚡️🌈🔥🌎"],
    baseClass: "font-emoji",
    tailwindClass: "font-emoji",
    variants: [
      {
        id: "emoji-light",
        label: "Light / 300",
        className: "font-emoji font-light",
        description: "Muted emoji pairings for secondary metadata.",
      },
      {
        id: "emoji-regular",
        label: "Regular / 400",
        className: "font-emoji",
        description: "Default emoji styling for paragraphs and badges.",
      },
      {
        id: "emoji-medium",
        label: "Medium / 500",
        className: "font-emoji font-medium",
        description: "Emphasized emoji markers alongside primary stats.",
      },
      {
        id: "emoji-semibold",
        label: "Semibold / 600",
        className: "font-emoji font-semibold",
        description: "High-contrast emoji for dashboards and labels.",
      },
      {
        id: "emoji-bold",
        label: "Bold / 700",
        className: "font-emoji font-bold",
        description: "Hero emoji moments in marketing or celebratory states.",
      },
    ],
  },
];

export type TypographyBreakpointToken = {
  sizeClass: string;
  pixels: string;
  rem: string;
  lineHeight: string;
};

export type TypographyToken = {
  id: string;
  label: string;
  usage: string;
  fontFamily: string;
  fontWeight: string;
  baseClass: string;
  desktop: TypographyBreakpointToken;
  mobile: TypographyBreakpointToken;
};

export const typographyScale: TypographyToken[] = [
  {
    id: "display-lg",
    label: "Display Large",
    usage: "Hero statements and marquee numbers",
    fontFamily: "General Grotesque",
    fontWeight: "Thin 100",
    baseClass: "font-general font-thin tracking-[-0.045em]",
    desktop: {
      sizeClass: "text-[6.5rem]",
      pixels: "104px",
      rem: "6.5rem",
      lineHeight: "1.05",
    },
    mobile: {
      sizeClass: "text-5xl",
      pixels: "48px",
      rem: "3rem",
      lineHeight: "1.2",
    },
  },
  {
    id: "display-md",
    label: "Display Medium",
    usage: "Large hero headlines and hero stats",
    fontFamily: "General Grotesque",
    fontWeight: "Light 300",
    baseClass: "font-general font-light tracking-[-0.035em]",
    desktop: {
      sizeClass: "text-[5rem]",
      pixels: "80px",
      rem: "5rem",
      lineHeight: "1",
    },
    mobile: {
      sizeClass: "text-4xl",
      pixels: "36px",
      rem: "2.25rem",
      lineHeight: "1.2",
    },
  },
  {
    id: "display-sm",
    label: "Display Small",
    usage: "Expressive headlines and pull quotes",
    fontFamily: "General Grotesque",
    fontWeight: "Light 300",
    baseClass: "font-general font-light tracking-[-0.03em]",
    desktop: {
      sizeClass: "text-[3.5rem]",
      pixels: "56px",
      rem: "3.5rem",
      lineHeight: "1.1",
    },
    mobile: {
      sizeClass: "text-3xl",
      pixels: "30px",
      rem: "1.875rem",
      lineHeight: "1.25",
    },
  },
  {
    id: "h1",
    label: "Heading 1",
    usage: "Primary page titles",
    fontFamily: "General Grotesque",
    fontWeight: "Light 300",
    baseClass: "font-general font-light tracking-[-0.025em]",
    desktop: {
      sizeClass: "text-[3rem]",
      pixels: "48px",
      rem: "3rem",
      lineHeight: "1.2",
    },
    mobile: {
      sizeClass: "text-2xl",
      pixels: "24px",
      rem: "1.5rem",
      lineHeight: "1.35",
    },
  },
  {
    id: "h2",
    label: "Heading 2",
    usage: "Section headings and hero supporting titles",
    fontFamily: "Akkurat Pro",
    fontWeight: "Semibold 600",
    baseClass: "font-akkurat font-semibold tracking-[-0.02em]",
    desktop: {
      sizeClass: "text-[2.25rem]",
      pixels: "36px",
      rem: "2.25rem",
      lineHeight: "1.3",
    },
    mobile: {
      sizeClass: "text-xl",
      pixels: "20px",
      rem: "1.25rem",
      lineHeight: "1.4",
    },
  },
  {
    id: "h3",
    label: "Heading 3",
    usage: "Card titles and dense section headings",
    fontFamily: "Akkurat Pro",
    fontWeight: "Semibold 600",
    baseClass: "font-akkurat font-semibold tracking-tight",
    desktop: {
      sizeClass: "text-[1.875rem]",
      pixels: "30px",
      rem: "1.875rem",
      lineHeight: "1.3",
    },
    mobile: {
      sizeClass: "text-lg",
      pixels: "18px",
      rem: "1.125rem",
      lineHeight: "1.4",
    },
  },
  {
    id: "h4",
    label: "Heading 4",
    usage: "UI headings and inline section labels",
    fontFamily: "Akkurat Pro",
    fontWeight: "Semibold 600",
    baseClass: "font-akkurat font-semibold",
    desktop: {
      sizeClass: "text-[1.5rem]",
      pixels: "24px",
      rem: "1.5rem",
      lineHeight: "1.25",
    },
    mobile: {
      sizeClass: "text-base",
      pixels: "16px",
      rem: "1rem",
      lineHeight: "1.35",
    },
  },
  {
    id: "subtitle-lg",
    label: "Subtitle Large",
    usage: "Lead-in copy beneath section headings",
    fontFamily: "Akkurat Pro",
    fontWeight: "Semibold 600",
    baseClass: "font-akkurat font-semibold tracking-tight",
    desktop: {
      sizeClass: "text-xl",
      pixels: "20px",
      rem: "1.25rem",
      lineHeight: "1.5",
    },
    mobile: {
      sizeClass: "text-base",
      pixels: "16px",
      rem: "1rem",
      lineHeight: "1.5",
    },
  },
  {
    id: "subtitle-sm",
    label: "Subtitle Small",
    usage: "Supporting sentences and UI section intros",
    fontFamily: "Akkurat Pro",
    fontWeight: "Medium 500",
    baseClass: "font-akkurat font-medium tracking-tight",
    desktop: {
      sizeClass: "text-lg",
      pixels: "18px",
      rem: "1.125rem",
      lineHeight: "1.45",
    },
    mobile: {
      sizeClass: "text-sm",
      pixels: "14px",
      rem: "0.875rem",
      lineHeight: "1.35",
    },
  },
  {
    id: "body-lg",
    label: "Body Large",
    usage: "Lead paragraphs and highlight copy",
    fontFamily: "Inter",
    fontWeight: "Regular 400",
    baseClass: "font-inter",
    desktop: {
      sizeClass: "text-lg",
      pixels: "18px",
      rem: "1.125rem",
      lineHeight: "1.7",
    },
    mobile: {
      sizeClass: "text-base",
      pixels: "16px",
      rem: "1rem",
      lineHeight: "1.5",
    },
  },
  {
    id: "body",
    label: "Body",
    usage: "Default paragraphs and UI copy",
    fontFamily: "Inter",
    fontWeight: "Regular 400",
    baseClass: "font-inter",
    desktop: {
      sizeClass: "text-base",
      pixels: "16px",
      rem: "1rem",
      lineHeight: "1.6",
    },
    mobile: {
      sizeClass: "text-sm",
      pixels: "14px",
      rem: "0.875rem",
      lineHeight: "1.4",
    },
  },
  {
    id: "body-sm",
    label: "Body Small",
    usage: "Dense UI copy and secondary text",
    fontFamily: "Inter",
    fontWeight: "Regular 400",
    baseClass: "font-inter",
    desktop: {
      sizeClass: "text-sm",
      pixels: "14px",
      rem: "0.875rem",
      lineHeight: "1.4",
    },
    mobile: {
      sizeClass: "text-xs",
      pixels: "12px",
      rem: "0.75rem",
      lineHeight: "1.2",
    },
  },
  {
    id: "caption",
    label: "Caption",
    usage: "Metadata, helper text, and supporting labels",
    fontFamily: "Inter",
    fontWeight: "Light 300",
    baseClass: "font-inter font-light",
    desktop: {
      sizeClass: "text-xs",
      pixels: "12px",
      rem: "0.75rem",
      lineHeight: "1.2",
    },
    mobile: {
      sizeClass: "text-[0.6875rem]",
      pixels: "11px",
      rem: "0.6875rem",
      lineHeight: "1.1",
    },
  },
  {
    id: "label",
    label: "Label / UI Text",
    usage: "Buttons, pills, and compact UI labels",
    fontFamily: "General Grotesque",
    fontWeight: "Mono Regular 500",
    baseClass: "font-general font-general-mono font-medium tracking-[0.04em]",
    desktop: {
      sizeClass: "text-[0.8rem]",
      pixels: "12.8px",
      rem: "0.8rem",
      lineHeight: "1.2",
    },
    mobile: {
      sizeClass: "text-[0.8rem]",
      pixels: "12.8px",
      rem: "0.8rem",
      lineHeight: "1.2",
    },
  },
];

export type ColorToken = {
  id: string;
  swatchClass: string;
  label: string;
  code: string;
  description: string;
};

export const brandColors: ColorToken[] = [
  {
    id: "brand-primary",
    swatchClass: "bg-brand-primary text-brand-inverse",
    label: "Brand Primary",
    code: "bg-brand-primary text-brand-inverse",
    description: "Core brand color for typography, large surfaces, and CTAs.",
  },
  {
    id: "brand-background",
    swatchClass: "bg-background text-foreground border border-stroke-muted",
    label: "Background",
    code: "bg-background text-foreground border-stroke-muted",
    description: "Default app canvas and page backgrounds.",
  },
  {
    id: "brand-muted",
    swatchClass: "bg-brand-muted",
    label: "Brand Muted",
    code: "bg-brand-muted",
    description: "Muted brand tone for hover states and subtle accents.",
  },
];

export const semanticColors: ColorToken[] = [
  { id: "semantic-danger", swatchClass: "bg-semantic-danger text-brand-inverse", label: "Danger", code: "bg-semantic-danger text-brand-inverse", description: "Destructive actions and errors." },
  { id: "semantic-success", swatchClass: "bg-semantic-success text-brand-inverse", label: "Success", code: "bg-semantic-success text-brand-inverse", description: "Positive confirmations." },
  { id: "semantic-warning", swatchClass: "bg-semantic-warning text-brand-inverse", label: "Warning", code: "bg-semantic-warning text-brand-inverse", description: "Caution states." },
  { id: "semantic-info", swatchClass: "bg-semantic-info text-brand-inverse", label: "Info", code: "bg-semantic-info text-brand-inverse", description: "Informational banners and badges." },
];

export const opacityScale = [
  { value: "100%", className: "opacity-100" },
  { value: "90%", className: "opacity-90" },
  { value: "80%", className: "opacity-80" },
  { value: "70%", className: "opacity-70" },
  { value: "60%", className: "opacity-60" },
  { value: "50%", className: "opacity-50" },
  { value: "40%", className: "opacity-40" },
  { value: "30%", className: "opacity-30" },
  { value: "20%", className: "opacity-20" },
  { value: "10%", className: "opacity-10" },
];

export const spacingScale = [
  { token: "0", value: "0px", pixels: 0 },
  { token: "1", value: "4px / 0.25rem", pixels: 4 },
  { token: "2", value: "8px / 0.5rem", pixels: 8 },
  { token: "3", value: "12px / 0.75rem", pixels: 12 },
  { token: "4", value: "16px / 1rem", pixels: 16 },
  { token: "5", value: "20px / 1.25rem", pixels: 20 },
  { token: "6", value: "24px / 1.5rem", pixels: 24 },
  { token: "8", value: "32px / 2rem", pixels: 32 },
  { token: "10", value: "40px / 2.5rem", pixels: 40 },
  { token: "12", value: "48px / 3rem", pixels: 48 },
  { token: "16", value: "64px / 4rem", pixels: 64 },
  { token: "20", value: "80px / 5rem", pixels: 80 },
  { token: "24", value: "96px / 6rem", pixels: 96 },
];

export const borderRadiusTokens = [
  { className: "rounded-none", label: "None", value: "0px" },
  { className: "rounded-sm", label: "Small", value: "2px" },
  { className: "rounded", label: "Default", value: "4px" },
  { className: "rounded-md", label: "Medium", value: "6px" },
  { className: "rounded-lg", label: "Large", value: "8px" },
  { className: "rounded-xl", label: "XL", value: "12px" },
  { className: "rounded-2xl", label: "2XL", value: "16px" },
  { className: "rounded-3xl", label: "3XL", value: "24px" },
  { className: "rounded-full", label: "Full", value: "9999px" },
];

export const gapTokens = [
  { className: "gap-2", label: "gap-2 (8px)", count: 3 },
  { className: "gap-4", label: "gap-4 (16px)", count: 3 },
  { className: "gap-6", label: "gap-6 (24px)", count: 3 },
  { className: "gap-8", label: "gap-8 (32px)", count: 3 },
];


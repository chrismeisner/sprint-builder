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
    description: "Secondary sans serif used as a fallback in display type and for mono/code contexts.",
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
    id: "overpass-mono",
    label: "Overpass Mono",
    description: "Primary monospace font for stats, numeric data, AI voice, status badges, and all mono-spaced UI contexts.",
    samples: sentenceSample,
    baseClass: "font-overpass-mono",
    tailwindClass: "font-overpass-mono",
    variants: [
      {
        id: "overpass-mono-light",
        label: "Light / 300",
        className: "font-overpass-mono font-light",
        description: "Lightweight mono captions and secondary labels.",
      },
      {
        id: "overpass-mono-regular",
        label: "Regular / 400",
        className: "font-overpass-mono",
        description: "Default mono body text and UI metadata.",
      },
      {
        id: "overpass-mono-medium",
        label: "Medium / 500",
        className: "font-overpass-mono font-medium",
        description: "Metric values, stat cells, and AI body copy.",
      },
      {
        id: "overpass-mono-semibold",
        label: "Semibold / 600",
        className: "font-overpass-mono font-semibold",
        description: "Status badges, section labels, and emphasized stats.",
      },
      {
        id: "overpass-mono-bold",
        label: "Bold / 700",
        className: "font-overpass-mono font-bold",
        description: "High-impact mono numerals and hero stat figures.",
      },
    ],
  },
  {
    id: "inter",
    label: "Inter",
    description: "Primary application font used for all UI, body copy, headings, and dashboard chrome.",
    samples: sentenceSample,
    baseClass: "font-inter",
    tailwindClass: "font-inter",
    variants: [
      {
        id: "inter-light",
        label: "Light / 300",
        className: "font-inter font-light",
        description: "Soft paragraphs, subtitles, and muted UI copy.",
      },
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
      {
        id: "inter-bold",
        label: "Bold / 700",
        className: "font-inter font-bold",
        description: "Primary headings, button labels, and emphasis.",
      },
      {
        id: "inter-black",
        label: "Black / 900",
        className: "font-inter font-black",
        description: "High-impact labels and dense hero moments.",
      },
    ],
  },
  {
    id: "inter-tight",
    label: "Inter Tight",
    description: "Condensed take on Inter for tight UI labels and dense nav.",
    samples: sentenceSample,
    baseClass: "font-inter-tight",
    tailwindClass: "font-inter-tight",
    variants: [
      {
        id: "inter-tight-regular",
        label: "Regular / 400",
        className: "font-inter-tight",
        description: "Default compact UI text and supporting labels.",
      },
      {
        id: "inter-tight-medium",
        label: "Medium / 500",
        className: "font-inter-tight font-medium",
        description: "Navigation labels, pills, and subtle emphasis.",
      },
      {
        id: "inter-tight-semibold",
        label: "Semibold / 600",
        className: "font-inter-tight font-semibold",
        description: "Compact headings and dense chrome treatments.",
      },
      {
        id: "inter-tight-bold",
        label: "Bold / 700",
        className: "font-inter-tight font-bold",
        description: "High-contrast condensed callouts or CTA labels.",
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
    id: "h1",
    label: "Heading 1",
    usage: "Hero headlines and marquee stats",
    fontFamily: "Inter Tight",
    fontWeight: "Black 900",
    baseClass: "font-inter-tight font-black tracking-[-0.02em]",
    mobile: {
      sizeClass: "text-[3rem]",
      pixels: "48px",
      rem: "3rem",
      lineHeight: "3.25rem",
    },
    desktop: {
      sizeClass: "text-[5rem]",
      pixels: "80px",
      rem: "5rem",
      lineHeight: "5.3rem",
    },
  },
  {
    id: "h2",
    label: "Heading 2",
    usage: "Primary page titles and hero subheads",
    fontFamily: "Inter",
    fontWeight: "Bold 700",
    baseClass: "font-inter font-bold tracking-[-0.01em]",
    mobile: {
      sizeClass: "text-[1.5rem]",
      pixels: "24px",
      rem: "1.5rem",
      lineHeight: "2rem",
    },
    desktop: {
      sizeClass: "text-[2rem]",
      pixels: "32px",
      rem: "2rem",
      lineHeight: "2.63rem",
    },
  },
  {
    id: "h3",
    label: "Heading 3",
    usage: "Section headings and card titles",
    fontFamily: "Inter",
    fontWeight: "Semibold 600",
    baseClass: "font-inter font-semibold tracking-[-0.01em]",
    mobile: {
      sizeClass: "text-[1.25rem]",
      pixels: "20px",
      rem: "1.25rem",
      lineHeight: "1.625rem",
    },
    desktop: {
      sizeClass: "text-[1.625rem]",
      pixels: "26px",
      rem: "1.625rem",
      lineHeight: "2rem",
    },
  },
  {
    id: "subtitle-lg",
    label: "Subtitle Large",
    usage: "Lead-in copy beneath headings",
    fontFamily: "Inter",
    fontWeight: "Light 300",
    baseClass: "font-inter font-light tracking-[0rem]",
    mobile: {
      sizeClass: "text-[1.125rem]",
      pixels: "18px",
      rem: "1.125rem",
      lineHeight: "1.75rem",
    },
    desktop: {
      sizeClass: "text-[1.38rem]",
      pixels: "22px",
      rem: "1.38rem",
      lineHeight: "2.13rem",
    },
  },
  {
    id: "subtitle-md",
    label: "Subtitle Medium",
    usage: "Supporting sentences and UI section intros",
    fontFamily: "Inter",
    fontWeight: "Semibold 600",
    baseClass: "font-inter font-semibold tracking-[-0.015em]",
    mobile: {
      sizeClass: "text-[1rem]",
      pixels: "16px",
      rem: "1rem",
      lineHeight: "1.35rem",
    },
    desktop: {
      sizeClass: "text-[1.25rem]",
      pixels: "20px",
      rem: "1.25rem",
      lineHeight: "1.6rem",
    },
  },
  {
    id: "subtitle-sm",
    label: "Subtitle Small",
    usage: "Dense helper copy and metadata intros",
    fontFamily: "Inter",
    fontWeight: "Medium 500",
    baseClass: "font-inter font-medium tracking-[0.01em]",
    mobile: {
      sizeClass: "text-[0.75rem]",
      pixels: "12px",
      rem: "0.75rem",
      lineHeight: "1.125rem",
    },
    desktop: {
      sizeClass: "text-[0.81rem]",
      pixels: "13px",
      rem: "0.81rem",
      lineHeight: "1.25rem",
    },
  },
  {
    id: "body-lg",
    label: "Body Large",
    usage: "Lead paragraphs and highlight copy",
    fontFamily: "Inter",
    fontWeight: "Regular 400",
    baseClass: "font-inter tracking-[-0.01em]",
    mobile: {
      sizeClass: "text-[1rem]",
      pixels: "16px",
      rem: "1rem",
      lineHeight: "1.5rem",
    },
    desktop: {
      sizeClass: "text-[1.15rem]",
      pixels: "18px",
      rem: "1.15rem",
      lineHeight: "1.72rem",
    },
  },
  {
    id: "body-md",
    label: "Body Medium",
    usage: "Default paragraphs and UI copy",
    fontFamily: "Inter",
    fontWeight: "Regular 400",
    baseClass: "font-inter tracking-[-0.01em]",
    mobile: {
      sizeClass: "text-[0.875rem]",
      pixels: "14px",
      rem: "0.875rem",
      lineHeight: "1.25rem",
    },
    desktop: {
      sizeClass: "text-[1rem]",
      pixels: "16px",
      rem: "1rem",
      lineHeight: "1.35rem",
    },
  },
  {
    id: "body-sm",
    label: "Body Small",
    usage: "Dense UI copy and captions",
    fontFamily: "Inter",
    fontWeight: "Regular 400",
    baseClass: "font-inter tracking-[0.005em]",
    mobile: {
      sizeClass: "text-[0.81rem]",
      pixels: "13px",
      rem: "0.81rem",
      lineHeight: "1rem",
    },
    desktop: {
      sizeClass: "text-[0.9rem]",
      pixels: "14px",
      rem: "0.9rem",
      lineHeight: "1.1rem",
    },
  },
  {
    id: "mono-lg",
    label: "Mono Large",
    usage: "Prominent mono stats and callouts",
    fontFamily: "Inter",
    fontWeight: "Semibold 600",
    baseClass: "font-inter font-semibold uppercase tracking-[0.02em]",
    mobile: {
      sizeClass: "text-[1rem]",
      pixels: "16px",
      rem: "1rem",
      lineHeight: "1.35rem",
    },
    desktop: {
      sizeClass: "text-[1.25rem]",
      pixels: "20px",
      rem: "1.25rem",
      lineHeight: "1.63rem",
    },
  },
  {
    id: "mono-md",
    label: "Mono Medium",
    usage: "Inline mono metadata and labels",
    fontFamily: "Inter",
    fontWeight: "Medium 500",
    baseClass: "font-inter font-medium uppercase tracking-[0.02em]",
    mobile: {
      sizeClass: "text-[0.81rem]",
      pixels: "13px",
      rem: "0.81rem",
      lineHeight: "1.125rem",
    },
    desktop: {
      sizeClass: "text-[0.94rem]",
      pixels: "15px",
      rem: "0.94rem",
      lineHeight: "1.25rem",
    },
  },
  {
    id: "mono-sm",
    label: "Mono Small",
    usage: "Compact mono labels and chips",
    fontFamily: "Inter",
    fontWeight: "Medium 500",
    baseClass: "font-inter font-medium uppercase tracking-[0.02em]",
    mobile: {
      sizeClass: "text-[0.75rem]",
      pixels: "12px",
      rem: "0.75rem",
      lineHeight: "1.125rem",
    },
    desktop: {
      sizeClass: "text-[0.81rem]",
      pixels: "13px",
      rem: "0.81rem",
      lineHeight: "1.25rem",
    },
  },
  {
    id: "button-md",
    label: "Button Medium",
    usage: "Primary button labels and pills",
    fontFamily: "Inter",
    fontWeight: "Medium 500",
    baseClass: "font-inter font-medium tracking-[0rem]",
    mobile: {
      sizeClass: "text-[0.875rem]",
      pixels: "14px",
      rem: "0.875rem",
      lineHeight: "1.38rem",
    },
    desktop: {
      sizeClass: "text-[0.94rem]",
      pixels: "15px",
      rem: "0.94rem",
      lineHeight: "1.5rem",
    },
  },
  {
    id: "button-sm",
    label: "Button Small",
    usage: "Compact button labels and chips",
    fontFamily: "Inter",
    fontWeight: "Medium 500",
    baseClass: "font-inter font-medium tracking-[0rem]",
    mobile: {
      sizeClass: "text-[0.81rem]",
      pixels: "13px",
      rem: "0.81rem",
      lineHeight: "1.25rem",
    },
    desktop: {
      sizeClass: "text-[0.88rem]",
      pixels: "14px",
      rem: "0.88rem",
      lineHeight: "1.38rem",
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
  // ── Base ──────────────────────────────────────────────────────────────────
  {
    id: "background",
    swatchClass: "bg-background text-foreground border border-stroke-muted",
    label: "background",
    code: "bg-background",
    description: "Default app canvas. Light: gray/50. Dark: gray/950.",
  },
  {
    id: "foreground",
    swatchClass: "bg-foreground text-background",
    label: "foreground",
    code: "bg-foreground",
    description: "Inverse of background. Light: gray/950. Dark: gray/50.",
  },
  // ── Brand / Primary ───────────────────────────────────────────────────────
  {
    id: "brand-primary",
    swatchClass: "bg-brand-primary text-brand-inverse",
    label: "brand/primary",
    code: "bg-brand-primary",
    description: "Core brand color for headings and CTAs.",
  },
  {
    id: "brand-inverse",
    swatchClass: "bg-brand-inverse text-brand-primary border border-stroke-muted",
    label: "brand/inverse",
    code: "bg-brand-inverse",
    description: "Inverse of brand/primary. Light: white. Dark: black.",
  },
  // ── Brand / Green scale ───────────────────────────────────────────────────
  {
    id: "brand-green",
    swatchClass: "bg-brand-green text-white",
    label: "brand/green",
    code: "bg-brand-green",
    description: "Primary brand green. Light: green/600. Dark: green/400.",
  },
  {
    id: "brand-green-subtle",
    swatchClass: "bg-brand-green-subtle border border-stroke-muted",
    label: "brand/green-subtle",
    code: "bg-brand-green-subtle",
    description: "Tinted green surface. Light: green/50. Dark: green/950.",
  },
  {
    id: "brand-green-muted",
    swatchClass: "bg-brand-green-muted border border-stroke-muted",
    label: "brand/green-muted",
    code: "bg-brand-green-muted",
    description: "Muted green fill. Light: green/100. Dark: green/900.",
  },
  {
    id: "brand-green-emphasis",
    swatchClass: "bg-brand-green-emphasis text-white",
    label: "brand/green-emphasis",
    code: "bg-brand-green-emphasis",
    description: "Stronger green for active states. Light: green/700. Dark: green/300.",
  },
  // ── Brand / Blue scale ────────────────────────────────────────────────────
  {
    id: "brand-blue",
    swatchClass: "bg-brand-blue text-white",
    label: "brand/blue",
    code: "bg-brand-blue",
    description: "Primary brand blue. Light: blue/600. Dark: blue/300.",
  },
  {
    id: "brand-blue-subtle",
    swatchClass: "bg-brand-blue-subtle border border-stroke-muted",
    label: "brand/blue-subtle",
    code: "bg-brand-blue-subtle",
    description: "Tinted blue surface. Light: blue/50. Dark: blue/900.",
  },
  {
    id: "brand-blue-muted",
    swatchClass: "bg-brand-blue-muted border border-stroke-muted",
    label: "brand/blue-muted",
    code: "bg-brand-blue-muted",
    description: "Muted blue fill. Light: blue/100. Dark: blue/800.",
  },
  {
    id: "brand-blue-emphasis",
    swatchClass: "bg-brand-blue-emphasis text-white",
    label: "brand/blue-emphasis",
    code: "bg-brand-blue-emphasis",
    description: "Stronger blue for active states. Light: blue/700. Dark: blue/300.",
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


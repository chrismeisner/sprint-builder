/**
 * Typography Data - Single Source of Truth
 * 
 * This file defines all typography styles for the styleguide.
 * Both fonts.html and typography-styles.css are generated from this data.
 * 
 * To update typography:
 * 1. Edit the values in this file
 * 2. Run: node generate-typography-css.js
 * 3. Changes will automatically apply to all pages
 */

export const fontFamilies = [
  {
    name: "Acme Gothic Condensed",
    css: "var(--font-family-acme)",
    variable: "--font-family-acme",
    weights: [600],
    sample: "CONDENSED PUNCH FOR HERO HEADLINES",
    sampleTransform: "uppercase",
    blurb: "Tall, condensed display face with strong presence. Always use in ALL CAPS.",
    references: "Local font: Acme Gothic Condensed Semi Bold.",
    bestFor: "Hero H1 headlines and bold marketing statements.",
    resourceUrl: "fonts/Acme-Gothic-Condensed-Semi-Bold.otf",
    secondaryResourceUrl: "https://fonts.adobe.com/fonts/acme-gothic",
    isDownload: true
  },
  {
    name: "Special Gothic Condensed One",
    css: "var(--font-family-special)",
    variable: "--font-family-special",
    weights: [400],
    sample: "BOLD CONDENSED DISPLAY FOR SLIDES",
    sampleTransform: "uppercase",
    blurb: "Strong condensed display face for Google Slides. Great Acme Gothic alternative.",
    references: "Local font: Special Gothic Condensed One Regular.",
    bestFor: "Headlines in Google Slides presentations where Acme Gothic isn't available.",
    resourceUrl: "fonts/SpecialGothicCondensedOne-Regular.ttf",
    secondaryResourceUrl: "https://fonts.google.com/specimen/Special+Gothic+Condensed+One",
    isDownload: true
  },
  {
    name: "Inter",
    css: "var(--font-family-sans)",
    variable: "--font-family-sans",
    weights: [300, 400, 500, 600, 700, 800],
    sample: "The quick brown fox jumps over the lazy dog.",
    blurb: "Neutral, highly readable sans-serif with a modern UI feel.",
    references: "Google Fonts: Inter.",
    bestFor: "Body text, UI copy, buttons, labels, and general-purpose headings.",
    resourceUrl: "https://rsms.me/inter/download/"
  },
  {
    name: "Inter Tight",
    css: "var(--font-family-tight)",
    variable: "--font-family-tight",
    weights: [300, 400, 500, 600, 700, 800],
    sample: "Inter Tight — slightly more compact for headlines.",
    blurb: "A tighter-width companion to Inter for punchier display copy.",
    references: "Google Fonts: Inter Tight.",
    bestFor: "Hero headlines, section titles, and compact headings.",
    resourceUrl: "https://fonts.google.com/specimen/Inter+Tight"
  }
];

export const typeCatalog = [
  {
    title: "Headings",
    items: [
      { 
        name: "H1", 
        sizeDesktop: "60px", 
        sizeMobile: "52px", 
        lineHeight: 1, 
        lineHeightMobile: 1, 
        weight: 600, 
        letterSpacing: "0em", 
        sample: "HEADING 1 — PAGE TITLE", 
        usage: "Page / document title", 
        fontFamily: "var(--font-family-acme)", 
        transform: "uppercase" 
      },
      { 
        name: "H2", 
        sizeDesktop: "48px", 
        sizeMobile: "40px", 
        lineHeight: 1, 
        lineHeightMobile: 1, 
        weight: 600, 
        letterSpacing: "0em", 
        sample: "HEADING 2 — SECTION HEADING", 
        usage: "Section heading", 
        fontFamily: "var(--font-family-acme)", 
        transform: "uppercase" 
      },
      { 
        name: "H3", 
        sizeDesktop: "22px", 
        sizeMobile: "20px", 
        lineHeight: 1.25, 
        lineHeightMobile: 1.25, 
        weight: 600, 
        letterSpacing: "0em", 
        sample: "Heading 3 — Subsection heading", 
        usage: "Subsection heading", 
        fontFamily: "var(--font-family-tight)" 
      }
    ]
  },
  {
    title: "Subheadings",
    items: [
      { 
        name: "H4", 
        sizeDesktop: "18px", 
        sizeMobile: "16px", 
        lineHeight: 1.33, 
        lineHeightMobile: 1.33, 
        weight: 500, 
        letterSpacing: "-0.2px", 
        sample: "H4 — Prominent subheading", 
        usage: "Prominent subheading", 
        fontFamily: "var(--font-family-sans)" 
      },
      { 
        name: "Subtitle", 
        sizeDesktop: "20px", 
        sizeMobile: "16px", 
        lineHeight: 1.33, 
        lineHeightMobile: 1.33, 
        weight: 400, 
        letterSpacing: "-0.1px", 
        sample: "Subtitle — Standard subheading", 
        usage: "Standard subheading", 
        fontFamily: "var(--font-family-sans)" 
      },
      { 
        name: "Overline", 
        sizeDesktop: "14px", 
        sizeMobile: "13px", 
        lineHeight: 1.5, 
        lineHeightMobile: 1.5, 
        weight: 500, 
        letterSpacing: "0.3px", 
        sample: "OVERLINE — SECTION LABEL", 
        usage: "Optional; section labels / metadata", 
        fontFamily: "var(--font-family-sans)", 
        transform: "uppercase" 
      }
    ]
  },
  {
    title: "Body",
    items: [
      { 
        name: "Body / L", 
        sizeDesktop: "20px", 
        sizeMobile: "16px", 
        lineHeight: 1.3, 
        lineHeightMobile: 1.33, 
        weight: 400, 
        letterSpacing: "-0.2px", 
        sample: "When your teen starts driving, everything changes. Miles helps families stay calm, informed, and prepared — without constant check-ins or invasive tracking.", 
        usage: "Intro / lead text", 
        fontFamily: "var(--font-family-sans)" 
      },
      { 
        name: "Body / M", 
        sizeDesktop: "16px", 
        sizeMobile: "14px", 
        lineHeight: 1.5, 
        lineHeightMobile: 1.4, 
        weight: 400, 
        letterSpacing: "-0.015em", 
        sample: "Body Medium — Default body text", 
        usage: "Default body text", 
        fontFamily: "var(--font-family-sans)" 
      },
      { 
        name: "Body / M Bold", 
        sizeDesktop: "16px", 
        sizeMobile: "14px", 
        lineHeight: 1.4, 
        lineHeightMobile: 1.4, 
        weight: 600, 
        letterSpacing: "-0.015em", 
        sample: "Body Medium Bold — Emphasis text", 
        usage: "Emphasis within body copy", 
        fontFamily: "var(--font-family-sans)" 
      },
      { 
        name: "Body / S", 
        sizeDesktop: "14px", 
        sizeMobile: "13px", 
        lineHeight: 1.35, 
        lineHeightMobile: 1.35, 
        weight: 400, 
        letterSpacing: "-0.005em", 
        sample: "Body Small — Secondary or dense content", 
        usage: "Secondary or dense content", 
        fontFamily: "var(--font-family-sans)" 
      },
      { 
        name: "Body / S Bold", 
        sizeDesktop: "14px", 
        sizeMobile: "13px", 
        lineHeight: 1.35, 
        lineHeightMobile: 1.35, 
        weight: 600, 
        letterSpacing: "-0.005em", 
        sample: "Body Small Bold — Compact emphasis", 
        usage: "Emphasis in dense content", 
        fontFamily: "var(--font-family-sans)" 
      },
      { 
        name: "Caption", 
        sizeDesktop: "12px", 
        sizeMobile: "12px", 
        lineHeight: 1.5, 
        lineHeightMobile: 1.5, 
        weight: 500, 
        letterSpacing: "0.01em", 
        sample: "Caption — Helper text or footnotes", 
        usage: "Captions, helper text, footnotes", 
        fontFamily: "var(--font-family-sans)" 
      }
    ]
  },
  {
    title: "UI Text",
    items: [
      { 
        name: "Label", 
        sizeDesktop: "13px", 
        sizeMobile: "11px", 
        lineHeight: 1.33, 
        lineHeightMobile: 1.33, 
        weight: 400, 
        letterSpacing: "0.01em", 
        sample: "Label — Form labels and table headers", 
        usage: "Form labels, table headers", 
        fontFamily: "var(--font-family-sans)" 
      },
      { 
        name: "Button", 
        sizeDesktop: "16px", 
        sizeMobile: "15px", 
        lineHeight: 1.5, 
        lineHeightMobile: 1.5, 
        weight: 400, 
        letterSpacing: "-0.015em", 
        sample: "Button — Primary CTA", 
        usage: "Primary button text", 
        fontFamily: "var(--font-family-sans)" 
      }
    ]
  },
  {
    title: "Technical",
    items: []
  }
];

export const familyLabels = new Map([
  ["var(--font-family-acme)", "Acme Gothic Condensed"],
  ["var(--font-family-tight)", "Inter Tight"],
  ["var(--font-family-mono)", "Mono"],
  ["var(--font-family-sans)", "Inter"]
]);

export const familyValueByVar = new Map([
  ["var(--font-family-acme)", `"Acme Gothic Condensed","Inter Tight","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif`],
  ["var(--font-family-tight)", `"Inter Tight","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif`],
  ["var(--font-family-sans)", `"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif`],
  ["var(--font-family-mono)", `ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace`]
]);

// Google Slides-safe font alternatives
export const googleSlidesAlternatives = new Map([
  ["var(--font-family-acme)", { name: "Special Gothic Condensed One", css: "'Special Gothic Condensed One', sans-serif", notes: "Condensed display font available in Google Slides", weight: 400 }],
  ["var(--font-family-special)", { name: "Special Gothic Condensed One", css: "'Special Gothic Condensed One', sans-serif", notes: "Condensed display font available in Google Slides", weight: 400 }],
  ["var(--font-family-tight)", { name: "Inter", css: "'Inter', sans-serif", notes: "Available in Google Slides" }],
  ["var(--font-family-sans)", { name: "Inter", css: "'Inter', sans-serif", notes: "Available in Google Slides" }],
  ["var(--font-family-mono)", { name: "Roboto Mono", css: "'Roboto Mono', monospace", notes: "Monospace font available in Google Slides" }]
]);

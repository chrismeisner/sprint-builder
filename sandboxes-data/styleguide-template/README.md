# Brand Styleguide Template

A clean, customizable brand styleguide template using standard defaults.

## Quick Start

1. **Add your placeholder assets** to the `images/` folder:
   - `logo-placeholder.svg` — Vector logo (scalable)
   - `logo-placeholder.png` — Raster logo (400×400px recommended)
   - `image-placeholder.jpg` — Photo placeholder (1200×800px, 3:2 ratio)

2. **Customize colors** in `tokens.css`:
   - Replace Tailwind Indigo with your primary brand color
   - Replace Tailwind Amber with your secondary brand color
   - Replace Tailwind Cyan with your tertiary/accent color
   - Adjust neutrals if needed (defaults to Tailwind Slate)

3. **Update branding**:
   - Replace "Brand Styleguide" text throughout
   - Update the footer in `index.html`
   - Customize changelog entries in `changelog.json`

## File Structure

```
styleguide-template/
├── index.html          # Landing page / hub
├── colors.html         # Color palette viewer
├── fonts.html          # Typography scale
├── logo-style.html     # Logo assets & guidelines
├── image-style.html    # Photography direction
├── style-tiles.html    # Layout mockups
├── changelog.html      # Version history
├── changelog.json      # Changelog data
├── tokens.css          # Design tokens (colors, fonts, etc.)
├── base.css            # Shared UI styles
├── sidebar-nav.css     # Navigation styles
├── sidebar-nav.js      # Navigation component
├── images/             # Asset folder
│   ├── logo-placeholder.svg
│   ├── logo-placeholder.png
│   └── image-placeholder.jpg
└── fonts/              # Custom fonts (if needed)
```

## Defaults

- **Colors**: Tailwind CSS defaults (Indigo, Amber, Cyan, Slate)
- **Typography**: Inter (Google Fonts) for all text
- **Border radius**: 12px default, 6px small, 16px large
- **Shadows**: Subtle, modern shadows

## Customization Tips

### Colors
Edit `tokens.css` to replace the color scales. Each color has 11 stops (50-950) following Tailwind conventions:
- 50-200: Light backgrounds, subtle accents
- 300-400: Borders, secondary text
- 500: Default / primary use
- 600-700: Hover states, emphasis
- 800-950: Dark backgrounds, primary text

### Typography
The template uses Inter for everything. To add custom fonts:
1. Add font files to `fonts/` folder
2. Add `@font-face` declarations in `tokens.css`
3. Update `--font-family-display` and other variables
4. Update `fonts.html` to document the font

### Adding Pages
Copy any existing HTML page and modify. Include these in `<head>`:
```html
<link rel="stylesheet" href="tokens.css" />
<link rel="stylesheet" href="base.css" />
<link rel="stylesheet" href="sidebar-nav.css" />
```

And this before `</body>`:
```html
<script src="sidebar-nav.js"></script>
```

## Placeholder Assets Needed

| File | Dimensions | Format | Purpose |
|------|-----------|--------|---------|
| `logo-placeholder.svg` | Scalable | SVG | Vector logo for web |
| `logo-placeholder.png` | 400×400px | PNG | Raster logo @2x |
| `image-placeholder.jpg` | 1200×800px | JPEG | Photo placeholder |

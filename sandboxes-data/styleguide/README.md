# Styleguide (1-page HTML version)

This folder contains a **simple, static styleguide** now backed by a minimal Tailwind build so we can author with utilities while keeping the output easy to open.

## Goals / constraints

- Each page remains a single HTML file (content + structure in one place).
- Tailwind is compiled once to `dist/tailwind.css` and shared so files still open locally.
- Keep the toolchain minimal: Tailwind CLI + PostCSS (no frameworks).

## What’s in here

- `colors.html`: Color palette reference.
- `fonts.html`: Font styles/typography reference.

## How to view

- `dist/tailwind.css` is checked in; you can double-click an HTML file and it will work.
- Optional: serve the folder with any static file server if you want clean URLs, but it’s not required.

## Tailwind build

1) Install deps: `npm install`
2) Develop/watch: `npm run dev` (writes `dist/tailwind.css`)
3) Production build: `npm run build`
4) Preview built assets: `npm run preview` (simple static server)

`tailwind.config.js` scans `./*.html`; add new HTML files to the root or update the config if you nest them.

## Editing notes

- If you add new sections, keep them **self-contained** within the same HTML file.
- If you need shared styles later, we can revisit extracting CSS/JS—but for now the intent is **single-file simplicity**.



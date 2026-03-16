# Figma Variables Guide — Miles Proto 2

A checklist of every variable to create in Figma to match the live app.
Organized into **Collections** (how Figma groups variables).
Reference file: `MILES-UI` → Variables panel.

---

## How to set this up in Figma

1. Open the `MILES-UI` file
2. Right-click any frame → **Edit** → **Local variables** (or menu: **Resources → Local variables**)
3. Click **+** to create a collection, then add variables one by one
4. For semantic colors: create **two modes** on the collection — `Light` and `Dark`

---

## Collection 1 — Primitives (no modes)

Raw palette values. These are the building blocks; semantic tokens reference these.

### Colors

| Variable name              | Value     | Notes                  |
|----------------------------|-----------|------------------------|
| `color/neutral/50`         | `#fafafa` | Page bg (light)        |
| `color/neutral/100`        | `#f5f5f5` | Surface subtle         |
| `color/neutral/200`        | `#e5e5e5` | Card borders           |
| `color/neutral/300`        | `#d4d4d4` | Stroke strong          |
| `color/neutral/400`        | `#a3a3a3` | Muted text             |
| `color/neutral/500`        | `#737373` | Secondary text         |
| `color/neutral/700`        | `#404040` | Medium text            |
| `color/neutral/800`        | `#262626` | Dark surface           |
| `color/neutral/900`        | `#171717` | Darker surface         |
| `color/neutral/950`        | `#0a0a0a` | Page bg (dark)         |
| `color/green/accent-light` | `#03c76a` | Brand accent (light)   |
| `color/green/accent-dark`  | `#03ff7f` | Brand accent (dark)    |
| `color/green/500`          | `#22c55e` | Status dot (good)      |
| `color/green/600`          | `#16a34a` | Avatar bg, CTA buttons |
| `color/green/700`          | `#15803d` | Button hover           |
| `color/green/50`           | `#f0fdf4` | Coaching card bg       |
| `color/green/100`          | `#dcfce7` | Live badge bg          |
| `color/green/200`          | `#bbf7d0` | Coaching card border   |
| `color/green/800`          | `#166534` | Coaching card text     |
| `color/amber/500`          | `#f59e0b` | Status dot (attention) |
| `color/amber/700`          | `#b45309` | Fuel/engine warning    |
| `color/blue/600`           | `#2563eb` | Links ("See all")      |
| `color/white`              | `#ffffff` | White                  |
| `color/black`              | `#000000` | Black                  |

---

## Collection 2 — Semantic (2 modes: Light / Dark)

These are the variables your components should actually use.
Create **Light** and **Dark** modes on this collection.

| Variable name              | Light value           | Dark value            | Used on dashboard for…             |
|----------------------------|-----------------------|-----------------------|------------------------------------|
| `background`               | `#fafafa` (n-50)      | `#0a0a0a` (n-950)     | Page background                    |
| `surface/card`             | `#ffffff`             | `#0a0a0a`             | Vehicle cards, trip list bg        |
| `surface/subtle`           | `#f5f5f5` (n-100)     | `#171717` (n-900)     | Bento stat cells                   |
| `surface/strong`           | `#e5e5e5` (n-200)     | `#262626` (n-800)     | —                                  |
| `text/primary`             | `#0a0a0a` (n-950)     | `#f5f5f5` (n-100)     | Headings, vehicle names            |
| `text/secondary`           | `#404040` (n-700)     | `#d4d4d4` (n-300)     | Sub-labels, metadata               |
| `text/muted`               | `#737373` (n-500)     | `#a3a3a3` (n-400)     | Section labels, helper text        |
| `text/inverse`             | `#fafafa` (n-50)      | `#0a0a0a` (n-950)     | Text on dark backgrounds           |
| `stroke/muted`             | `#e5e5e5` (n-200)     | `#262626` (n-800)     | Card borders, dividers             |
| `stroke/strong`            | `#d4d4d4` (n-300)     | `#404040` (n-700)     | Stronger borders                   |
| `brand/accent`             | `#03c76a`             | `#03ff7f`             | Brand green                        |
| `semantic/success`         | `#16a34a`             | `#4ade80`             | Good status dots, avatar bg        |
| `semantic/warning`         | `#ca8a04`             | `#facc15`             | Fuel/attention status              |
| `semantic/info`            | `#2563eb`             | `#93c5fd`             | Links                              |
| `semantic/danger`          | `#dc2626`             | `#f87171`             | Roadside assist icon, errors       |

---

## Collection 3 — Sizing (no modes)

### Spacing

| Variable name    | Value  | Tailwind equiv | Used for…                      |
|------------------|--------|----------------|--------------------------------|
| `spacing/1`      | `4px`  | `gap-1`        | Tight icon/label gaps          |
| `spacing/2`      | `8px`  | `gap-2`        | Bento stat internal gap        |
| `spacing/3`      | `12px` | `gap-3`        | Card internal gaps             |
| `spacing/4`      | `16px` | `gap-4`        | Section vertical gap           |
| `spacing/5`      | `20px` | `px-5`         | **Page horizontal padding**    |
| `spacing/6`      | `24px` | `gap-6`        | Larger section gaps            |
| `spacing/gutter` | `24px` | `gutter`       | Named gutter token             |
| `spacing/page`   | `40px` | `page`         | Named page padding token       |

### Border Radius

| Variable name      | Value    | Tailwind equiv  | Used for…                           |
|--------------------|----------|-----------------|-------------------------------------|
| `radius/lg`        | `8px`    | `rounded-lg`    | Proto control buttons               |
| `radius/xl`        | `12px`   | `rounded-xl`    | Inner cards, bento cells, trip rows |
| `radius/2xl`       | `16px`   | `rounded-2xl`   | Vehicle cards, fleet map            |
| `radius/full`      | `9999px` | `rounded-full`  | Avatars, pills, live badge          |

---

## Collection 4 — Typography (no modes)

Figma doesn't have "text style variables" in the same way — use **Text Styles** instead.
Create these as **local text styles** in the `MILES-UI` file:

| Style name              | Size  | Weight    | Leading | Tracking  | Used for…                       |
|-------------------------|-------|-----------|---------|-----------|----------------------------------|
| `heading/page`          | 24px  | Bold 700  | 32px    | –         | "Miles" dashboard title          |
| `heading/card`          | 16px  | Semibold 600 | 22px | –         | Vehicle names, section titles    |
| `label/section`         | 10px  | Semibold 600 | auto  | 0.08em    | "VEHICLES", "RECENT TRIPS" etc.  |
| `label/meta`            | 11px  | Normal 400 | auto   | –         | "Parked just now", timestamps    |
| `body/sm`               | 12px  | Normal 400 | 16px   | –         | Trip metadata, helper text       |
| `body/md`               | 14px  | Normal 400 | 20px   | –         | Coaching card text               |
| `stat/value`            | 14px  | Semibold 600 | 18px | –         | Score, fuel %, engine status     |
| `stat/label`            | 10px  | Medium 500 | auto  | 0.06em    | "Miles Score", "Engine", "Fuel"  |
| `display/speed`         | 36px  | Bold 700  | 36px    | –         | Live speed number (trip mode)    |

---

## Priority order (start here)

If you're setting this up from scratch, do it in this order:

- [ ] **Collection 2 — Semantic colors** with Light + Dark modes (most impactful)
- [ ] **Text styles** — section labels, body, stats (second most-used)
- [ ] **Collection 3 — Sizing** — radius and spacing (needed for auto-layout)
- [ ] **Collection 1 — Primitives** — raw palette (fill in as references for semantic)

---

## Sync workflow (how to keep this in sync with code)

```
Figma variables (Tokens Studio plugin)
         ↕  sync via GitHub
lib/design-system/tokens/*.json   ← source of truth in this repo
         ↕  transform
npx style-dictionary build --config style-dictionary.config.mjs
         ↓
app/generated-tokens.css          ← imported in globals.css
```

**Files in this repo:**
- `lib/design-system/tokens/primitives.json` — raw palette
- `lib/design-system/tokens/semantic-light.json` — light mode values
- `lib/design-system/tokens/semantic-dark.json` — dark mode values
- `lib/design-system/tokens/sizing.json` — spacing + radius
- `style-dictionary.config.mjs` — build config

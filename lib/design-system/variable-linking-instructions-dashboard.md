# Variable Linking Instructions — Dashboard

**Figma file:** https://www.figma.com/design/qKYE97X2HNSc1djTmxs2G9
**Source:** `app/sandboxes/miles-proto-2/dashboard/page.tsx`
**Captures:** Page 1 = Light mode · Page 2 = Dark mode (node-id 3-2)

> **Designer note — do this first:**
> 1. Select every text layer and apply the matching **Miles/\*** text style (e.g. `Miles/Title 1`, `Miles/Body`, `Miles/Caption`). Text styles carry font-family, size, weight, and line-height in one click.
> 2. After linking all variables, **toggle Light ↔ Dark** (swap the semantic collection mode) and spot-check that every fill, surface, and stroke updates correctly. Anything that stays hardcoded is a missed variable.

Variable format — `collection → path`

---

## Page Shell

| Layer | Property | Variable |
|---|---|---|
| `main` wrapper | Fill (background) | `semantic → background` |
| `main` wrapper | Padding top / bottom | `sizing → spacing/page` |

---

## Sticky Compact Nav Bar
*Visible once the "Miles" h1 scrolls out of view.*

| Layer | Property | Variable |
|---|---|---|
| `header` bar | Fill | `semantic → background` |
| `header` bar | Fill opacity | `sizing → opacity/80` |
| `header` bar | Border bottom color | `semantic → stroke/muted` |
| `"Miles"` title text | Fill | `semantic → text/primary` |
| `"Miles"` title text | Font size | `typography → fontSizes/base` |
| `"Miles"` title text | Font weight | `typography → fontWeights/semibold` |

---

## Dashboard Header

| Layer | Property | Variable |
|---|---|---|
| `h1 "Miles"` | Fill | `semantic → text/primary` |
| `h1 "Miles"` | Font size | `typography → fontSizes/3xl` |
| `h1 "Miles"` | Font weight | `typography → fontWeights/bold` |
| Roadside button | Fill | `semantic → surface/card` |
| Roadside button | Stroke | `semantic → stroke/muted` |
| Roadside button | Corner radius | `sizing → borderRadius/pill` |
| Roadside warning icon | Fill | `semantic → semantic/danger` |
| Avatar pill (profile) | Fill on hover | `semantic → surface/strong` |
| Avatar pill | Corner radius | `sizing → borderRadius/pill` |
| `"Christina M."` label | Fill | `semantic → text/secondary` |
| `"Christina M."` label | Font size | `typography → fontSizes/sm` |
| `"Christina M."` label | Font weight | `typography → fontWeights/medium` |

---

## Fleet Map

| Layer | Property | Variable |
|---|---|---|
| Map container | Stroke | `semantic → stroke/muted` |
| Map container | Corner radius | `sizing → borderRadius/card` |
| Map container | Shadow | `sizing → boxShadow/card` |
| Map container | Margin left/right | `sizing → spacing/5` |

---

## Vehicles Section Header

| Layer | Property | Variable |
|---|---|---|
| `"VEHICLES"` label | Fill | `semantic → text/muted` |
| `"VEHICLES"` label | Font size | `typography → fontSizes/xs` |
| `"VEHICLES"` label | Font weight | `typography → fontWeights/semibold` |
| `"VEHICLES"` label | Letter spacing | `typography → letterSpacings/caps` |
| `"Collapse"` / `"Expand"` button | Fill | `semantic → semantic/info` |
| `"Collapse"` / `"Expand"` button | Font size | `typography → fontSizes/xs` |
| `"Collapse"` / `"Expand"` button | Font weight | `typography → fontWeights/medium` |

---

## Vehicle Card — Container

| Layer | Property | Variable |
|---|---|---|
| Card `div` | Fill | `semantic → surface/card` |
| Card `div` | Stroke | `semantic → stroke/muted` |
| Card `div` | Corner radius | `sizing → borderRadius/card` |
| Gap between cards | Gap | `sizing → spacing/3` |

---

## Vehicle Card — Default Header
*Name left, car image right (full/expanded variant)*

| Layer | Property | Variable |
|---|---|---|
| Vehicle name `"CIVIC"` / `"RAV4"` | Fill | `semantic → text/primary` |
| Vehicle name | Font size | `typography → fontSizes/2xl` |
| Vehicle name | Font weight | `typography → fontWeights/semibold` |
| Vehicle name | Letter spacing | `typography → letterSpacings/ui` |
| Location icon `svg` | Fill | `semantic → text/muted` |
| Location label | Fill | `semantic → text/muted` |
| Location label | Font size | `typography → fontSizes/sm` |
| Chevron icon | Fill | `semantic → text/muted` |

### StatusBadge — Parked

| Layer | Property | Variable |
|---|---|---|
| `"PARKED"` pill | Fill | `semantic → semantic/info` |
| `"PARKED"` pill | Corner radius | `sizing → borderRadius/pill` |
| `"PARKED"` text | Fill | `semantic → background` |
| `"PARKED"` text | Font size | `typography → fontSizes/xs` |
| `"PARKED"` text | Font weight | `typography → fontWeights/semibold` |
| `"PARKED"` text | Letter spacing | `typography → letterSpacings/caps` |

### StatusBadge — Driving

| Layer | Property | Variable |
|---|---|---|
| `"DRIVING"` pill | Fill | `semantic → semantic/success` |
| `"DRIVING"` pill | Corner radius | `sizing → borderRadius/pill` |
| `"DRIVING"` text | Fill | `semantic → background` |
| Ping dot (outer) | Fill | `semantic → background` |
| Ping dot (inner) | Fill | `semantic → background` |

---

## StatsBento — Score / Engine / Fuel Cells

| Layer | Property | Variable |
|---|---|---|
| Each cell `div` | Fill | `semantic → surface/subtle` |
| Each cell `div` | Corner radius | `sizing → borderRadius/control` |
| Cell label `"Score"` / `"Engine"` / `"Fuel"` | Fill | `semantic → text/muted` |
| Cell label | Font size | `typography → fontSizes/xs` |
| Cell label | Font weight | `typography → fontWeights/medium` |
| Score value (good) | Fill | `semantic → semantic/success` |
| Score value | Font size | `typography → fontSizes/sm` |
| Score value | Font weight | `typography → fontWeights/semibold` |
| Score status dot (good) | Fill | `semantic → semantic/success` |
| Score delta `+N` (up) | Fill | `semantic → semantic/success` |
| Score delta `−N` (down) | Fill | `semantic → semantic/warning` |
| Score arrow icon (up) | Fill | `semantic → semantic/success` |
| Score arrow icon (down) | Fill | `semantic → semantic/warning` |
| Engine value `"Good"` | Fill | `semantic → semantic/success` |
| Engine value `"Attention"` | Fill | `semantic → semantic/warning` |
| Engine value | Font size | `typography → fontSizes/sm` |
| Engine value | Font weight | `typography → fontWeights/semibold` |
| Engine dot (good) | Fill | `semantic → semantic/success` |
| Engine dot (attention) | Fill | `semantic → semantic/warning` |
| Engine checked-at `"10m ago"` | Fill | `semantic → text/muted` |
| Engine checked-at | Font size | `typography → fontSizes/xs` |
| Fuel value (≥30%) | Fill | `semantic → text/secondary` |
| Fuel value (<30%) | Fill | `semantic → semantic/warning` |
| Fuel dot (≥30%) | Fill | `semantic → semantic/success` |
| Fuel dot (<30%) | Fill | `semantic → semantic/warning` |
| Fuel range `"~230 mi range"` | Fill | `semantic → text/muted` |
| Fuel range | Font size | `typography → fontSizes/xs` |

---

## DriverStrip (Live Trip Row)
*Inside RAV4 card when a trip is in progress*

| Layer | Property | Variable |
|---|---|---|
| Strip container | Fill | `semantic → surface/subtle` |
| Strip container | Stroke | `semantic → stroke/muted` |
| Strip container | Corner radius | `sizing → borderRadius/panel` |
| Strip container | Margin left/right | `sizing → spacing/4` |
| Avatar circle (initials fallback) | Fill | `semantic → semantic/success` |
| Avatar initials text | Fill | `semantic → background` |
| `"Jack is driving"` | Fill | `semantic → semantic/success` |
| `"Jack is driving"` | Font size | `typography → fontSizes/sm` |
| `"Jack is driving"` | Font weight | `typography → fontWeights/semibold` |
| Started-ago `"12 mins ago"` | Fill | `semantic → semantic/success` |
| Started-ago | Font size | `typography → fontSizes/xs` |
| Speed value `"34"` | Fill | `semantic → semantic/success` |
| Speed value | Font size | `typography → fontSizes/lg` |
| Speed value | Font weight | `typography → fontWeights/bold` |
| `"mph"` label | Fill | `semantic → semantic/success` |
| Chevron icon | Fill | `semantic → semantic/success` |

---

## Coaching Carousel

| Layer | Property | Variable |
|---|---|---|
| `"FROM MILES"` label | Fill | `semantic → text/muted` |
| `"FROM MILES"` label | Font size | `typography → fontSizes/xs` |
| `"FROM MILES"` label | Font weight | `typography → fontWeights/medium` |
| `"FROM MILES"` label | Letter spacing | `typography → letterSpacings/caps` |

### AgentCoachingCard

| Layer | Property | Variable |
|---|---|---|
| Card container | Fill | `semantic → surface/card` |
| Card container | Stroke | `semantic → stroke/muted` |
| Card container | Corner radius | `sizing → borderRadius/panel` |
| Card container | Shadow | `sizing → boxShadow/card` |
| Miles avatar circle | Fill | `semantic → surface/strong` |
| Dismiss `×` button (default) | Fill | `semantic → text/muted` |
| Dismiss `×` button (hover) | Fill | `semantic → surface/strong` |
| Message `p` text | Fill | `semantic → text/secondary` |
| Message `p` text | Font size | `typography → fontSizes/sm` |
| Message `p` text | Line height | `typography → lineHeights/relaxed` |
| `"Chat with Miles"` CTA button | Fill | `semantic → semantic/success` |
| `"Chat with Miles"` CTA button | Corner radius | `sizing → borderRadius/control` |
| `"Chat with Miles"` CTA text | Fill | `semantic → background` |
| `"Chat with Miles"` CTA text | Font size | `typography → fontSizes/sm` |
| `"Chat with Miles"` CTA text | Font weight | `typography → fontWeights/semibold` |

### Pagination Dots

| Layer | Property | Variable |
|---|---|---|
| Active dot | Fill | `semantic → foreground` |
| Inactive dot | Fill | `semantic → stroke/muted` |
| Inactive dot (hover) | Fill | `semantic → stroke/strong` |

---

## Activity Feed

### Section Header

| Layer | Property | Variable |
|---|---|---|
| `"ACTIVITY"` label | Fill | `semantic → text/muted` |
| `"ACTIVITY"` label | Font size | `typography → fontSizes/xs` |
| `"ACTIVITY"` label | Font weight | `typography → fontWeights/semibold` |
| `"ACTIVITY"` label | Letter spacing | `typography → letterSpacings/caps` |
| `"See all"` link | Fill | `semantic → semantic/info` |
| `"See all"` link | Font size | `typography → fontSizes/xs` |
| `"See all"` link | Font weight | `typography → fontWeights/medium` |

### Day Group Header

| Layer | Property | Variable |
|---|---|---|
| Day label `"Today, March 22, 2026"` | Fill | `semantic → text/secondary` |
| Day label | Font size | `typography → fontSizes/xs` |
| Day label | Font weight | `typography → fontWeights/semibold` |

### Timeline Spine

| Layer | Property | Variable |
|---|---|---|
| Live ping dot (outer ring) | Fill | `semantic → semantic/success` |
| Live ping dot (inner) | Fill | `semantic → semantic/success` |
| Past event dot | Fill | `semantic → stroke/strong` |
| Connector line | Fill | `semantic → stroke/muted` |
| Live timestamp `"Now"` | Fill | `semantic → semantic/success` |
| Live timestamp | Font weight | `typography → fontWeights/semibold` |
| Past timestamp | Fill | `semantic → text/muted` |

### LiveActivityCard

| Layer | Property | Variable |
|---|---|---|
| Card container | Fill | `semantic → surface/card` |
| Card container | Stroke | `semantic → stroke/muted` |
| Card container | Corner radius | `sizing → borderRadius/panel` |
| Avatar circle (initials) | Fill | `semantic → semantic/success` |
| Avatar initials text | Fill | `semantic → background` |
| `"Jack is driving"` | Fill | `semantic → semantic/success` |
| `"Jack is driving"` | Font size | `typography → fontSizes/sm` |
| `"Jack is driving"` | Font weight | `typography → fontWeights/semibold` |
| Vehicle · elapsed text | Fill | `semantic → text/muted` |
| Vehicle · elapsed text | Font size | `typography → fontSizes/xs` |
| Speed `"34"` | Fill | `semantic → semantic/success` |
| Speed | Font size | `typography → fontSizes/lg` |
| Speed | Font weight | `typography → fontWeights/bold` |
| `"mph"` label | Fill | `semantic → semantic/success` |
| Chevron icon | Fill | `semantic → semantic/success` |

### TripActivityItem Card

| Layer | Property | Variable |
|---|---|---|
| Card container | Fill | `semantic → surface/card` |
| Card container | Stroke | `semantic → stroke/muted` |
| Card container | Corner radius | `sizing → borderRadius/panel` |
| Card container | Padding | `sizing → spacing/4` |
| `"Ask Miles"` pill | Fill | `semantic → surface/subtle` |
| `"Ask Miles"` pill | Stroke | `semantic → stroke/muted` |
| `"Ask Miles"` pill | Corner radius | `sizing → borderRadius/pill` |
| `"Ask Miles"` text | Fill | `semantic → text/muted` |
| `"Ask Miles"` text | Font size | `typography → fontSizes/xs` |
| `"Ask Miles"` text | Font weight | `typography → fontWeights/semibold` |
| Avatar fallback circle | Fill | `semantic → surface/subtle` |
| Car icon inside avatar | Fill | `semantic → text/muted` |
| Driver · vehicle line | Fill | `semantic → text/muted` |
| Driver · vehicle line | Font size | `typography → fontSizes/xs` |
| Driver · vehicle line | Font weight | `typography → fontWeights/medium` |
| Route `"From → To"` | Fill | `semantic → text/primary` |
| Route | Font size | `typography → fontSizes/sm` |
| Route | Font weight | `typography → fontWeights/semibold` |
| Duration pill | Fill | `semantic → surface/subtle` |
| Duration pill | Corner radius | `sizing → borderRadius/pill` |
| Duration text | Fill | `semantic → text/muted` |
| Duration text | Font size | `typography → fontSizes/xs` |
| Duration text | Font weight | `typography → fontWeights/medium` |
| Distance pill | Fill | `semantic → surface/subtle` |
| Distance pill | Corner radius | `sizing → borderRadius/pill` |
| Distance text | Fill | `semantic → text/muted` |
| Distance text | Font size | `typography → fontSizes/xs` |

### ScoreUpdateActivityItem Card

| Layer | Property | Variable |
|---|---|---|
| Card container | Fill | `semantic → surface/card` |
| Card container | Stroke | `semantic → stroke/muted` |
| Card container | Corner radius | `sizing → borderRadius/panel` |
| Vehicle initial circle (Civic) | Fill | hardcoded `#9b1c1c` — no token, leave as-is |
| Vehicle initial circle (RAV4) | Fill | hardcoded `#6b8cae` — no token, leave as-is |
| Vehicle initial text | Fill | `primitives → color/white` |
| Vehicle label | Fill | `semantic → text/muted` |
| Vehicle label | Font size | `typography → fontSizes/xs` |
| `"Miles Score updated"` | Fill | `semantic → text/primary` |
| `"Miles Score updated"` | Font size | `typography → fontSizes/sm` |
| `"Miles Score updated"` | Font weight | `typography → fontWeights/semibold` |
| Score value pill | Fill | `semantic → surface/subtle` |
| Score value text | Fill | `semantic → text/muted` |
| Delta pill (positive) | Fill | `semantic → surface/subtle` |
| Delta value `+N` | Fill | `semantic → semantic/success` |
| Delta value `+N` | Font weight | `typography → fontWeights/semibold` |
| Delta value `−N` | Fill | `semantic → semantic/warning` |

---

## Conversation Starters
*Bottom of activity feed*

| Layer | Property | Variable |
|---|---|---|
| Divider lines (left + right) | Fill | `semantic → stroke/muted` |
| `"All caught up · Ask Miles"` | Fill | `semantic → text/muted` |
| `"All caught up · Ask Miles"` | Font size | `typography → fontSizes/xs` |
| `"All caught up · Ask Miles"` | Font weight | `typography → fontWeights/medium` |
| Starter card container | Fill | `semantic → surface/card` |
| Starter card container | Stroke | `semantic → stroke/muted` |
| Starter card container | Corner radius | `sizing → borderRadius/panel` |
| Starter prompt text | Fill | `semantic → text/secondary` |
| Starter prompt text | Font size | `typography → fontSizes/sm` |
| Starter prompt text | Font weight | `typography → fontWeights/medium` |
| Starter card chevron | Fill | `semantic → text/muted` |
| Score-trend icon | Fill | `semantic → semantic/success` |
| Maintenance icon | Fill | `semantic → semantic/warning` |
| Fuel-tip icon | Fill | `semantic → semantic/info` |
| Braking icon | Fill | `semantic → semantic/danger` |
| Calendar / reminder icons | Fill | `semantic → text/secondary` |
| `"Try another"` text | Fill | `semantic → text/muted` |
| `"Try another"` hover fill | Fill | `semantic → surface/subtle` |
| Refresh icon | Fill | `semantic → text/muted` |

---

## Bottom Nav
*`BottomNav` component — `app/sandboxes/miles-proto-2/_components/bottom-nav.tsx`*
*Note: this component uses raw Tailwind colors (`blue-600`, `neutral-400/500`) rather than semantic tokens. Link what you can; flag the rest for a future token pass.*

| Layer | Property | Variable |
|---|---|---|
| Nav bar container | Fill | `semantic → surface/card` (≈ white/neutral-950) |
| Nav bar container | Fill opacity | `sizing → opacity/90` |
| Nav bar border top | Stroke | `semantic → stroke/muted` |
| Active tab icon | Fill | hardcoded `blue-600` — no semantic token yet |
| Inactive tab icon | Fill | hardcoded `neutral-400` / `neutral-500` dark — no token yet |
| Active tab label | Fill | hardcoded `blue-600` — no semantic token yet |
| Inactive tab label | Fill | hardcoded `neutral-400` / `neutral-500` dark — no token yet |
| Tab label | Font size | `typography → fontSizes/xs` |
| Tab label | Font weight | `typography → fontWeights/medium` |
| Badge dot (Miles tab) | Fill | hardcoded `blue-600` — no token yet |
| Badge dot ring | Stroke | `semantic → surface/card` |

---

## Notes

- **Vehicle color circles** (`#9b1c1c` Civic, `#6b8cae` RAV4) are hardcoded per-vehicle brand colors. No token equivalent — leave as-is.
- **Map overlay gradient** (`from-black/60`) is decorative — not token-linked.
- **Bottom nav** uses raw `blue-600` / `neutral-400` — these are not yet in the semantic collection. Flag for a future `semantic → interactive/active` token.
- Prefer `semantic → background` / `semantic → foreground` over primitive equivalents (`primitives → color/neutral/50`, `primitives → color/neutral/950`).
- The Figma capture script remains in `app/sandboxes/miles-proto-2/layout.tsx` for future re-captures.

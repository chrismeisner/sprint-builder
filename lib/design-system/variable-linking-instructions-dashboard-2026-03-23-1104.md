---
screen: dashboard
created: 2026-03-23 11:04
source-url: http://localhost:3000/sandboxes/miles-proto-2/dashboard
figma-url: https://www.figma.com/design/M1TxH0RtAppiV05tW3dGBS
token-version: 0.1.1
---

> **Before you start:**
> 1. Apply **Miles/\*** text styles first — each style bundles font-family, size, weight, and line-height in one click.
> 2. After linking all variables toggle Light ↔ Dark (swap semantic collection mode). Any fill that stays hardcoded is a missed variable.
>
> **Known token gaps — do not guess, leave a comment instead:**
> - `11px` — no `fontSizes` token exists. Closest is `fontSizes/xs` = 12px, but they are different values. Appears in section headers, caption-2 labels, pill meta text, timestamps.
> - `10px` — no `fontSizes` token exists. Appears in StatusBadge text, "Ask Miles" pill text, score delta micro labels.
> - `font-mono` — no `fontFamilies` token. Corresponds to AI Body / AI Label type roles (`ios-typography.ts`).
> - `blue-600` / `neutral-400` / `neutral-500` — BottomNav raw Tailwind colors; no semantic token yet.

---

## page/shell

- [ ] fill → `semantic → background`
- [ ] padding-top → `sizing → spacing/page`
- [ ] padding-bottom → `sizing → spacing/page`

---

## nav/sticky-bar

- [ ] fill → `semantic → background`
- [ ] fill opacity → `sizing → opacity/80`
- [ ] border-bottom → `semantic → stroke/muted`
- [ ] border-width → `sizing → borderWidth/hairline`

### nav/sticky-bar/title

- [ ] fill → `semantic → text/primary`
- [ ] font-size → `typography → fontSizes/base`
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] line-height → `typography → lineHeights/normal`

---

## header/row

- [ ] padding-left → `sizing → spacing/5`
- [ ] padding-right → `sizing → spacing/5`

### header/title

- [ ] fill → `semantic → text/primary`
- [ ] font-size → `typography → fontSizes/3xl`
- [ ] font-weight → `typography → fontWeights/bold`
- [ ] line-height → `typography → lineHeights/tight`

### header/action/roadside-button

- [ ] fill → `semantic → surface/card`
- [ ] stroke → `semantic → stroke/muted`
- [ ] stroke-width → `sizing → borderWidth/hairline`
- [ ] corner-radius → `sizing → borderRadius/pill`

### header/action/roadside-button/icon

- [ ] fill → `semantic → semantic/danger`

### header/action/profile-pill

- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] padding-left → `sizing → spacing/3`
- [ ] padding-right → `sizing → spacing/1`
- [ ] hover fill → `semantic → surface/strong`

### header/action/profile-pill/label

- [ ] fill → `semantic → text/secondary`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/medium`
- [ ] line-height → `typography → lineHeights/normal`

---

## map/fleet-container

- [ ] stroke → `semantic → stroke/muted`
- [ ] stroke-width → `sizing → borderWidth/hairline`
- [ ] corner-radius → `sizing → borderRadius/card`
- [ ] shadow → `sizing → boxShadow/card`
- [ ] margin-left → `sizing → spacing/5`
- [ ] margin-right → `sizing → spacing/5`

---

## section-header/vehicles/row

- [ ] padding-left → `sizing → spacing/5`
- [ ] padding-right → `sizing → spacing/5`

### section-header/vehicles/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token. Candidates: add `typography → fontSizes/11` or treat as `fontSizes/xs` (12px, not exact)
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] letter-spacing → `typography → letterSpacings/wide`

### section-header/vehicles/collapse-expand-button

- [ ] fill → `semantic → semantic/info`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token. Same gap as above
- [ ] font-weight → `typography → fontWeights/medium`

---

## card/vehicle-list

- [ ] gap → `sizing → spacing/3`
- [ ] margin-left → `sizing → spacing/5`
- [ ] margin-right → `sizing → spacing/5`

---

## card/vehicle[rav4]
*RAV4 rendered first — has active liveTrip, sorted to top.*

- [ ] fill → `semantic → surface/card`
- [ ] stroke → `semantic → stroke/muted`
- [ ] stroke-width → `sizing → borderWidth/hairline`
- [ ] corner-radius → `sizing → borderRadius/card`

### card/vehicle[rav4]/header-link

- [ ] padding-left → `sizing → spacing/4`
- [ ] padding-right → `sizing → spacing/4`
- [ ] padding-top → ⚠️ AMBIGUOUS — hardcoded `14px`; no token. Candidates: `sizing → spacing/3` (12px) or `sizing → spacing/4` (16px)
- [ ] padding-bottom → `sizing → spacing/3`
- [ ] hover fill → `semantic → background` at `sizing → opacity/80`

### card/vehicle[rav4]/header/name

- [ ] fill → `semantic → text/primary`
- [ ] font-size → `typography → fontSizes/2xl`
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] letter-spacing → `typography → letterSpacings/ui`
- [ ] line-height → `typography → lineHeights/tight`

### card/vehicle[rav4]/header/badge — driving

- [ ] fill → `semantic → semantic/success`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] padding-left → `sizing → spacing/2`
- [ ] padding-right → `sizing → spacing/2`

### card/vehicle[rav4]/header/badge/ping-outer

- [ ] fill → `semantic → background`

### card/vehicle[rav4]/header/badge/ping-inner

- [ ] fill → `semantic → background`

### card/vehicle[rav4]/header/badge/label

- [ ] fill → `semantic → background`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `10px`; no token. Corresponds to Badge/Micro type role
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] letter-spacing → `typography → letterSpacings/caps`

### card/vehicle[rav4]/header/location-icon

- [ ] fill → `semantic → text/muted`

### card/vehicle[rav4]/header/location-label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] line-height → `typography → lineHeights/normal`

### card/vehicle[rav4]/header/car-image

- [ ] opacity → `sizing → opacity/90`

### card/vehicle[rav4]/header/chevron-icon

- [ ] fill → `semantic → text/muted`

### card/vehicle[rav4]/stats-link

- [ ] padding-left → `sizing → spacing/4`
- [ ] padding-right → `sizing → spacing/4`
- [ ] padding-bottom → `sizing → spacing/3`
- [ ] hover fill → `semantic → background` at `sizing → opacity/60`

### card/vehicle[rav4]/stats/bento-grid

- [ ] gap → `sizing → spacing/2`

### card/vehicle[rav4]/stats/cell-score

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/control`
- [ ] padding-left → `sizing → spacing/3`
- [ ] padding-right → `sizing → spacing/3`

### card/vehicle[rav4]/stats/cell-score/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/vehicle[rav4]/stats/cell-score/status-dot

- [ ] fill → `semantic → semantic/success`

### card/vehicle[rav4]/stats/cell-score/value

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] line-height → `typography → lineHeights/tight`

### card/vehicle[rav4]/stats/cell-score/delta-arrow

- [ ] fill → `semantic → semantic/warning`

### card/vehicle[rav4]/stats/cell-score/delta-value

- [ ] fill → `semantic → semantic/warning`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/vehicle[rav4]/stats/cell-engine

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/control`
- [ ] padding-left → `sizing → spacing/3`
- [ ] padding-right → `sizing → spacing/3`

### card/vehicle[rav4]/stats/cell-engine/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/vehicle[rav4]/stats/cell-engine/status-dot

- [ ] fill → `semantic → semantic/success`

### card/vehicle[rav4]/stats/cell-engine/value

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] line-height → `typography → lineHeights/tight`

### card/vehicle[rav4]/stats/cell-engine/checked-at

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] font-weight → `typography → fontWeights/medium`
- [ ] line-height → `typography → lineHeights/tight`

### card/vehicle[rav4]/stats/cell-fuel

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/control`
- [ ] padding-left → `sizing → spacing/3`
- [ ] padding-right → `sizing → spacing/3`

### card/vehicle[rav4]/stats/cell-fuel/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/vehicle[rav4]/stats/cell-fuel/status-dot

- [ ] fill → `semantic → semantic/warning`

### card/vehicle[rav4]/stats/cell-fuel/value

- [ ] fill → `semantic → semantic/warning`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] line-height → `typography → lineHeights/tight`

### card/vehicle[rav4]/stats/cell-fuel/range

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] font-weight → `typography → fontWeights/medium`
- [ ] line-height → `typography → lineHeights/tight`

### card/vehicle[rav4]/driver-strip

- [ ] fill → `semantic → surface/subtle`
- [ ] stroke → `semantic → stroke/muted`
- [ ] stroke-width → `sizing → borderWidth/hairline`
- [ ] corner-radius → `sizing → borderRadius/panel`
- [ ] margin-left → `sizing → spacing/4`
- [ ] margin-right → `sizing → spacing/4`
- [ ] margin-bottom → `sizing → spacing/4`
- [ ] padding-left → `sizing → spacing/3`
- [ ] padding-right → `sizing → spacing/3`
- [ ] hover fill → `semantic → surface/strong`

### card/vehicle[rav4]/driver-strip/avatar-initials

- [ ] fill → `semantic → semantic/success`
- [ ] corner-radius → `sizing → borderRadius/pill`

### card/vehicle[rav4]/driver-strip/avatar-initials/text

- [ ] fill → `semantic → background`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/vehicle[rav4]/driver-strip/driver-name

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/semibold`

### card/vehicle[rav4]/driver-strip/started-ago

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → `typography → fontSizes/xs`
- [ ] font-weight → `typography → fontWeights/regular`

### card/vehicle[rav4]/driver-strip/speed-value

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → `typography → fontSizes/lg`
- [ ] font-weight → `typography → fontWeights/bold`

### card/vehicle[rav4]/driver-strip/speed-unit

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/vehicle[rav4]/driver-strip/chevron

- [ ] fill → `semantic → semantic/success`

---

## card/vehicle[civic]

- [ ] fill → `semantic → surface/card`
- [ ] stroke → `semantic → stroke/muted`
- [ ] stroke-width → `sizing → borderWidth/hairline`
- [ ] corner-radius → `sizing → borderRadius/card`

### card/vehicle[civic]/header-link

- [ ] padding-left → `sizing → spacing/4`
- [ ] padding-right → `sizing → spacing/4`
- [ ] padding-top → ⚠️ AMBIGUOUS — hardcoded `14px`; no token
- [ ] padding-bottom → `sizing → spacing/2`
- [ ] hover fill → `semantic → background` at `sizing → opacity/80`

### card/vehicle[civic]/header/name

- [ ] fill → `semantic → text/primary`
- [ ] font-size → `typography → fontSizes/2xl`
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] letter-spacing → `typography → letterSpacings/ui`
- [ ] line-height → `typography → lineHeights/tight`

### card/vehicle[civic]/header/badge — parked

- [ ] fill → `semantic → semantic/info`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] padding-left → `sizing → spacing/2`
- [ ] padding-right → `sizing → spacing/2`

### card/vehicle[civic]/header/badge/label

- [ ] fill → `semantic → background`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] letter-spacing → `typography → letterSpacings/caps`

### card/vehicle[civic]/header/location-icon

- [ ] fill → `semantic → text/muted`

### card/vehicle[civic]/header/location-label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] line-height → `typography → lineHeights/normal`

### card/vehicle[civic]/header/car-image

- [ ] opacity → `sizing → opacity/90`

### card/vehicle[civic]/header/chevron-icon

- [ ] fill → `semantic → text/muted`

### card/vehicle[civic]/stats-link

- [ ] padding-left → `sizing → spacing/4`
- [ ] padding-right → `sizing → spacing/4`
- [ ] padding-bottom → `sizing → spacing/3`
- [ ] hover fill → `semantic → background` at `sizing → opacity/60`

### card/vehicle[civic]/stats/bento-grid

- [ ] gap → `sizing → spacing/2`

### card/vehicle[civic]/stats/cell-score

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/control`
- [ ] padding-left → `sizing → spacing/3`
- [ ] padding-right → `sizing → spacing/3`

### card/vehicle[civic]/stats/cell-score/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/vehicle[civic]/stats/cell-score/status-dot

- [ ] fill → `semantic → semantic/success`

### card/vehicle[civic]/stats/cell-score/value

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] line-height → `typography → lineHeights/tight`

### card/vehicle[civic]/stats/cell-score/delta-arrow

- [ ] fill → `semantic → semantic/success`

### card/vehicle[civic]/stats/cell-score/delta-value

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/vehicle[civic]/stats/cell-engine

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/control`
- [ ] padding-left → `sizing → spacing/3`
- [ ] padding-right → `sizing → spacing/3`

### card/vehicle[civic]/stats/cell-engine/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/vehicle[civic]/stats/cell-engine/status-dot

- [ ] fill → `semantic → semantic/success`

### card/vehicle[civic]/stats/cell-engine/value

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] line-height → `typography → lineHeights/tight`

### card/vehicle[civic]/stats/cell-engine/checked-at

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] font-weight → `typography → fontWeights/medium`
- [ ] line-height → `typography → lineHeights/tight`

### card/vehicle[civic]/stats/cell-fuel

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/control`
- [ ] padding-left → `sizing → spacing/3`
- [ ] padding-right → `sizing → spacing/3`

### card/vehicle[civic]/stats/cell-fuel/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/vehicle[civic]/stats/cell-fuel/status-dot

- [ ] fill → `semantic → semantic/success`

### card/vehicle[civic]/stats/cell-fuel/value

- [ ] fill → `semantic → text/secondary`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] line-height → `typography → lineHeights/tight`

### card/vehicle[civic]/stats/cell-fuel/range

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] font-weight → `typography → fontWeights/medium`
- [ ] line-height → `typography → lineHeights/tight`

---

## carousel/coaching

- [ ] margin-left → `sizing → spacing/5`
- [ ] margin-right → `sizing → spacing/5`
- [ ] gap → `sizing → spacing/2`

### carousel/coaching/section-label

- [ ] fill → `semantic → text/muted`
- [ ] font-family → ⚠️ AMBIGUOUS — `font-mono`; no `fontFamilies` token. Corresponds to AI Label type role
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`
- [ ] letter-spacing → `typography → letterSpacings/wide`

### card/coaching[fuel-reminder]

- [ ] fill → `semantic → surface/card`
- [ ] stroke → `semantic → stroke/muted`
- [ ] stroke-width → `sizing → borderWidth/hairline`
- [ ] corner-radius → `sizing → borderRadius/panel`
- [ ] shadow → `sizing → boxShadow/card`
- [ ] padding → `sizing → spacing/4`
- [ ] gap → `sizing → spacing/3`

### card/coaching[fuel-reminder]/header-row

- [ ] gap → `sizing → spacing/2`

### card/coaching[fuel-reminder]/miles-avatar

- [ ] fill → `semantic → surface/strong`
- [ ] corner-radius → `sizing → borderRadius/pill`

### card/coaching[fuel-reminder]/dismiss-button

- [ ] fill (default) → `semantic → text/muted`
- [ ] fill (hover bg) → `semantic → surface/strong`
- [ ] fill (hover text) → `semantic → text/secondary`
- [ ] corner-radius → `sizing → borderRadius/pill`

### card/coaching[fuel-reminder]/message

- [ ] fill → `semantic → text/secondary`
- [ ] font-family → ⚠️ AMBIGUOUS — `font-mono`; no `fontFamilies` token. Corresponds to AI Body type role
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/regular`
- [ ] line-height → `typography → lineHeights/relaxed`

### card/coaching[fuel-reminder]/cta-button

- [ ] fill → `semantic → semantic/success`
- [ ] corner-radius → `sizing → borderRadius/control`
- [ ] padding-left → `sizing → spacing/4`
- [ ] padding-right → `sizing → spacing/4`

### card/coaching[fuel-reminder]/cta-button/label

- [ ] fill → `semantic → background`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/semibold`

### carousel/coaching/pagination-dot[active]

- [ ] fill → `semantic → foreground`
- [ ] corner-radius → `sizing → borderRadius/pill`

### carousel/coaching/pagination-dot[inactive]

- [ ] fill → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] hover fill → `semantic → stroke/strong`

---

## feed/activity

- [ ] margin-left → `sizing → spacing/5`
- [ ] margin-right → `sizing → spacing/5`
- [ ] gap → `sizing → spacing/4`

### feed/activity/section-header

### feed/activity/section-header/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] letter-spacing → `typography → letterSpacings/wide`

### feed/activity/section-header/see-all

- [ ] fill → `semantic → semantic/info`
- [ ] font-size → `typography → fontSizes/xs`
- [ ] font-weight → `typography → fontWeights/medium`

---

## feed/activity/day-group[today]

- [ ] gap → `sizing → spacing/3`

### feed/activity/day-group[today]/date-label

- [ ] fill → `semantic → text/secondary`
- [ ] font-size → `typography → fontSizes/xs`
- [ ] font-weight → `typography → fontWeights/semibold`

### feed/activity/day-group[today]/timeline-row[live]

### feed/activity/day-group[today]/timeline-row[live]/spine

### feed/activity/day-group[today]/timeline-row[live]/spine/ping-outer

- [ ] fill → `semantic → semantic/success`

### feed/activity/day-group[today]/timeline-row[live]/spine/ping-inner

- [ ] fill → `semantic → semantic/success`

### feed/activity/day-group[today]/timeline-row[live]/spine/connector-line

- [ ] fill → `semantic → stroke/muted`

### feed/activity/day-group[today]/timeline-row[live]/timestamp

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] line-height → `typography → lineHeights/tight`

### card/activity/live-trip

- [ ] fill → `semantic → surface/card`
- [ ] stroke → `semantic → stroke/muted`
- [ ] stroke-width → `sizing → borderWidth/hairline`
- [ ] corner-radius → `sizing → borderRadius/panel`
- [ ] padding → `sizing → spacing/4`
- [ ] gap → `sizing → spacing/3`
- [ ] hover fill → `semantic → surface/subtle`

### card/activity/live-trip/avatar-initials

- [ ] fill → `semantic → semantic/success`
- [ ] corner-radius → `sizing → borderRadius/pill`

### card/activity/live-trip/avatar-initials/text

- [ ] fill → `semantic → background`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/semibold`

### card/activity/live-trip/driver-name

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/semibold`

### card/activity/live-trip/meta

- [ ] fill → `semantic → text/muted`
- [ ] font-size → `typography → fontSizes/xs`

### card/activity/live-trip/speed-value

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → `typography → fontSizes/lg`
- [ ] font-weight → `typography → fontWeights/bold`

### card/activity/live-trip/speed-unit

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/activity/live-trip/chevron

- [ ] fill → `semantic → semantic/success`

---

### feed/activity/day-group[today]/timeline-row[trip-1]

### feed/activity/day-group[today]/timeline-row[trip-1]/spine/dot

- [ ] fill → `semantic → stroke/strong`

### feed/activity/day-group[today]/timeline-row[trip-1]/spine/connector-line

- [ ] fill → `semantic → stroke/muted`

### feed/activity/day-group[today]/timeline-row[trip-1]/timestamp

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/regular`
- [ ] line-height → `typography → lineHeights/tight`

### card/activity/trip[trip-1]

- [ ] fill → `semantic → surface/card`
- [ ] stroke → `semantic → stroke/muted`
- [ ] stroke-width → `sizing → borderWidth/hairline`
- [ ] corner-radius → `sizing → borderRadius/panel`
- [ ] padding → `sizing → spacing/4`
- [ ] hover fill → `semantic → surface/subtle`

### card/activity/trip[trip-1]/ask-miles-pill

- [ ] fill → `semantic → surface/subtle`
- [ ] stroke → `semantic → stroke/muted`
- [ ] stroke-width → `sizing → borderWidth/hairline`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] padding-left → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] padding-right → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] hover fill → `semantic → surface/strong`
- [ ] hover text fill → `semantic → text/secondary`

### card/activity/trip[trip-1]/ask-miles-pill/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] font-weight → `typography → fontWeights/semibold`

### card/activity/trip[trip-1]/avatar-fallback

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/pill`

### card/activity/trip[trip-1]/avatar-fallback/car-icon

- [ ] fill → `semantic → text/muted`

### card/activity/trip[trip-1]/driver-vehicle-meta

- [ ] fill → `semantic → text/muted`
- [ ] font-size → `typography → fontSizes/xs`
- [ ] font-weight → `typography → fontWeights/medium`

### card/activity/trip[trip-1]/route

- [ ] fill → `semantic → text/primary`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] line-height → `typography → lineHeights/snug`

### card/activity/trip[trip-1]/duration-pill

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] padding-left → `sizing → spacing/2`
- [ ] padding-right → `sizing → spacing/2`

### card/activity/trip[trip-1]/duration-pill/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/activity/trip[trip-1]/distance-pill

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] padding-left → `sizing → spacing/2`
- [ ] padding-right → `sizing → spacing/2`

### card/activity/trip[trip-1]/distance-pill/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

---

### feed/activity/day-group[today]/timeline-row[trip-2]
*Identical structure to trip-1 — repeat all checklist items above for this instance.*

- [ ] spine/dot fill → `semantic → stroke/strong`
- [ ] spine/connector-line fill → `semantic → stroke/muted`
- [ ] timestamp fill → `semantic → text/muted`
- [ ] timestamp font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] card fill → `semantic → surface/card`
- [ ] card stroke → `semantic → stroke/muted`
- [ ] card corner-radius → `sizing → borderRadius/panel`
- [ ] ask-miles-pill fill → `semantic → surface/subtle`
- [ ] ask-miles-pill stroke → `semantic → stroke/muted`
- [ ] ask-miles-pill corner-radius → `sizing → borderRadius/pill`
- [ ] ask-miles-pill/label fill → `semantic → text/muted`
- [ ] ask-miles-pill/label font-size → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] avatar-fallback fill → `semantic → surface/subtle`
- [ ] car-icon fill → `semantic → text/muted`
- [ ] driver-vehicle-meta fill → `semantic → text/muted`
- [ ] route fill → `semantic → text/primary`
- [ ] duration-pill fill → `semantic → surface/subtle`
- [ ] duration-pill corner-radius → `sizing → borderRadius/pill`
- [ ] duration label fill → `semantic → text/muted`
- [ ] duration label font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] distance-pill fill → `semantic → surface/subtle`
- [ ] distance label fill → `semantic → text/muted`

---

## feed/activity/day-group[yesterday]

### feed/activity/day-group[yesterday]/date-label

- [ ] fill → `semantic → text/secondary`
- [ ] font-size → `typography → fontSizes/xs`
- [ ] font-weight → `typography → fontWeights/semibold`

### feed/activity/day-group[yesterday]/timeline-row[score-civic]

### feed/activity/day-group[yesterday]/timeline-row[score-civic]/spine/dot

- [ ] fill → `semantic → stroke/strong`

### feed/activity/day-group[yesterday]/timeline-row[score-civic]/spine/connector-line

- [ ] fill → `semantic → stroke/muted`

### feed/activity/day-group[yesterday]/timeline-row[score-civic]/timestamp

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/regular`

### card/activity/score-update[civic]

- [ ] fill → `semantic → surface/card`
- [ ] stroke → `semantic → stroke/muted`
- [ ] stroke-width → `sizing → borderWidth/hairline`
- [ ] corner-radius → `sizing → borderRadius/panel`
- [ ] padding → `sizing → spacing/4`
- [ ] hover fill → `semantic → surface/subtle`

### card/activity/score-update[civic]/ask-miles-pill

- [ ] fill → `semantic → surface/subtle`
- [ ] stroke → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/pill`

### card/activity/score-update[civic]/ask-miles-pill/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] font-weight → `typography → fontWeights/semibold`

### card/activity/score-update[civic]/vehicle-initial-circle

- [ ] fill → hardcoded `#9b1c1c` — no token; Civic brand color, leave as-is
- [ ] corner-radius → `sizing → borderRadius/pill`

### card/activity/score-update[civic]/vehicle-initial-circle/text

- [ ] fill → `primitives → color/white`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/semibold`

### card/activity/score-update[civic]/vehicle-label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → `typography → fontSizes/xs`
- [ ] font-weight → `typography → fontWeights/medium`

### card/activity/score-update[civic]/title

- [ ] fill → `semantic → text/primary`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/semibold`
- [ ] line-height → `typography → lineHeights/snug`

### card/activity/score-update[civic]/score-pill

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/pill`

### card/activity/score-update[civic]/score-pill/value

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### card/activity/score-update[civic]/delta-pill

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/pill`

### card/activity/score-update[civic]/delta-pill/value

- [ ] fill → `semantic → semantic/success`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/semibold`

---

### feed/activity/day-group[yesterday]/timeline-row[score-rav4]
*Identical structure to score-civic — repeat all items. Key differences:*

- [ ] vehicle-initial-circle fill → hardcoded `#6b8cae` — no token; RAV4 brand color, leave as-is
- [ ] delta-pill/value fill → `semantic → semantic/warning` *(negative delta)*
- [ ] delta-pill/value font-weight → `typography → fontWeights/semibold`
- [ ] all other properties → same tokens as `card/activity/score-update[civic]`

---

### feed/activity/day-group[yesterday]/timeline-row[trip-3]
*TripActivityItem — same structure as today's trips. Key tokens:*

- [ ] spine/dot fill → `semantic → stroke/strong`
- [ ] spine/connector-line fill → `semantic → stroke/muted`
- [ ] timestamp fill → `semantic → text/muted`
- [ ] card fill → `semantic → surface/card`
- [ ] card stroke → `semantic → stroke/muted`
- [ ] card corner-radius → `sizing → borderRadius/panel`
- [ ] all pill/text/icon tokens → same as `card/activity/trip[trip-1]`

---

### feed/activity/day-group[yesterday]/timeline-row[trip-4]
*Last timeline entry — no connector line below.*

- [ ] spine/dot fill → `semantic → stroke/strong`
- [ ] timestamp fill → `semantic → text/muted`
- [ ] card fill → `semantic → surface/card`
- [ ] card stroke → `semantic → stroke/muted`
- [ ] card corner-radius → `sizing → borderRadius/panel`
- [ ] all pill/text/icon tokens → same as `card/activity/trip[trip-1]`

---

## feed/conversation-starters

- [ ] gap → `sizing → spacing/3`

### feed/conversation-starters/divider-row

### feed/conversation-starters/divider-line-left

- [ ] fill → `semantic → stroke/muted`

### feed/conversation-starters/divider-label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`

### feed/conversation-starters/divider-line-right

- [ ] fill → `semantic → stroke/muted`

### card/conversation-starter

- [ ] fill → `semantic → surface/card`
- [ ] stroke → `semantic → stroke/muted`
- [ ] stroke-width → `sizing → borderWidth/hairline`
- [ ] corner-radius → `sizing → borderRadius/panel`
- [ ] padding-left → `sizing → spacing/4`
- [ ] padding-right → `sizing → spacing/4`
- [ ] padding-top → ⚠️ AMBIGUOUS — hardcoded `14px`; no token
- [ ] padding-bottom → ⚠️ AMBIGUOUS — hardcoded `14px`; no token
- [ ] gap → ⚠️ AMBIGUOUS — hardcoded `10px`; no token
- [ ] hover fill → `semantic → surface/subtle`

### card/conversation-starter/icon — score-trend

- [ ] fill → `semantic → semantic/success`

### card/conversation-starter/prompt-text

- [ ] fill → `semantic → text/secondary`
- [ ] font-size → `typography → fontSizes/sm`
- [ ] font-weight → `typography → fontWeights/medium`

### card/conversation-starter/chevron

- [ ] fill → `semantic → text/muted`

### button/try-another

- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] padding-left → `sizing → spacing/3`
- [ ] padding-right → `sizing → spacing/3`
- [ ] hover fill → `semantic → surface/subtle`

### button/try-another/label

- [ ] fill → `semantic → text/muted`
- [ ] font-size → ⚠️ AMBIGUOUS — hardcoded `11px`; no token
- [ ] font-weight → `typography → fontWeights/medium`
- [ ] hover fill → `semantic → text/secondary`

### button/try-another/refresh-icon

- [ ] fill → `semantic → text/muted`

---

## nav/bottom

- [ ] fill → `semantic → surface/card`
- [ ] fill opacity → `sizing → opacity/90`
- [ ] border-top stroke → `semantic → stroke/muted`
- [ ] border-width → `sizing → borderWidth/hairline`

### nav/bottom/tab[home]/icon

- [ ] fill → ⚠️ AMBIGUOUS — hardcoded `blue-600` (`#2563eb`); no semantic token. Candidates: `semantic → semantic/info`, or a future `semantic → interactive/active`

### nav/bottom/tab[home]/label

- [ ] fill → ⚠️ AMBIGUOUS — hardcoded `blue-600`; same as above
- [ ] font-size → `typography → fontSizes/xs`
- [ ] font-weight → `typography → fontWeights/medium`

### nav/bottom/tab[miles]/icon

- [ ] fill → ⚠️ AMBIGUOUS — hardcoded `blue-600`; no semantic token

### nav/bottom/tab[miles]/label

- [ ] fill → ⚠️ AMBIGUOUS — hardcoded `blue-600`; no semantic token
- [ ] font-size → `typography → fontSizes/xs`
- [ ] font-weight → `typography → fontWeights/medium`

### nav/bottom/tab[miles]/badge-dot

- [ ] fill → ⚠️ AMBIGUOUS — hardcoded `blue-600`; no semantic token
- [ ] ring stroke → `semantic → surface/card`

### nav/bottom/tab[trips]/icon

- [ ] fill → ⚠️ AMBIGUOUS — hardcoded `neutral-400` / `neutral-500` (dark); no semantic token. Candidate: `semantic → text/muted` (≈`#737373`)

### nav/bottom/tab[trips]/label

- [ ] fill → ⚠️ AMBIGUOUS — hardcoded `neutral-400` / `neutral-500` (dark); no semantic token
- [ ] font-size → `typography → fontSizes/xs`
- [ ] font-weight → `typography → fontWeights/medium`

### nav/bottom/tab[account]/icon

- [ ] fill → ⚠️ AMBIGUOUS — hardcoded `neutral-400` / `neutral-500` (dark); no semantic token

### nav/bottom/tab[account]/label

- [ ] fill → ⚠️ AMBIGUOUS — hardcoded `neutral-400` / `neutral-500` (dark); no semantic token
- [ ] font-size → `typography → fontSizes/xs`
- [ ] font-weight → `typography → fontWeights/medium`

---

## Token gap summary

| Hardcoded value | Frequency | Recommended action |
|---|---|---|
| `11px` font-size | 15+ layers | Add `typography → fontSizes/11` (Section Header / Caption 2 role) |
| `10px` font-size | 6+ layers | Add `typography → fontSizes/10` (Badge / Micro role) |
| `14px` padding | 3 layers | Add `sizing → spacing/3.5` or document as `spacing/4` and adjust in code |
| `10px` padding | 2 layers | Unclear — flag for design review |
| `font-mono` family | 2 layers | Add `typography → fontFamilies/mono` |
| `blue-600` (#2563eb) active nav | 4 layers | Add `semantic → interactive/active` |
| `neutral-400/500` inactive nav | 4 layers | Add `semantic → interactive/inactive` |
| `#9b1c1c` Civic circle | 1 layer | Per-vehicle color — no token needed |
| `#6b8cae` RAV4 circle | 1 layer | Per-vehicle color — no token needed |

---
screen: dashboard-dark
created: 2026-03-23 20:36
source-url: http://localhost:3000/sandboxes/miles-proto-2/dashboard
figma-url: https://www.figma.com/design/M1TxH0RtAppiV05tW3dGBS/miles-proto-2-Dashboard?node-id=5-663&p=f&t=IBc3IxwZ2xEaBDSt-11
token-version: 0.1.1
---

> **How to use this file**
> Work top-to-bottom. For each item, select the named layer in Figma, open the Variables panel, and bind the property to the listed token. When every box is checked, toggle Light ↔ Dark mode in the Figma Variables panel and visually verify that all surfaces, text, and borders invert correctly.
>
> Token path notation:
> - `semantic → x/y` = variable from the semantic-light / semantic-dark collection
> - `sizing → x/y` = variable from the sizing collection
> - `Miles/Name` = Miles text style
> - `primitives → x/y` = raw primitive (use only when no semantic alias exists)

---

## screen/dashboard

- [ ] fill → `semantic → background`

---

## nav/compact-bar

*(Sticky header that fades in when the large title scrolls out of view)*

- [ ] fill → `semantic → background` at 85% opacity (`sizing → opacity/subtle`)
- [ ] border-bottom → `semantic → stroke/muted`

### nav/compact-bar/title — "Miles"

- [ ] fill (text) → `semantic → text/primary`
- [ ] font → `Miles/Headline` (16px / 600 / 24px line-height)

### nav/compact-bar/action — roadside button

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] width / height → 36px (`sizing → spacing/9` — size-9 = 36px)
- [ ] icon fill → `semantic → semantic/danger`

---

## fleet-view

### header/row

*(px-5 pt-2 — 20px horizontal padding, 8px top)*

#### header/title — "Miles"

- [ ] fill (text) → `semantic → text/primary`
- [ ] font → `Miles/Large Title` (30px / 700 / 38px line-height)

#### header/action — roadside button

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] width / height → 44px (`sizing → spacing/10` — size-11 = 44px)
- [ ] icon fill → `semantic → semantic/danger`

---

## fleet/map-container

*(mx-5 = 20px margin; map fills a 3:2 aspect-ratio box)*

- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/card` (16px)
- [ ] shadow → `sizing → boxShadow/card`

---

## vehicles/section-header

### vehicles/section-header/label — "VEHICLES"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Section Header` (11px / 600 / 16px / uppercase / tracking 0.025em)

### vehicles/section-header/toggle — "Collapse"

- [ ] fill (text) → `semantic → semantic/info`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

---

## vehicle-card/rav4

*(RAV4 is sorted first because it has a live trip)*

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/card` (16px)

### vehicle-card/rav4/header

*(px-4 pt-3.5 pb-2 — 16px h-pad, 14px top, 8px bottom)*

#### vehicle-card/rav4/header/name — "RAV4"

- [ ] fill (text) → `semantic → text/primary`
- [ ] font → `Miles/Display` (24px / 600 / 30px / uppercase)

#### badge/driving

- [ ] fill → `semantic → semantic/success`
- [ ] fill (text) → `semantic → background`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] font → `Miles/Badge` (10px / 600 / 15px / uppercase / tracking 0.025em)

#### badge/driving/ping-dot

- [ ] fill → `semantic → background`

#### vehicle-card/rav4/header/location

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Subheadline` (14px / 500 / 21px)
- [ ] icon fill → `semantic → text/muted`

#### vehicle-card/rav4/header/chevron

- [ ] fill → `semantic → text/muted`

### vehicle-card/rav4/stats-bento

*(grid-cols-3 gap-2)*

#### bento-cell/rav4/score

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/control` (8px)

##### bento-cell/rav4/score/label — "Score"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

##### bento-cell/rav4/score/dot

- [ ] fill → `semantic → semantic/success`

##### bento-cell/rav4/score/value — "74"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Subheadline Bold` (14px / 600 / 14px)

##### bento-cell/rav4/score/delta-icon (down arrow)

- [ ] fill → `semantic → semantic/warning`

##### bento-cell/rav4/score/delta-value — "−2"

- [ ] fill (text) → `semantic → semantic/warning`
- [ ] font → `Miles/Micro Label` (10px / 500 / 15px / uppercase / tracking 0.025em)

#### bento-cell/rav4/engine

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/control` (8px)

##### bento-cell/rav4/engine/label — "Engine"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

##### bento-cell/rav4/engine/dot

- [ ] fill → `semantic → semantic/success`

##### bento-cell/rav4/engine/value — "Good"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Subheadline Bold` (14px / 600 / 14px)

##### bento-cell/rav4/engine/checked-at — "Just now"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

#### bento-cell/rav4/fuel

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/control` (8px)

##### bento-cell/rav4/fuel/label — "Fuel"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

##### bento-cell/rav4/fuel/dot

- [ ] fill → `semantic → semantic/success` *(38% > 30% threshold)*

##### bento-cell/rav4/fuel/value — "38%"

- [ ] fill (text) → `semantic → text/secondary` *(>30% uses text-secondary, not success)*
- [ ] font → `Miles/Subheadline Bold` (14px / 600 / 14px)

##### bento-cell/rav4/fuel/range — "~120 mi range"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

### driver-strip/rav4

*(mx-4 mb-4 px-3 py-2.5 — 16px h-margin, 16px bottom; 12px h-pad, 10px v-pad)*

- [ ] fill → `semantic → surface/subtle`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/panel` (12px)

#### driver-strip/rav4/avatar

- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] width / height → 28px (size-7)

#### driver-strip/rav4/name — "Jack is driving"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Subheadline Bold` (14px / 600 / 14px)

#### driver-strip/rav4/meta — "12 mins ago"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Caption Muted` (12px / 400 / 18px)

#### driver-strip/rav4/speed — "34"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Stat — Medium` (18px / 700 / 27px / tabular)

#### driver-strip/rav4/speed-unit — "mph"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

#### driver-strip/rav4/chevron

- [ ] fill → `semantic → semantic/success`

---

## vehicle-card/civic

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/card` (16px)

### vehicle-card/civic/header

*(px-4 pt-3.5 pb-2)*

#### vehicle-card/civic/header/name — "CIVIC"

- [ ] fill (text) → `semantic → text/primary`
- [ ] font → `Miles/Display` (24px / 600 / 30px / uppercase)

#### badge/parked

- [ ] fill → `semantic → semantic/info`
- [ ] fill (text) → `semantic → background`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] font → `Miles/Badge` (10px / 600 / 15px / uppercase / tracking 0.025em)

#### vehicle-card/civic/header/location — "4521 Main St"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Subheadline` (14px / 500 / 21px)
- [ ] icon fill → `semantic → text/muted`

#### vehicle-card/civic/header/chevron

- [ ] fill → `semantic → text/muted`

### vehicle-card/civic/stats-bento

#### bento-cell/civic/score

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/control` (8px)

##### bento-cell/civic/score/label — "Score"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2`

##### bento-cell/civic/score/dot

- [ ] fill → `semantic → semantic/success`

##### bento-cell/civic/score/value — "82"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Subheadline Bold`

##### bento-cell/civic/score/delta-icon (up arrow)

- [ ] fill → `semantic → semantic/success`

##### bento-cell/civic/score/delta-value — "+3"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Micro Label`

#### bento-cell/civic/engine

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/control` (8px)

##### bento-cell/civic/engine/label — "Engine"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2`

##### bento-cell/civic/engine/dot

- [ ] fill → `semantic → semantic/success`

##### bento-cell/civic/engine/value — "Good"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Subheadline Bold`

##### bento-cell/civic/engine/checked-at — "10m ago"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2`

#### bento-cell/civic/fuel

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/control` (8px)

##### bento-cell/civic/fuel/label — "Fuel"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2`

##### bento-cell/civic/fuel/dot

- [ ] fill → `semantic → semantic/success` *(62% > 30% threshold)*

##### bento-cell/civic/fuel/value — "62%"

- [ ] fill (text) → `semantic → text/secondary` *(>30% threshold → text-secondary)*
- [ ] font → `Miles/Subheadline Bold`

##### bento-cell/civic/fuel/range — "~230 mi range"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2`

---

## coaching-carousel

*(mx-5 = 20px margin)*

### coaching-carousel/label — "FROM MILES"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/AI Label` (11px / 500 / 16px / mono / uppercase / tracking 0.025em)

### coaching-card/fuel

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/panel` (12px)
- [ ] shadow → `sizing → boxShadow/card`

#### coaching-card/fuel/miles-icon-container

- [ ] fill → `semantic → surface/strong`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] width / height → 32px (size-8)

#### coaching-card/fuel/dismiss-button

- [ ] fill → *(transparent — no fill)*
- [ ] icon fill → `semantic → text/muted`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] width / height → 32px (size-8)

#### coaching-card/fuel/message

- [ ] fill (text) → `semantic → text/secondary`
- [ ] font → `Miles/AI Body` (14px / 400 / 23px / mono)

#### coaching-card/fuel/action-button — "Chat with Miles"

- [ ] fill → `semantic → semantic/success`
- [ ] fill (text) → `semantic → background`
- [ ] corner-radius → `sizing → borderRadius/control` (8px)
- [ ] min-height → 44px (`sizing → spacing/10`)
- [ ] font → `Miles/Subheadline Bold` (14px / 600 / 14px)

### carousel/dot-active

- [ ] fill → `semantic → foreground`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] width → 16px, height → 6px

### carousel/dot-inactive

- [ ] fill → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] width / height → 6px

---

## activity-feed

*(mx-5 = 20px margin)*

### activity/section-header/label — "ACTIVITY"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Section Header` (11px / 600 / 16px / uppercase / tracking 0.025em)

### activity/section-header/see-all — "See all"

- [ ] fill (text) → `semantic → semantic/info`
- [ ] font → `Miles/Caption` (12px / 500 / 18px)

---

## activity/day-group/today

### activity/day-group/today/label — "Today, March 20, 2026"

- [ ] fill (text) → `semantic → text/secondary`
- [ ] font → `Miles/Caption Emphasized` (12px / 600 / 18px)

---

## timeline/entry/live

### timeline/entry/live/dot

- [ ] fill → `semantic → semantic/success`

### timeline/entry/live/ping-ring

- [ ] fill → `semantic → semantic/success`

### timeline/entry/live/timestamp — "Now"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px) + weight overridden to 600

---

## card/live-activity

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/panel` (12px)

### card/live-activity/avatar

- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] width / height → 36px (size-9)

### card/live-activity/name — "Jack is driving"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Subheadline Bold` (14px / 600 / 14px)

### card/live-activity/meta — "Toyota RAV4 · 12 mins ago"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption Muted` (12px / 400 / 18px)

### card/live-activity/speed — "34"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Stat — Medium` (18px / 700 / 27px / tabular)

### card/live-activity/speed-unit — "mph"

- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

### card/live-activity/chevron

- [ ] fill → `semantic → semantic/success`

---

## timeline/entry/trip-1

*(Today 4:41 PM)*

### timeline/entry/trip-1/dot

- [ ] fill → `semantic → stroke/strong`

### timeline/entry/trip-1/connector-line

- [ ] fill → `semantic → stroke/muted`

### timeline/entry/trip-1/timestamp

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

---

## card/trip-activity-1

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/panel` (12px)

### card/trip-activity-1/ask-miles-button

- [ ] fill → `semantic → surface/subtle`
- [ ] border → `semantic → stroke/muted`
- [ ] fill (text) → `semantic → text/muted`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] font → `Miles/Badge` (10px / 600 / 15px)

### card/trip-activity-1/avatar

- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] width / height → 36px (size-9)
- [ ] border → `semantic → background` (2px border-background)

### card/trip-activity-1/vehicle-badge

- [ ] fill → `primitives → color/blue/300` (#6b8cae) ⚠️ AMBIGUOUS — hardcoded vehicleColor, no semantic token exists; use `primitives → color/blue/300` as closest or keep raw value
- [ ] fill (text) → `primitives → color/white`
- [ ] border → `semantic → background`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] width / height → 20px (size-5)

### card/trip-activity-1/driver-label

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption` (12px / 500 / 18px)

### card/trip-activity-1/route

- [ ] fill (text) → `semantic → text/primary`
- [ ] font → `Miles/Subheadline Bold` (14px / 600 / 14px)

### card/trip-activity-1/duration-chip

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

### card/trip-activity-1/distance-chip

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

---

## timeline/entry/trip-2

*(Today 3:54 PM — identical structure to trip-1)*

- [ ] dot fill → `semantic → stroke/strong`
- [ ] connector fill → `semantic → stroke/muted`
- [ ] timestamp fill → `semantic → text/muted`, font → `Miles/Caption 2`

---

## card/trip-activity-2

*(Identical token bindings to card/trip-activity-1 — apply same checklist)*

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/panel` (12px)
- [ ] ask-miles fill → `semantic → surface/subtle`, border → `semantic → stroke/muted`, text → `semantic → text/muted`
- [ ] avatar border → `semantic → background`
- [ ] vehicle-badge fill → `primitives → color/red/600` (#9b1c1c) ⚠️ AMBIGUOUS — Civic color is hardcoded #9b1c1c; closest primitive is red/600
- [ ] driver-label → `semantic → text/muted`, `Miles/Caption`
- [ ] route → `semantic → text/primary`, `Miles/Subheadline Bold`
- [ ] chip fills → `semantic → surface/subtle`, text → `semantic → text/muted`, `Miles/Caption 2`

---

## activity/day-group/yesterday

### activity/day-group/yesterday/label — "Yesterday, March 19, 2026"

- [ ] fill (text) → `semantic → text/secondary`
- [ ] font → `Miles/Caption Emphasized` (12px / 600 / 18px)

---

## timeline/entry/score-civic

*(Yesterday 11:30 PM)*

- [ ] dot fill → `semantic → stroke/strong`
- [ ] connector fill → `semantic → stroke/muted`
- [ ] timestamp fill → `semantic → text/muted`, font → `Miles/Caption 2`

---

## card/score-update-civic

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/panel` (12px)

### card/score-update-civic/ask-miles-button

- [ ] fill → `semantic → surface/subtle`
- [ ] border → `semantic → stroke/muted`
- [ ] fill (text) → `semantic → text/muted`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] font → `Miles/Badge`

### card/score-update-civic/vehicle-circle

- [ ] fill → `primitives → color/red/600` (#9b1c1c) ⚠️ AMBIGUOUS — Civic vehicleColor hardcoded; no semantic alias
- [ ] fill (text) → `primitives → color/white`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] width / height → 36px (size-9)

### card/score-update-civic/vehicle-label — "Civic"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption` (12px / 500 / 18px)

### card/score-update-civic/event-label — "Miles Score updated"

- [ ] fill (text) → `semantic → text/primary`
- [ ] font → `Miles/Subheadline Bold` (14px / 600 / 14px)

### card/score-update-civic/score-chip — "79"

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2`

### card/score-update-civic/delta-chip — "+1"

- [ ] fill → `semantic → surface/subtle`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] fill (text) → `semantic → semantic/success`
- [ ] font → `Miles/Caption 2` + semibold weight

---

## timeline/entry/score-rav4

*(Yesterday 11:30 PM)*

- [ ] dot fill → `semantic → stroke/strong`
- [ ] connector fill → `semantic → stroke/muted`
- [ ] timestamp fill → `semantic → text/muted`, font → `Miles/Caption 2`

---

## card/score-update-rav4

*(Same structure as card/score-update-civic)*

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/panel` (12px)

### card/score-update-rav4/vehicle-circle

- [ ] fill → `primitives → color/blue/300` (#6b8cae) ⚠️ AMBIGUOUS — RAV4 vehicleColor #6b8cae not in token set exactly; closest is blue/300
- [ ] fill (text) → `primitives → color/white`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] width / height → 36px

### card/score-update-rav4/delta-chip — "−1"

- [ ] fill → `semantic → surface/subtle`
- [ ] fill (text) → `semantic → semantic/warning`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] font → `Miles/Caption 2` + semibold weight

*(All other properties identical to card/score-update-civic — apply same bindings)*

---

## timeline/entry/trip-3

*(Yesterday 6:02 PM)*

- [ ] dot fill → `semantic → stroke/strong`
- [ ] connector fill → `semantic → stroke/muted`
- [ ] timestamp fill → `semantic → text/muted`, font → `Miles/Caption 2`

---

## card/trip-activity-3

*(Same token bindings as card/trip-activity-1)*

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/panel` (12px)
- [ ] route → `semantic → text/primary`, `Miles/Subheadline Bold`
- [ ] chips → `semantic → surface/subtle`, `semantic → text/muted`, `Miles/Caption 2`

---

## timeline/entry/trip-4

*(Yesterday 8:32 AM — last entry, no connector line)*

- [ ] dot fill → `semantic → stroke/strong`
- [ ] timestamp fill → `semantic → text/muted`, font → `Miles/Caption 2`

---

## card/trip-activity-4

*(Same token bindings as card/trip-activity-1)*

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/panel` (12px)
- [ ] route → `semantic → text/primary`, `Miles/Subheadline Bold`
- [ ] chips → `semantic → surface/subtle`, `semantic → text/muted`, `Miles/Caption 2`

---

## conversation-starters

### conversation-starters/divider-line (×2)

- [ ] fill → `semantic → stroke/muted`

### conversation-starters/label — "All caught up · Ask Miles"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

### conversation-starters/prompt-card

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/panel` (12px)

#### conversation-starters/prompt-card/icon

- [ ] fill → `semantic → semantic/success` *(first prompt — score trend)*

#### conversation-starters/prompt-card/text

- [ ] fill (text) → `semantic → text/secondary`
- [ ] font → `Miles/Subheadline` (14px / 500 / 21px)

#### conversation-starters/prompt-card/chevron

- [ ] fill → `semantic → text/muted`

### conversation-starters/try-another-button

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] icon fill → `semantic → text/muted`

---

## proto-controls

*(Development-only section — token bindings still needed for accuracy)*

### proto-controls/divider

- [ ] fill → `semantic → stroke/muted`

### proto-controls/heading — "PROTO CONTROLS"

- [ ] fill (text) → `semantic → text/muted`
- [ ] font → `Miles/Micro Label` (10px / 500 / 15px / uppercase / tracking 0.025em)

### proto-controls/hub-link — "Design system hub"

- [ ] fill → `semantic → surface/card`
- [ ] border → `semantic → stroke/muted`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] fill (text) → `semantic → text/secondary`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

### proto-controls/segment-buttons (Fleet / Header action / Avatars / Todos / Footer tabs / Map style / Theme)

- [ ] active fill → `semantic → surface/strong`
- [ ] active text → `semantic → text/secondary`
- [ ] inactive text → `semantic → text/muted`
- [ ] corner-radius → `sizing → borderRadius/pill`
- [ ] font → `Miles/Caption 2` (11px / 500 / 16px)

---

## ⚠️ Ambiguous / No-Token Properties

The following properties have no direct semantic token and require a decision before linking:

| Layer | Property | Hardcoded Value | Candidates |
|---|---|---|---|
| card/trip-activity-1/vehicle-badge | fill | `#6b8cae` (RAV4 color) | `primitives → color/blue/300` or add `semantic → vehicle/rav4` |
| card/trip-activity-2/vehicle-badge | fill | `#9b1c1c` (Civic color) | `primitives → color/red/600` or add `semantic → vehicle/civic` |
| card/score-update-civic/vehicle-circle | fill | `#9b1c1c` | Same as above |
| card/score-update-rav4/vehicle-circle | fill | `#6b8cae` | Same as above |
| surface/card (dark) | fill | `#0a0a0a` | `semantic → surface/card` OR `semantic → background` — **identical in dark mode** |

> **Recommendation:** Add two vehicle-color tokens to `semantic-light.json` / `semantic-dark.json`:
> ```json
> "vehicle": {
>   "civic":  { "$value": "#9b1c1c", "$type": "color" },
>   "rav4":   { "$value": "#6b8cae", "$type": "color" }
> }
> ```
> This eliminates all `primitives` references in the activity feed.

---

> **Designer checklist — final steps**
>
> 1. Apply `Miles/*` text styles to every text layer (Figma → right panel → Text Style picker)
> 2. Bind all color properties to variables from the semantic collection
> 3. Toggle Light ↔ Dark in the Variables panel → every surface, stroke, and text layer should respond without any overrides remaining
> 4. Spot-check that `surface/card` (#0a0a0a dark / #ffffff light) and `background` (#0a0a0a dark / #fafafa light) resolve differently in light mode — they diverge there
> 5. Confirm vehicle badge colors are either primitives or new semantic vehicle tokens (do not leave as raw hex)

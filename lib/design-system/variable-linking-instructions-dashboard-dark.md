# Variable Linking Instructions — Dashboard (Dark Mode)
# MILES-UI-01 · rrz0uuxSSS51NZGgMsXnqc
# Light reference frame: node 87:1637 · Dark capture frame: node 89:2

Work top-to-bottom. For each row: select the layer → open the Fill / Stroke /
Text color property → click the swatch → switch from hex to the variable listed.

**Before you start:**
- Run the Miles Hub Plugin to push all variables and text styles into Figma.
- Set the frame's variable mode to **Dark** (select frame → right panel → variable collection → Dark).
- After finishing, toggle to Light — anything that doesn't change is still hardcoded.
- Use **Edit → Select all with same fill** to batch-select layers sharing a color.

> Dark mode token values for reference:
> background `#0a0a0a` · surface/card `#0a0a0a` · surface/subtle `#171717` ·
> surface/strong `#262626` · text/primary `#f5f5f5` · text/secondary `#d4d4d4` ·
> text/muted `#a3a3a3` · stroke/muted `#262626` · stroke/strong `#404040`

---

## Dark mode — what actually changes

All semantic tokens respond automatically to the Dark mode switch **if** they are correctly variable-linked. The table below shows the values that will flip. Primitives (`color/black`, `color/white`, `color/green/*`) and sizing tokens never change.

| Token | Light value | Dark value |
|---|---|---|
| `semantic → background` | `#fafafa` | `#0a0a0a` |
| `semantic → foreground` | `#0a0a0a` | `#f5f5f5` |
| `semantic → surface/card` | `#ffffff` | `#0a0a0a` |
| `semantic → surface/subtle` | `#f5f5f5` | `#171717` |
| `semantic → surface/strong` | `#e5e5e5` | `#262626` |
| `semantic → text/primary` | `#0a0a0a` | `#f5f5f5` |
| `semantic → text/secondary` | `#404040` | `#d4d4d4` |
| `semantic → text/muted` | `#737373` | `#a3a3a3` |
| `semantic → text/inverse` | `#fafafa` | `#0a0a0a` |
| `semantic → stroke/muted` | `#e5e5e5` | `#262626` |
| `semantic → stroke/strong` | `#d4d4d4` | `#404040` |
| `semantic → semantic/success` | `#16a34a` | `#4ade80` |
| `semantic → semantic/info` | `#2563eb` | `#93c5fd` |
| `semantic → semantic/warning` | `#ca8a04` | `#facc15` |
| `semantic → semantic/danger` | `#dc2626` | `#f87171` |

> **Bottom nav note (dark):** Use `UIBlurEffect(.systemUltraThinMaterialDark)` instead of `.systemMaterial` for the frosted glass.

---

## Variable notation

| Collection | Contents |
|---|---|
| `semantic` | Surfaces, text, strokes, status colors — responds to Light/Dark mode |
| `primitives` | Raw palette — always the same regardless of mode |
| `sizing` | Spacing, radius, border width, opacity, shadow |

---

## 0 — Page / outermost frame

| Layer | Property | Variable |
|---|---|---|
| Page frame | Fill | `semantic → background` |

---

## 1 — Header

| Layer | Property | Variable |
|---|---|---|
| "Miles" h1 | Text color | `semantic → text/primary` |
| "Miles" h1 | Text style | `Miles/Large Title` |
| Profile pill (hover bg) | Fill | `semantic → surface/subtle` |
| "Chris M." label | Text color | `semantic → text/secondary` |
| "Chris M." label | Text style | `Miles/Subheadline` |
| Profile avatar circle | Fill | `semantic → semantic/success` |
| Avatar initials "CM" | Text color | `semantic → background` |
| Avatar initials | Text style | `Miles/Caption 2` |

---

## 2 — Fleet Map card

| Layer | Property | Variable |
|---|---|---|
| Map card container | Stroke | `semantic → stroke/muted` |
| Map card container | Stroke width | `sizing → borderWidth/hairline` |
| Map card container | Corner radius | `sizing → borderRadius/card` |
| Map card container | Drop shadow | `sizing → boxShadow/card` ¹ |
| Bottom gradient — start color | Fill | `primitives → color/black` @ `sizing → opacity/50` |
| "2 vehicles · all parked" text | Text color | `semantic → text/inverse` |
| Overlay text | Text style | `Miles/Caption` |

---

## 3 — "VEHICLES" section label

| Layer | Property | Variable |
|---|---|---|
| "VEHICLES" text | Text color | `semantic → text/muted` |
| "VEHICLES" text | Text style | `Miles/Section Header` |

---

## 4 — Vehicle card: Civic (parked)

| Layer | Property | Variable |
|---|---|---|
| Card container | Fill | `semantic → surface/card` |
| Card container | Stroke | `semantic → stroke/muted` |
| Card container | Stroke width | `sizing → borderWidth/hairline` |
| Card container | Corner radius | `sizing → borderRadius/card` |
| "Civic" name | Text color | `semantic → text/primary` |
| "Civic" name | Text style | `Miles/Subheadline Bold` |
| "Parked" badge | Fill | `semantic → semantic/info` |
| "Parked" badge text | Text color | `semantic → background` |
| "Parked" badge | Corner radius | `sizing → borderRadius/pill` |
| "Parked" badge | Text style | `Miles/Badge` |
| "2019 Honda Civic Sport" | Text color | `semantic → text/muted` |
| Year / make / model | Text style | `Miles/Caption Muted` |
| "Home · Parked Just now" | Text color | `semantic → text/muted` |
| Location line | Text style | `Miles/Caption Muted` |
| Chevron icon | Color | `semantic → stroke/muted` |
| **Bento cell — Miles Score** | Fill | `semantic → surface/subtle` |
| **Bento cell — Miles Score** | Corner radius | `sizing → borderRadius/control` |
| "MILES SCORE" label | Text color | `semantic → text/muted` |
| "MILES SCORE" label | Text style | `Miles/Caption 2` |
| Score dot | Fill | `semantic → semantic/success` |
| Score value "82" | Text color | `semantic → semantic/success` |
| Score value | Text style | `Miles/Subheadline Bold` |
| **Bento cell — Engine** | Fill | `semantic → surface/subtle` |
| **Bento cell — Engine** | Corner radius | `sizing → borderRadius/control` |
| "ENGINE" label | Text color | `semantic → text/muted` |
| "ENGINE" label | Text style | `Miles/Caption 2` |
| Engine dot (good) | Fill | `semantic → semantic/success` |
| "Good" value | Text color | `semantic → semantic/success` |
| "Good" value | Text style | `Miles/Subheadline Bold` |
| **Bento cell — Fuel** | Fill | `semantic → surface/subtle` |
| **Bento cell — Fuel** | Corner radius | `sizing → borderRadius/control` |
| "FUEL" label | Text color | `semantic → text/muted` |
| "FUEL" label | Text style | `Miles/Caption 2` |
| Fuel dot (>30%) | Fill | `semantic → semantic/success` |
| Fuel dot (≤30%) | Fill | `semantic → semantic/warning` |
| Fuel % (>30%) | Text color | `semantic → text/primary` |
| Fuel % (≤30%) | Text color | `semantic → semantic/warning` |
| Fuel % | Text style | `Miles/Subheadline Bold` |

---

## 5 — Vehicle card: RAV4 (live trip)

| Layer | Property | Variable |
|---|---|---|
| Card container | Fill | `semantic → surface/card` |
| Card container | Stroke | `semantic → stroke/muted` |
| Card container | Stroke width | `sizing → borderWidth/hairline` |
| Card container | Corner radius | `sizing → borderRadius/card` |
| "RAV4" name | Text color | `semantic → text/primary` |
| "RAV4" name | Text style | `Miles/Subheadline Bold` |
| "Driving" badge | Fill | `semantic → semantic/success` |
| "Driving" badge text | Text color | `semantic → background` |
| "Driving" badge | Corner radius | `sizing → borderRadius/pill` |
| "Driving" badge | Text style | `Miles/Badge` |
| "Live" badge container | Fill | `primitives → color/green/400` @ `sizing → opacity/20` |
| "Live" badge text | Text color | `semantic → semantic/success` |
| "Live" badge text | Text style | `Miles/Badge` |
| Live ping dot — outer | Fill | `primitives → color/green/400` |
| Live ping dot — inner | Fill | `primitives → color/green/600` |
| Fuel dot (≤30%) | Fill | `semantic → semantic/warning` |
| "38%" fuel | Text color | `semantic → semantic/warning` |
| **Live trip strip** | Fill | `semantic → surface/subtle` |
| **Live trip strip** | Stroke | `semantic → stroke/muted` |
| **Live trip strip** | Stroke width | `sizing → borderWidth/hairline` |
| **Live trip strip** | Corner radius | `sizing → borderRadius/panel` |
| Driver avatar circle | Fill | `semantic → semantic/success` |
| Driver initials | Text color | `semantic → background` |
| Driver initials | Text style | `Miles/Caption 2` |
| "Jack is driving" | Text color | `semantic → semantic/success` |
| "Jack is driving" | Text style | `Miles/Subheadline Bold` |
| "12 mins ago" | Text color | `semantic → semantic/success` |
| "12 mins ago" | Text style | `Miles/Caption Muted` |
| Speed "34" | Text color | `semantic → semantic/success` |
| Speed number | Text style | `Miles/Stat — Medium` |
| "mph" | Text color | `semantic → semantic/success` |
| "mph" | Text style | `Miles/Caption 2` |
| Strip chevron | Color | `semantic → semantic/success` |

---

## 6 — Recent Trips

| Layer | Property | Variable |
|---|---|---|
| "RECENT TRIPS" label | Text color | `semantic → text/muted` |
| "RECENT TRIPS" label | Text style | `Miles/Section Header` |
| "See all" link | Text color | `semantic → semantic/info` |
| "See all" | Text style | `Miles/Caption` |
| Trip list container | Fill | `semantic → surface/card` |
| Trip list container | Stroke | `semantic → stroke/muted` |
| Trip list container | Stroke width | `sizing → borderWidth/hairline` |
| Trip list container | Corner radius | `sizing → borderRadius/panel` |
| Row dividers | Stroke | `semantic → stroke/muted` |
| Row dividers | Stroke width | `sizing → borderWidth/hairline` |
| Driver initials avatar | Fill | `semantic → surface/subtle` |
| Driver initials text | Text color | `semantic → text/secondary` |
| Driver initials | Text style | `Miles/Caption 2` |
| Timestamps | Text color | `semantic → text/muted` |
| Timestamps | Text style | `Miles/Caption Muted` |
| From / to address | Text color | `semantic → text/primary` |
| Address text | Text style | `Miles/Body` |
| Row chevron | Color | `semantic → stroke/muted` |

---

## 7 — From Miles (coaching carousel)

| Layer | Property | Variable |
|---|---|---|
| "FROM MILES" label | Text color | `semantic → text/muted` |
| "FROM MILES" label | Text style | `Miles/AI Label` |
| Coaching card | Fill | `semantic → surface/subtle` |
| Coaching card | Stroke | `semantic → stroke/muted` |
| Coaching card | Stroke width | `sizing → borderWidth/hairline` |
| Coaching card | Corner radius | `sizing → borderRadius/panel` |
| Coaching card | Drop shadow | `sizing → boxShadow/card` ¹ |
| Miles avatar circle | Fill | `semantic → surface/strong` |
| Message text | Text color | `semantic → text/secondary` |
| Message text | Text style | `Miles/AI Body` |
| "Chat with Miles" button | Fill | `semantic → foreground` |
| "Chat with Miles" button | Corner radius | `sizing → borderRadius/control` |
| "Chat with Miles" text | Text color | `semantic → background` |
| "Chat with Miles" text | Text style | `Miles/Subheadline Bold` |
| "Dismiss" text | Text color | `semantic → text/muted` |
| "Dismiss" | Text style | `Miles/Caption` |
| Carousel dot — active | Fill | `semantic → text/primary` |
| Carousel dots — inactive | Fill | `semantic → stroke/strong` |

---

## 8 — Bottom Nav

| Layer | Property | iOS / system equivalent |
|---|---|---|
| Nav bar | Fill (frosted glass) | `.systemBackground` + `UIBlurEffect(.systemUltraThinMaterialDark)` |
| Nav bar top border | Stroke | `UIColor.separator` |
| Active tab | Color | `semantic → semantic/info` |
| Inactive tab | Color | `semantic → text/muted` |

---

## 9 — Text styles: full pass

| Text style | Applied to |
|---|---|
| `Miles/Large Title` | "Miles" h1 |
| `Miles/Subheadline Bold` | Vehicle names, stat values, driver name, button labels |
| `Miles/Subheadline` | Nav tab labels, "Chris M." |
| `Miles/Section Header` | "VEHICLES", "RECENT TRIPS", "FROM MILES" |
| `Miles/Body` | Trip from/to addresses |
| `Miles/Stat — Medium` | Live trip speed number |
| `Miles/Caption` | "See all", "Dismiss" |
| `Miles/Caption Muted` | Timestamps, year/make/model, location subtitles |
| `Miles/Caption 2` | Bento stat keys, "mph", avatar initials |
| `Miles/Badge` | "Live" pill |
| `Miles/AI Body` | Coaching card message |
| `Miles/AI Label` | "FROM MILES" header |

---

## 10 — Spacing & radius audit (final pass)

| Element | Property | Variable |
|---|---|---|
| Page horizontal padding | Padding L + R | `sizing → spacing/5` (20px) |
| Section vertical gaps | Gap | `sizing → spacing/4` (16px) |
| Card internal padding | Padding | `sizing → spacing/4` (16px) |
| Bento cell padding | Padding | `sizing → spacing/3` (12px) |
| Live trip strip padding | Padding | `sizing → spacing/3` (12px) |
| All card borders | Stroke width | `sizing → borderWidth/hairline` (1px) |
| Vehicle cards, map container | Corner radius | `sizing → borderRadius/card` (16px) |
| Inner cards, trip rows, strips | Corner radius | `sizing → borderRadius/panel` (12px) |
| Buttons, bento cells | Corner radius | `sizing → borderRadius/control` (8px) |
| Avatars, badges, pills | Corner radius | `sizing → borderRadius/pill` (9999px) |

---

> **¹ Drop shadow note:** `sizing → boxShadow/card` is a STRING variable.
> Apply manually: Y offset 24, blur 70, spread 0, color black @ 8% opacity.

---

## Quick hex → variable reference (dark mode values)

| Hex (dark) | Variable |
|---|---|
| `#0a0a0a` | `semantic → background` |
| `#0a0a0a` | `semantic → surface/card` |
| `#171717` | `semantic → surface/subtle` |
| `#262626` | `semantic → surface/strong` |
| `#262626` | `semantic → stroke/muted` |
| `#404040` | `semantic → stroke/strong` |
| `#f5f5f5` | `semantic → text/primary` |
| `#d4d4d4` | `semantic → text/secondary` |
| `#a3a3a3` | `semantic → text/muted` |
| `#0a0a0a` | `semantic → text/inverse` |
| `#4ade80` | `semantic → semantic/success` |
| `#facc15` | `semantic → semantic/warning` |
| `#f87171` | `semantic → semantic/danger` |
| `#93c5fd` | `semantic → semantic/info` |
| `#03ff7f` | `primitives → color/green/brand-dark` |
| `#000000` | `primitives → color/black` |
| `#ffffff` | `primitives → color/white` |

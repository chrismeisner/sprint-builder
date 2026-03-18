# Variable Linking Instructions — Dashboard (Parked State)
# Target file: MILES-UI-01 (rrz0uuxSSS51NZGgMsXnqc) · node 40:2183

Work through this checklist top-to-bottom after the capture lands in Figma.
For each row: select the layer → open Fill / Stroke / Text color → swap
the hardcoded hex to the variable listed.

**Tip:** Use Edit → Select all with same fill to batch-select layers sharing
the same color before swapping. After each section, toggle Light ↔ Dark
mode in the variable panel — anything that doesn't change is still hardcoded.

---

## 0 — Page / Outermost Frame

| Layer | Property | Variable |
|---|---|---|
| Page / frame background | Fill | `semantic/background` |

---

## 1 — Header

| Layer | Property | Variable |
|---|---|---|
| "Miles" h1 | Text color | `semantic/text-primary` |
| Profile pill container (hover bg) | Fill | `semantic/surface-subtle` |
| "Chris M." label | Text color | `semantic/text-secondary` |
| Profile avatar circle | Fill | `semantic/success` |
| Avatar initials "CM" | Text color | `semantic/text-inverse` |

---

## 2 — Fleet Map Card

| Layer | Property | Variable |
|---|---|---|
| Map card outer container | Stroke / border | `semantic/stroke-muted` |
| Map card outer container | Corner radius | `sizing/radius/card` (16px) |
| Bottom gradient overlay | Fill — from color | `primitive/color/black` @ 50% opacity |
| "2 vehicles · all parked" text | Text color | `semantic/text-inverse` |

---

## 3 — "VEHICLES" Section Label

| Layer | Property | Variable |
|---|---|---|
| "VEHICLES" uppercase label | Text color | `semantic/text-muted` |

---

## 4 — Vehicle Card: Civic (Parked)

| Layer | Property | Variable |
|---|---|---|
| Card container | Fill | `semantic/surface-card` |
| Card container | Stroke | `semantic/stroke-muted` |
| Card container | Corner radius | `sizing/radius/card` (16px) |
| "Civic" name | Text color | `semantic/text-primary` |
| "2019 Honda Civic Sport" | Text color | `semantic/text-muted` |
| "Home · Parked Just now" | Text color | `primitive/color/neutral/300` |
| Chevron → icon | Stroke | `semantic/stroke-muted` |
| **Bento cell — Miles Score** | Fill | `semantic/surface-subtle` |
| **Bento cell — Miles Score** | Stroke | `primitive/color/neutral/100` |
| **Bento cell — Miles Score** | Corner radius | `sizing/radius/panel` (12px) |
| "Miles Score" label | Text color | `semantic/text-muted` |
| Score status dot | Fill | `semantic/success` |
| Score value "82" | Text color | `semantic/success` |
| **Bento cell — Engine** | Fill | `semantic/surface-subtle` |
| **Bento cell — Engine** | Stroke | `primitive/color/neutral/100` |
| **Bento cell — Engine** | Corner radius | `sizing/radius/panel` (12px) |
| "Engine" label | Text color | `semantic/text-muted` |
| Engine dot | Fill | `semantic/success` |
| "Good" text | Text color | `semantic/success` |
| **Bento cell — Fuel** | Fill | `semantic/surface-subtle` |
| **Bento cell — Fuel** | Stroke | `primitive/color/neutral/100` |
| **Bento cell — Fuel** | Corner radius | `sizing/radius/panel` (12px) |
| "Fuel" label | Text color | `semantic/text-muted` |
| Fuel dot (>30%) | Fill | `semantic/success` |
| "62%" text | Text color | `semantic/text-primary` |

---

## 5 — Vehicle Card: RAV4 (Live Trip)

> Same card structure as Civic above — apply the same tokens. Extra elements:

| Layer | Property | Variable |
|---|---|---|
| Card container | Fill | `semantic/surface-card` |
| Card container | Stroke | `semantic/stroke-muted` |
| "RAV4" name | Text color | `semantic/text-primary` |
| "Live" badge container | Fill | `primitive/color/green/100` |
| "Live" badge text | Text color | `primitive/color/green/700` |
| Pulsing dot — outer ring | Fill | `primitive/color/green/400` |
| Pulsing dot — inner | Fill | `primitive/color/green/500` |
| Fuel dot (≤30%) | Fill | `semantic/warning` |
| "38%" fuel text | Text color | `semantic/warning` |
| Engine dot (good) | Fill | `semantic/success` |
| **Live trip strip** | Fill | `primitive/color/green/50` |
| **Live trip strip** | Stroke | `primitive/color/green/200` |
| **Live trip strip** | Corner radius | `sizing/radius/panel` (12px) |
| Driver avatar circle | Fill | `primitive/color/green/600` |
| Driver initials "J" | Text color | `semantic/text-inverse` |
| "Jack is driving" text | Text color | `primitive/color/green/900` |
| "12 mins ago" subtext | Text color | `primitive/color/green/700` |
| Speed "34 mph" number | Text color | `primitive/color/green/900` |
| "mph" unit label | Text color | `primitive/color/green/700` |
| Strip chevron icon | Stroke | `primitive/color/green/500` |

---

## 6 — Recent Trips

| Layer | Property | Variable |
|---|---|---|
| "RECENT TRIPS" label | Text color | `semantic/text-muted` |
| "See all" link | Text color | `semantic/info` |
| Trip list outer container | Fill | `semantic/surface-card` |
| Trip list outer container | Stroke | `semantic/stroke-muted` |
| Trip list outer container | Corner radius | `sizing/radius/panel` (12px) |
| Row dividers | Stroke | `primitive/color/neutral/100` |
| Driver initials avatar | Fill | `semantic/surface-subtle` |
| Driver initials text | Text color | `semantic/text-secondary` |
| Start / end time text | Text color | `semantic/text-muted` |
| From / to address text | Text color | `semantic/text-primary` |
| Row chevron icon | Stroke | `semantic/stroke-muted` |

---

## 7 — From Miles (Coaching Carousel)

| Layer | Property | Variable |
|---|---|---|
| "FROM MILES" section label | Text color | `semantic/text-muted` |
| Coaching card container | Fill | `primitive/color/green/50` |
| Coaching card container | Stroke | `primitive/color/green/200` |
| Coaching card container | Corner radius | `sizing/radius/panel` (12px) |
| Miles avatar circle | Fill | `primitive/color/green/100` |
| Coaching message body text | Text color | `primitive/color/green/800` |
| "Chat with Miles" button | Fill | `primitive/color/green/600` |
| "Chat with Miles" button text | Text color | `semantic/text-inverse` |
| "Chat with Miles" button | Corner radius | `sizing/radius/control` (8px) |
| "Dismiss" button text | Text color | `primitive/color/green/700` |
| Carousel active dot | Fill | `semantic/text-primary` |
| Carousel inactive dots | Fill | `semantic/stroke-strong` |

---

## 8 — Bottom Nav

| Layer | Property | Variable |
|---|---|---|
| Nav bar container | Fill | `semantic/surface-card` |
| Nav bar top border | Stroke | `semantic/stroke-muted` |
| Active tab icon | Fill / Stroke | `semantic/text-primary` |
| Active tab label | Text color | `semantic/text-primary` |
| Inactive tab icons | Fill / Stroke | `semantic/text-muted` |
| Inactive tab labels | Text color | `semantic/text-muted` |

---

## 9 — Spacing & Radius Audit (second pass)

After fills are done, audit auto-layout padding and gap values:

| Element | Property | Variable |
|---|---|---|
| Page horizontal padding | Padding left + right | `sizing/spacing/5` (20px) |
| Section vertical gaps | Gap | `sizing/spacing/4` (16px) |
| Card internal padding | Padding | `sizing/spacing/4` (16px) |
| Bento cell padding | Padding | `sizing/spacing/3` (12px) |
| Live trip strip padding | Padding | `sizing/spacing/3` (12px) |
| Vehicle cards | Corner radius | `sizing/radius/card` (16px) |
| Inner cards / trip rows / strips | Corner radius | `sizing/radius/panel` (12px) |
| CTA buttons | Corner radius | `sizing/radius/control` (8px) |
| Avatars / badges / pills | Corner radius | `sizing/radius/full` |

---

## Quick hex → variable lookup

For any icon strokes or layers not listed above, match by raw color:

| Hex | Variable |
|---|---|
| `#fafafa` | `semantic/background` |
| `#ffffff` | `semantic/surface-card` |
| `#f5f5f5` | `semantic/surface-subtle` |
| `#e5e5e5` | `semantic/stroke-muted` |
| `#d4d4d4` | `semantic/stroke-strong` |
| `#0a0a0a` | `semantic/text-primary` |
| `#404040` | `semantic/text-secondary` |
| `#737373` | `semantic/text-muted` |
| `#16a34a` | `semantic/success` |
| `#ca8a04` | `semantic/warning` |
| `#dc2626` | `semantic/danger` |
| `#2563eb` | `semantic/info` |

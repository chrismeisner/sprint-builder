# Variable Linking Instructions — Dashboard (Parked State)
# Miles Proto 2 → Figma

After the dashboard is captured into Figma, work through this checklist
section by section. For each item: select the layer, find the property
(Fill / Stroke / Text color), and swap the hardcoded hex to the variable listed.

Key: **`collection/variable-name`** → the variable to assign.
Check each box as you go. Nothing should be left unlinked by the end.

---

## 0 — Page / Frame

| Layer | Property | Variable |
|---|---|---|
| Page frame (outermost) | Fill | `semantic/background` |

---

## 1 — Header

| Layer | Property | Variable |
|---|---|---|
| "Miles" text | Text color | `semantic/text-primary` |
| Profile button container | Fill (hover) | `semantic/surface-subtle` |
| "Chris M." label | Text color | `semantic/text-secondary` |
| Profile avatar circle | Fill | `semantic/success` |
| Profile avatar initials "CM" | Text color | `semantic/text-inverse` |

---

## 2 — Fleet Map Card

| Layer | Property | Variable |
|---|---|---|
| Map card container | Stroke / Border | `semantic/stroke-muted` |
| Map card container | Corner radius | `sizing/radius/2xl` |
| Gradient overlay (bottom) | Fill (from) | `primitive/color/black` @ 50% opacity |
| "2 vehicles · all parked" label | Text color | `semantic/text-inverse` |

---

## 3 — "VEHICLES" Section Label

| Layer | Property | Variable |
|---|---|---|
| "VEHICLES" text | Text color | `semantic/text-muted` |

---

## 4 — Vehicle Card — Civic (Parked)

| Layer | Property | Variable |
|---|---|---|
| Card container | Fill | `semantic/surface-card` |
| Card container | Stroke | `semantic/stroke-muted` |
| Card container | Corner radius | `sizing/radius/2xl` |
| "Civic" name text | Text color | `semantic/text-primary` |
| "2019 Honda Civic Sport" text | Text color | `semantic/text-muted` |
| "Home · Parked Just now" text | Text color | `primitive/color/neutral/300` |
| Chevron icon | Stroke | `semantic/stroke-strong` |
| **Bento — Miles Score cell** | Fill | `semantic/surface-subtle` |
| **Bento — Miles Score cell** | Stroke | `primitive/color/neutral/100` |
| **Bento — Miles Score cell** | Corner radius | `sizing/radius/xl` |
| "Miles Score" label | Text color | `semantic/text-muted` |
| Score status dot | Fill | `semantic/success` |
| Score value "82" | Text color | `semantic/success` |
| **Bento — Engine cell** | Fill | `semantic/surface-subtle` |
| **Bento — Engine cell** | Stroke | `primitive/color/neutral/100` |
| "Engine" label | Text color | `semantic/text-muted` |
| Engine dot (good) | Fill | `semantic/success` |
| "Good" text | Text color | `semantic/success` |
| **Bento — Fuel cell** | Fill | `semantic/surface-subtle` |
| **Bento — Fuel cell** | Stroke | `primitive/color/neutral/100` |
| "Fuel" label | Text color | `semantic/text-muted` |
| Fuel dot (>30%) | Fill | `semantic/success` |
| "62%" text | Text color | `semantic/text-primary` |

---

## 5 — Vehicle Card — RAV4 (Live Trip)

> Same structure as Civic. Additional elements for the live trip strip:

| Layer | Property | Variable |
|---|---|---|
| Card container | Fill | `semantic/surface-card` |
| Card container | Stroke | `semantic/stroke-muted` |
| "RAV4" name text | Text color | `semantic/text-primary` |
| "Live" badge container | Fill | `primitive/color/green/100` |
| "Live" badge text | Text color | `primitive/color/green/700` |
| Pulsing dot (outer ring) | Fill | `primitive/color/green/400` |
| Pulsing dot (inner) | Fill | `primitive/color/green/500` |
| Fuel dot (≤30%, attention) | Fill | `semantic/warning` |
| "38%" fuel text | Text color | `semantic/warning` |
| **Live trip strip container** | Fill | `primitive/color/green/50` |
| **Live trip strip container** | Stroke | `primitive/color/green/200` |
| **Live trip strip container** | Corner radius | `sizing/radius/xl` |
| Driver avatar circle | Fill | `primitive/color/green/600` |
| Driver avatar initials | Text color | `semantic/text-inverse` |
| "Jack is driving" text | Text color | `primitive/color/green/900` |
| "12 mins ago" text | Text color | `primitive/color/green/700` |
| Speed "34" number | Text color | `primitive/color/green/900` |
| "mph" unit | Text color | `primitive/color/green/700` |
| Strip chevron | Stroke | `primitive/color/green/500` |

---

## 6 — Recent Trips

| Layer | Property | Variable |
|---|---|---|
| "RECENT TRIPS" label | Text color | `semantic/text-muted` |
| "See all" link | Text color | `semantic/info` |
| Trip list container | Fill | `semantic/surface-card` |
| Trip list container | Stroke | `semantic/stroke-muted` |
| Trip list container | Corner radius | `sizing/radius/xl` |
| Dividers between trip rows | Stroke | `primitive/color/neutral/100` |
| **Each TripListItem row:** | | |
| Driver initials avatar | Fill | `semantic/surface-subtle` |
| Driver initials text | Text color | `semantic/text-secondary` |
| Start/end time texts | Text color | `semantic/text-muted` |
| From/to address texts | Text color | `semantic/text-primary` |
| Row chevron | Stroke | `semantic/stroke-muted` |

---

## 7 — From Miles (Coaching Carousel)

| Layer | Property | Variable |
|---|---|---|
| "FROM MILES" label | Text color | `semantic/text-muted` |
| Coaching card container | Fill | `primitive/color/green/50` |
| Coaching card container | Stroke | `primitive/color/green/200` |
| Coaching card container | Corner radius | `sizing/radius/xl` |
| Miles avatar circle | Fill | `primitive/color/green/100` |
| Coaching message text | Text color | `primitive/color/green/800` |
| "Chat with Miles" button | Fill | `primitive/color/green/600` |
| "Chat with Miles" button | Text color | `semantic/text-inverse` |
| "Chat with Miles" button | Corner radius | `sizing/radius/lg` |
| "Dismiss" button | Text color | `primitive/color/green/700` |
| Carousel dot (active) | Fill | `semantic/text-primary` |
| Carousel dot (inactive) | Fill | `semantic/stroke-strong` |

---

## 8 — Bottom Nav

| Layer | Property | Variable |
|---|---|---|
| Nav bar container | Fill | `semantic/surface-card` |
| Nav bar container | Stroke (top border) | `semantic/stroke-muted` |
| Active tab icon | Fill / Stroke | `semantic/text-primary` |
| Active tab label | Text color | `semantic/text-primary` |
| Inactive tab icon | Fill / Stroke | `semantic/text-muted` |
| Inactive tab label | Text color | `semantic/text-muted` |

---

## 9 — Spacing & Radius Audit

Once fills are done, do a second pass on layout:

| Element | Property | Variable |
|---|---|---|
| Page horizontal padding | Padding left/right | `sizing/spacing/5` (20px) |
| Section vertical gaps | Gap | `sizing/spacing/4` (16px) |
| Card internal padding | Padding | `sizing/spacing/4` (16px) |
| Bento cell internal padding | Padding | `sizing/spacing/3` (12px) |
| Vehicle card radius | Corner radius | `sizing/radius/2xl` (16px) |
| Inner cards / trip rows | Corner radius | `sizing/radius/xl` (12px) |
| Buttons (CTA) | Corner radius | `sizing/radius/lg` (8px) |
| Avatars / badges | Corner radius | `sizing/radius/full` (9999px) |

---

## Tips for the linking pass

- Use **Edit → Select all with same fill** to batch-select layers sharing the same color
- Work top-to-bottom through this doc — it matches the visual layer order
- For nested fills (e.g. bento cells inside a card), select children individually
- Anything not listed here is likely an icon stroke — match by color value:
  - `#d4d4d4` / `#e5e5e5` → `semantic/stroke-muted` or `stroke-strong`
  - `#a3a3a3` / `#737373` → `semantic/text-muted`
  - `#0a0a0a` → `semantic/text-primary`
  - `#ffffff` → `semantic/surface-card` or `text-inverse`
- After each section, toggle **Light → Dark** mode in the variable panel to confirm all swapped tokens respond correctly

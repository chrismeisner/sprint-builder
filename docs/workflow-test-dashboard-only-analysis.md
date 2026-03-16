# Workflow test: Dashboard-only scope

Analysis of running the [Prototype → Structured Figma → Styled Implementation](workflow-prototype-to-styled-implementation.md) workflow as a test using **only** the Miles prototype dashboard page:

**Test URL:** `http://localhost:3000/sandboxes/miles-proto-2/dashboard`

---

## 1. Why the dashboard is a good test surface

The dashboard page is a strong candidate for a single-page workflow test:

| Criterion | Dashboard |
|-----------|-----------|
| **Structure** | Clear hierarchy: header, map, vehicles section, recent trips, coaching carousel, todos, quick actions. Multiple distinct UI blocks. |
| **Component reuse** | Uses shared components: `MapView`, `TripListItem`, `TodoPreview`, `Link`, plus local components (`VehicleCardContent`, `FleetView`, `AgentCoachingCard`, etc.) that could become Figma components. |
| **States** | Three explicit modes (parked / trip in progress / trip complete) with different layouts — good for testing frames and variants. |
| **Tokens in use** | Colors (neutral, green, amber, blue, red), spacing (padding, gaps), typography (sizes, weights), radius, borders. All wireframe-level but nameable. |
| **Interactions** | Tabs (proto controls, header action, footer nav), carousel, links. Enough to justify “structure + behavior” baseline. |
| **Scope** | One route, one layout, bounded set of components. No need to capture the whole app. |

**Conclusion:** The dashboard alone is sufficient to validate all four steps of the workflow. Success here can be replicated later for other routes (e.g. trips, account).

---

## 2. Dashboard structure (for Step 2 reference)

### Top-level layout

- **Shell:** `main` → `flex min-h-dvh flex-col bg-neutral-50 pb-24`
- **Content:** Conditional on `mode` (parked | trip | complete)

### Parked mode (default)

1. **FleetView**
   - Dashboard header (title “Miles”, profile CTA or roadside assist button)
   - Fleet map (MapView, aspect 3/2, gradient overlay)
   - “Vehicles” section label
   - List of vehicle cards (each: VehicleCardContent → header, bento stats, optional live-trip strip)
2. **RecentTrips** — “Recent Trips” + “See all” + list of TripListItem
3. **AgentCoachingCarousel** — “From Miles” + horizontal scroll of AgentCoachingCard + dot indicators
4. **TodoPreview** — demo todos
5. **QuickActions** — e.g. Roadside Assist (conditional)
6. **Proto controls** — mode toggle, header action toggle, footer tabs toggle (for prototype only; can be excluded from Figma)

### Trip-in-progress mode

- Trip active badge + close (optional)
- Live map (MapView with route + start/end markers)
- LiveSpeed block (speed + trip max)
- TripVehicleStatus (vehicle label + 3 stat cells)
- TripDriverCard (driver avatar, name, relation, score)

### Trip-complete mode

- Title + “Trip complete”
- Trip summary card (map thumbnail, route, stats row, driver, “View trip detail” CTA)
- Post-trip coaching card + “Show me” / “Done”
- “Back to dashboard” button

### Shared components (used by dashboard)

- `Link`, `MapView`, `TripListItem`, `TodoPreview` (from `_components/`)
- Layout: `BottomNav` in parent layout; `DeviceSwitcher`, `PageTransition` (layout level)

For a **dashboard-only** test, the “screens sent to Figma” in Step 2 would be:

- **Dashboard – Parked** (default view)
- **Dashboard – Trip in progress** (e.g. `?mode=trip&driver=Jack&vehicleLabel=Toyota+RAV4`)
- **Dashboard – Trip complete** (e.g. `?mode=complete`)
- **Hub** (once the hub route exists for the sandbox)

That gives four frames: three dashboard states + one hub reference frame.

---

## 3. Step-by-step feasibility (dashboard-only)

### Step 1 — Functional prototype and token contract

- **Part A (prototype):** Already done. The dashboard is the structural baseline. For a formal test, you could tag current state as `wireframe/v0` (or a branch) and treat the dashboard as the single page in scope.
- **Part B (token contract + hub):**
  - **Token naming:** The workflow doc suggests a convention (`color/brand/primary`, `spacing/xs`, etc.). The repo already has `lib/design-system/tokens/` with `primitives.json`, `sizing.json`, `semantic-light.json`, `semantic-dark.json` and `docs/figma-organization-for-hub-sync.md` defining collection names and path conventions. So the “contract” exists; for the test it may need to be aligned with the workflow doc (e.g. one canonical list of token names the dashboard uses).
  - **Style Dictionary:** Already in place (`style-dictionary.config.mjs` → `app/generated-tokens.css`). No single `base.json`; primitives + sizing + semantic are separate. That’s fine; the sync in Step 4 would write into these files (or a single `base.json` if you refactor).
  - **Hub:** The workflow expects a `/hub` (or `/design-system`) route that surfaces tokens, components, typography, spacing. The app has `app/projects/[id]/hub` for the main product; the sandbox does **not** yet have its own hub. For the test you need either:
    - A hub under the sandbox, e.g. `app/sandboxes/miles-proto-2/hub/page.tsx`, or
    - A shared design-system hub that the sandbox (and Figma) can point at.
  - **Versioning:** Tagging `wireframe/v0` at the end of Step 1 is straightforward.

**Gap:** Add a hub route for the sandbox (or agree on a shared hub) and ensure it shows the token set and component list that will be captured in Step 2.

---

### Step 2 — Figma structure and design guide

- **Input:** Dashboard page (three states) + hub page. Claude + Figma MCP use the **code structure** (component tree, layout, naming) to produce a Figma file with named frames/layers and a design guide.
- **Capture:** If using “screens sent to Figma” via URL capture, you’d open:
  - `http://localhost:3000/sandboxes/miles-proto-2/dashboard`
  - `http://localhost:3000/sandboxes/miles-proto-2/dashboard?mode=trip&driver=Jack&vehicleLabel=Toyota+RAV4`
  - `http://localhost:3000/sandboxes/miles-proto-2/dashboard?mode=complete`
  - `http://localhost:3000/sandboxes/miles-proto-2/hub` (once the hub exists)
  Each capture becomes a frame; naming can follow route/state (e.g. `Dashboard – Parked`, `Dashboard – Trip`, `Dashboard – Complete`, `Hub`).
- **Design guide:** Claude can derive from the dashboard code (and hub) a checklist: components (FleetView, VehicleCardContent, AgentCoachingCard, etc.), tokens (colors, spacing, type scale), and Figma organisation rules. The designer then uses this in Step 3.

**Feasibility:** Yes. Scoping to four frames (three dashboard states + hub) keeps the test bounded and still validates “prototype + hub → Figma structure + guide.”

---

### Step 3 — Style in Figma (designer)

- Designer applies the visual system to the captured frames and follows the guide. No difference from full-app workflow; scope is just “these frames and the components/tokens that appear on them.”
- **Constraint:** Keep layer and variable names consistent with Step 1 so that Step 4 can read the file and sync tokens deterministically.

**Feasibility:** Yes.

---

### Step 4 — Sync back to prototype

- Cursor + Figma MCP read the styled Figma file and:
  - Update **only** the dashboard page (and shared components it uses) to match the design.
  - Map Figma variables into `lib/design-system/tokens/` (or base.json), then regenerate Style Dictionary output.
  - Update the **hub** route so it reflects the new token values and component set.
- For a dashboard-only test, you do not need to touch other sandbox routes (trips, account, etc.); they can stay wireframe until a later pass.

**Feasibility:** Yes. The token contract from Step 1 makes the sync deterministic; the hub frame in Figma and the `/hub` route in code stay in lockstep as in the workflow doc.

---

## 4. Current state vs workflow assumptions

| Workflow doc | Current repo | Action for test |
|--------------|--------------|-----------------|
| Token contract in Step 1 | `lib/design-system/tokens/` + `figma-organization-for-hub-sync.md` | Align naming list with dashboard usage; keep or refactor to `base.json` as desired. |
| Style Dictionary → `output/css`, `output/js` | `style-dictionary.config.mjs` → `app/generated-tokens.css` | No change required; path difference is acceptable. |
| `/hub` route | No hub under `sandboxes/miles-proto-2` | Add `app/sandboxes/miles-proto-2/hub/page.tsx` (or shared hub) and scaffold token + component display. |
| Tag `wireframe/v0` | Not tagged | Tag at end of Step 1 (or use a branch). |
| “Screens sent to Figma” | — | Use dashboard (3 states) + hub (4 frames total). |

---

## 5. Summary

- **In theory, the workflow works for a dashboard-only test.** All four steps are feasible with the dashboard as the single page in scope.
- **Preconditions:**
  1. Define or confirm the token naming convention for the dashboard (and document it for Step 2/4).
  2. Add a hub route for the sandbox (or use a shared one) and implement a minimal “styles in use” view (tokens, typography, spacing, component list).
  3. Optionally tag or branch the repo as `wireframe/v0` at the end of Step 1.
- **Test execution:** Run Steps 2–4 with only the dashboard + hub in scope. Use three dashboard URLs (parked, trip, complete) + one hub URL for Figma capture; generate the design guide from the dashboard (and hub) code; style in Figma; sync back only the dashboard and hub. That validates the loop without touching the rest of the prototype.

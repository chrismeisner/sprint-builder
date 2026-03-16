# Workflow: Prototype → Structured Figma → Styled Implementation

A **4-step process** to move from a functional wireframe prototype to a production-styled implementation, with **Figma as the design source of truth** and a **front-end hub as the style reference**.

**Reference**
- **This doc:** `docs/workflow-prototype-to-styled-implementation.md`
- **Current implementation:** Miles prototype at `app/sandboxes/miles-proto-2/`; hub at `/sandboxes/miles-proto-2/hub` (full-width, max 1200px). Token contract and Figma conventions: `docs/figma-organization-for-hub-sync.md`
- **Dashboard-only test:** `docs/workflow-test-dashboard-only-analysis.md`

---

## Step 1 — Create the functional prototype and token contract (Cursor + team)

Use **Cursor** to generate a **working wireframe-level prototype** with **React / Next.js + Tailwind**, and establish the **bridge language** between Figma and the project's styling system before any design work begins.

This step has two parts that happen in sequence but belong together: build the structural baseline, then lock in the token contract so that steps 2–4 are working toward a known target.

### Part A — Functional prototype

**Goals**
- Establish layout and component hierarchy
- Implement core interactions and behavior
- Produce a browser-based prototype representing the intended structure

The prototype does not need to be high-fidelity — it needs to be **correct in structure and behavior**. It becomes the structural baseline for everything that follows.

### Part B — Token contract and initial styleguide

Before any Figma work begins, define the naming convention and file structure that connects Figma variables to the project's styling system. This prevents ambiguity in step 4 and makes each Figma sync a deterministic operation rather than a guessing exercise.

**Define the token naming convention**

Agree on how Figma variables will be named — this is the contract that must remain stable across all future iterations:

```
color/brand/primary
color/brand/secondary
color/neutral/100 … /900
spacing/xs, /sm, /md, /lg, /xl
typography/size/sm … /xl
typography/weight/regular, /medium, /bold
radius/sm, /md, /lg
shadow/sm, /md, /lg
```

**Create the Style Dictionary bridge config**

Commit a Style Dictionary (or equivalent) transform config to the repo at `lib/design-system/tokens/`. At this stage the values are wireframe-level placeholders (system fonts, neutral grays, generic spacing) — what matters is that the **token names and structure are correct**.

```
lib/
  design-system/
    tokens/
      base.json          ← raw token values (eventually sourced from Figma)
      config.json        ← Style Dictionary transform + platform outputs
    output/
      css/tokens.css     ← generated CSS variables
      js/tokens.js       ← generated JS/TS tokens
```

**Scaffold the front-end hub**

Create the `/hub` route (or `/design-system`) as a living reference surface. At this stage it reflects wireframe placeholder values. It is updated with each Figma sync and becomes the canonical "styles currently in use" reference for designers and developers.

The hub should surface:
- Current token values
- Component inventory
- Typography scale
- Spacing system

**Establish the versioning convention**

| Tag | Meaning |
|-----|---------|
| `wireframe/v0` | End of step 1 — structure, behavior, and token scaffolding |
| `design/v1` | After first step 4 sync — first styled iteration |
| `design/v2` | After second sync, and so on |

Each `design/vN` tag represents a new copy of the prototype + hub reflecting the latest Figma state.

**Output:** `wireframe/v0` — committed and tagged. Includes the working prototype, Style Dictionary config with placeholder values, and a scaffolded `/hub`.

---

## Step 2 — Generate the Figma structure and design guide (Claude + Figma MCP)

Use **Claude with Figma MCP** to analyse the prototype's component and layout structure and produce a Figma file with correctly named, organised layers — plus a design guide for the designer to follow in step 3.

> **Note on scope:** This step works from the prototype's **code structure** (component tree, layout logic, semantic naming), not from pixel-level visual capture. The output is structural scaffolding — correctly named frames and layers — not a high-fidelity visual reproduction.

**Screens sent to Figma**

Both the prototype screens and the `/hub` page are captured into Figma as named frames. Sending the hub alongside the prototype screens means the designer has a **spatially laid-out component inventory and token reference** directly in the Figma file — not just a checklist in a written guide. This makes step 3 more efficient: when defining variables and styling components, the designer can see the full token vocabulary as a live frame rather than reading it from a document.

Frames captured:
- All prototype screens (page → frames, named by route or view)
- The `/hub` page as a dedicated frame — component inventory, token list, typography scale, spacing system

**Claude will produce**
- A Figma file with assembled and named layers (page → frames → components), following the naming conventions agreed in step 1
- A design guide/checklist describing:
  - Required components and variants
  - Component hierarchy and nesting
  - Design tokens to define (referencing the token names from step 1)
  - Figma organisation rules — Auto Layout, reusable components, semantic naming
  - Conventions from `docs/figma-organization-for-hub-sync.md`

MCP provides the **structure and instructions**. The **designer implements them in Figma** in the next step.

**Output:** A structured Figma file containing prototype frames + hub frame, plus a design guide for the designer.

---

## Step 3 — Style the design in Figma (Designer)

The designer converts the structured Figma file into a **high-fidelity design** by following the guide from step 2.

**Tasks**
- Style components and apply the visual system
- Define Figma variables/tokens using the naming convention from step 1
- Create reusable components, variants, and Auto Layout structures
- Refine layout, spacing, and visual hierarchy
- Style the hub frame alongside the prototype screens — it acts as a living token and component reference within the Figma file itself

**Critical constraint**

Keep the **structure and naming intact** — layers, frames, and variable names must remain consistent with what was established in steps 1 and 2. This is what allows Figma MCP to read the file reliably in step 4 and keeps the token bridge working across iterations.

See `docs/figma-organization-for-hub-sync.md` for naming and organisation conventions.

**Output:** A high-fidelity, fully styled Figma file — prototype screens and hub frame — ready for implementation sync.

---

## Step 4 — Sync the Figma design back to the prototype (Cursor + Figma MCP)

Use **Cursor with Figma MCP** to read the styled Figma file and update the prototype's implementation. Because the token contract was established in step 1, this sync is deterministic — Cursor follows the Style Dictionary config rather than making guesses.

**Cursor will**
- Reference the relevant frames and components via MCP
- Update prototype styling to match the Figma design
- Map Figma variable values into `lib/design-system/tokens/base.json`, then regenerate Style Dictionary outputs
- Refactor components where necessary
- Report any conflicts with the existing styleguide explicitly (not silently resolve them)

**The front-end hub (`/hub`) is updated alongside the prototype**, reflecting the latest token values, component inventory, typography scale, and spacing system. The hub frame in Figma and the `/hub` route in code are kept in lockstep — each sync refreshes both. If the prototype and hub diverge, the hub wins.

**On completion, tag the release:**

```bash
git tag design/v1
```

This creates the first versioned, styled iteration — a new baseline that future Figma syncs can diff against.

**Output:** `design/v1` — production-styled prototype + updated hub, tagged in the repo.

---

## Summary

| Step | Who / What | Output |
|------|------------|--------|
| 1 | Cursor + team | Functional wireframe prototype, token naming convention, Style Dictionary bridge config, scaffolded `/hub`. Tagged `wireframe/v0`. |
| 2 | Claude + Figma MCP | Figma file with prototype frames + `/hub` frame, plus design guide. Designer uses this in step 3. |
| 3 | Designer | High-fidelity Figma design — prototype screens and hub frame styled, structure and naming preserved. |
| 4 | Cursor + Figma MCP | Styled prototype + updated hub. Figma tokens written to Style Dictionary config. Hub frame and `/hub` route kept in sync. Tagged `design/v1`. |

---

## Key principles

**The token contract is the bridge.** Naming conventions agreed in step 1 must be treated as stable. Changes to token names cascade across the Figma file, the Style Dictionary config, and the generated CSS/JS — coordinate any renames explicitly.

**The hub travels with the prototype.** The `/hub` route is not an afterthought — it is captured into Figma in step 2, styled in step 3, and synced back in step 4 alongside every prototype screen. It is the shared reference surface for both designers and developers at every stage.

**Structure before style.** Step 1 establishes what exists and what it will be called; steps 2 and 3 establish what it looks like. Keeping these phases separate prevents premature visual decisions from corrupting the structural baseline.

**Each sync produces a versioned copy.** `design/v1`, `design/v2`, etc. are not overwrites — they are new baselines. Any iteration can be diffed against its predecessor and regressions are visible.

**The hub is the ground truth for styles in use.** Designers and developers should reference `/hub`, not the Figma file, to understand what is currently live.

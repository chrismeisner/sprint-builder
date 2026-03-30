# Proposed Workflow: Dual-Artifact Design System with Token Sync

## Overview

We propose a two-artifact design workflow where a **web prototype** and a **Figma file** serve complementary roles, connected by a shared token naming contract. This approach separates interaction design from visual design while keeping them linked through a lightweight sync process.

## The Two Artifacts

### 1. Web Prototype (Next.js)

- A clickable, functional reference that defines how the product works
- Captures navigation flows, states, transitions, layout hierarchy, and interaction patterns
- Styled at wireframe fidelity (system fonts, basic spacing) — intentionally not pixel-perfect
- Serves as the **source of truth for token naming** — every typography style, color token, and spacing value is named here first
- Lives in the codebase, is version-controlled, and can be shared via URL

### 2. Figma File

- A polished, high-fidelity reference that defines how the product looks
- Refined typography (custom fonts, tuned sizes/spacing), final color palette, and visual polish
- Uses the **exact same token names** as the prototype, but with production-quality values
- Serves as the **visual source of truth** for platform development (iOS/Android)
- Leverages Figma variables and text styles to keep tokens structured and inspectable

## The Sync Layer

Between the two artifacts sits a **token sync check** — a name-level audit that ensures parity:

- Every token name in the prototype has a corresponding named style/variable in Figma
- Every style/variable in Figma maps back to a token used in the prototype
- Mismatches, orphans, and naming inconsistencies are flagged for resolution

This sync is not about copying values. The prototype and Figma intentionally carry different values for the same tokens (wireframe vs. polished). The contract is purely **name-based**.

The sync check can be run manually (comparison table) or automated via Figma MCP — pulling token names from the codebase and style names from Figma, then diffing them.

## How It Works in Practice

1. **Design & iterate in the prototype** — build screens, define interactions, name tokens as they emerge
2. **Mirror token names into Figma** — create matching text styles, color variables, and spacing tokens
3. **Refine visuals in Figma** — tune font choices, sizes, spacing, and color values to production quality
4. **Run sync check** — verify name parity between prototype and Figma; resolve gaps
5. **Version & hand off** — the prototype demonstrates behavior, Figma specifies the visual layer; together they give a platform developer everything needed to build

## What Each Artifact Answers

| Question | Answer comes from |
|----------|------------------|
| What does it do? | Web Prototype |
| How does it flow? | Web Prototype |
| What does it look like? | Figma |
| What are the exact specs? | Figma |
| What are the tokens called? | Both (must match) |

## Benefits

- **Speed** — iterate on UX in code without worrying about visual polish
- **Fidelity** — deliver pixel-perfect specs in Figma without rebuilding interactions
- **Alignment** — the shared token contract keeps both artifacts linked without tight coupling
- **AI-ready** — both artifacts are machine-readable (codebase tokens + Figma MCP), enabling automated sync checks and code generation from Figma

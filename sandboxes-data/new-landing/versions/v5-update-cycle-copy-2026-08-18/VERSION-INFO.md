# Version 5 - Update Cycle Copy (2026-08-18)

## Overview
Snapshot of the landing page as actually served at `/`. Reverts the v4 "playbook"
copy experiment and settles the post-sprint offering on "Sprint Update Cycle"
language. No structural or visual changes.

## Changes from Previous Version (v4 Playbook Direction)
- Reverted the services heading from `Let's move the ball` back to `How I Work`,
  and dropped the momentum-oriented intro paragraph that sat under it
- Renamed the post-sprint offering from `Feedback Cycles` to `Sprint Update Cycle`
- Reworded that section throughout: "refine" → "update", "incorporating feedback"
  framing tightened, Monday sync described as collecting feedback rather than reviewing it
- CTA label changed from `Start a feedback cycle` to `Start an update cycle`
- Updated the internal pricing comment to describe "update work" rather than
  "follow-on refinement work"

## What's in this version

### Key Features
- Matches the live homepage byte-for-byte at snapshot time
- Section structure unchanged from v4: Experience, Capabilities, How I Work,
  Availability, About, Projects, FAQ
- All CTA destinations unchanged (intake, `/intake/updates`, login, Cal.com)
- Samples carousel, projects table, and availability calendar remain hidden,
  carried forward from the v3 MVP decision

### Technical Details
- Built with: HTML, Tailwind CSS (CDN), vanilla JS
- Served at `/` via the rewrite in `middleware.ts`, through
  `/api/sandbox-files/new-landing/index.html`
- Snapshot contains `index.html` only, matching the v4 precedent — images are
  referenced by absolute `/api/sandbox-files/new-landing/images/...` paths and
  Tailwind loads from CDN, so copies of `src/` and `images/` would be unused
- Diff from v4 is 17 lines, all copy

## Use Cases for This Version
- Restore point for the live page before the next design/copy exploration
- Reference for the settled "Sprint Update Cycle" naming across the site

---

**Snapshot Date:** 2026-08-18
**Status:** Production-ready (live at `/`)

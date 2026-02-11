# Version 2 - Samples Carousel (2026-02-11)

## Overview
Replaced the multiple-card "Projects" section with a single "Samples" image carousel. Each slide displays a project image with a consistent label format: project name and a short description.

## Changes from Previous Version (v1 Baseline)
- Renamed "Projects" to "Samples" in navigation and section header
- Replaced stacked project cards with a single image carousel
- Added previous/next arrow navigation (visible on hover)
- Added dot indicators for direct slide access
- Added keyboard arrow-key support for slide navigation
- Each slide has a consistent label: title + short description
- Normalized color palette from `gray-*` to `neutral-*`

## What's in this version

### Key Features
- Single image carousel with smooth slide transitions
- Consistent per-slide labels (project name + description)
- Previous/Next navigation arrows (appear on hover)
- Dot indicator navigation
- Keyboard left/right arrow support

### Technical Details
- Built with: HTML, Tailwind CSS (CDN), vanilla JS
- Carousel uses CSS `translateX` transitions for smooth sliding
- No external carousel library dependencies
- Image paths reference `../../images/projects/` for version folder context

## Use Cases for This Version
- Showcasing work samples in a more focused, one-at-a-time presentation
- Reducing visual clutter by replacing stacked cards with a carousel

---

**Snapshot Date:** 2026-02-11  
**Last Modified:** 2026-02-11  
**Status:** Current

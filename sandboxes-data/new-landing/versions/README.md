# Landing Page Versions

This directory contains versioned snapshots of the landing page for reference and rollback purposes.

## Version History

### v1-baseline-2026-02-11
**Date:** February 11, 2026  
**Description:** Initial baseline version - clean, minimalist portfolio landing page  
**Key Features:**
- Single-page layout with sidebar navigation (desktop)
- Dark mode support (respects system preference + keyboard toggle)
- Sections: About, Capabilities, Projects, Services, Contact
- Service offerings: Brand Sprint ($15k), Product Sprint ($25k), Fractional Designer ($5k/week)
- Project slideshow functionality
- Tailwind CSS + Vite build setup

**Files included:**
- `index.html` - Main landing page
- `src/styles.css` - Tailwind CSS imports
- `images/` - All images (headshot, project images)

---

## How to Use Versions

### Creating a New Version
When you reach a significant milestone or want to bookmark the current state:

```bash
# Create a new version directory with descriptive name
mkdir -p versions/v2-description-YYYY-MM-DD

# Copy current files
cp index.html versions/v2-description-YYYY-MM-DD/
cp -r src versions/v2-description-YYYY-MM-DD/
cp -r images versions/v2-description-YYYY-MM-DD/

# Update this README with version details
```

### Viewing a Version
To view a previous version:

```bash
# Navigate to the version directory
cd versions/v1-baseline-2026-02-11

# Open the HTML file directly in browser
open index.html

# Or run a local server from the version directory
python3 -m http.server 8080
```

### Restoring a Version
To rollback to a previous version:

```bash
# Backup current state first!
mkdir -p versions/backup-before-rollback-$(date +%Y-%m-%d)
cp index.html versions/backup-before-rollback-$(date +%Y-%m-%d)/
cp -r src versions/backup-before-rollback-$(date +%Y-%m-%d)/
cp -r images versions/backup-before-rollback-$(date +%Y-%m-%d)/

# Restore the desired version
cp versions/v1-baseline-2026-02-11/index.html ./
cp -r versions/v1-baseline-2026-02-11/src ./
cp -r versions/v1-baseline-2026-02-11/images ./
```

### Comparing Versions
Use git diff or a visual diff tool:

```bash
# Compare two versions
diff versions/v1-baseline-2026-02-11/index.html versions/v2-description-YYYY-MM-DD/index.html

# Or use a visual diff tool
code --diff versions/v1-baseline-2026-02-11/index.html versions/v2-description-YYYY-MM-DD/index.html
```

## Version Naming Convention

Use this format: `v[number]-[brief-description]-YYYY-MM-DD`

Examples:
- `v1-baseline-2026-02-11` - Initial version
- `v2-services-redesign-2026-02-15` - Services section redesign
- `v3-new-projects-2026-03-01` - Updated project gallery
- `v4-pre-launch-2026-03-10` - Final version before major launch

## Notes

- Config files (tailwind.config.js, vite.config.js, package.json) are NOT versioned here since they're shared across all versions
- Only HTML, CSS, and images are versioned
- The active working version is always in the root directory
- Keep this README updated with each new version

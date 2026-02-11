# Versions Browser

A visual interface to browse, view, and manage all landing page versions.

## Quick Start

### View the Versions Page

**Option 1: Direct File**
```bash
open index.html
```

**Option 2: Development Server**
```bash
# From project root
npm run dev
# Then visit: http://localhost:5173/versions/
```

**Option 3: Simple HTTP Server**
```bash
cd versions
python3 -m http.server 8080
# Then visit: http://localhost:8080
```

## Features

### 📊 Version Overview
- See all versions at a glance
- Stats dashboard showing total versions and latest snapshot
- Status badges (baseline, current, archived)

### 🎨 Visual Cards
- Each version displayed in an organized card layout
- Key features and descriptions
- Date stamps and version numbers

### 🔗 Quick Actions
- **View Version**: Open the version in a new tab
- **Copy Path**: Copy the full URL to clipboard
- **Details**: View the VERSION-INFO.md documentation

### 🌙 Dark Mode
- Automatically respects system preference
- Toggle button in header
- Keyboard shortcut: Press `d` to toggle

## Managing Version Data

Version information is stored in `versions-data.js`. When you create a new version using `./create-version.sh`, it automatically updates this file.

### Manual Entry Format

If you need to manually add a version:

```javascript
{
  name: "v2-description-2026-02-15",
  version: "2",
  title: "Description",
  date: "February 15, 2026",
  dateValue: "2026-02-15",
  description: "What changed in this version",
  features: [
    "Feature 1",
    "Feature 2",
    "Feature 3"
  ],
  status: "archived",  // or "baseline", "current"
  path: "v2-description-2026-02-15/index.html"
}
```

### Status Types

- **`baseline`**: The original reference version (blue badge)
- **`current`**: The active production version (green badge)
- **`archived`**: Historical versions (gray badge)

## Customization

### Styling

The page uses Tailwind CSS via CDN for easy styling. To customize:

1. Edit the `tailwind.config` in the `<script>` tag
2. Modify the card layouts in the JavaScript rendering section
3. Update color schemes in the dark mode classes

### Adding Preview Images

Currently shows a placeholder. To add screenshots:

1. Create screenshots of each version
2. Save as `versions/v[X]-name/preview.png`
3. Update the preview section in `index.html`:

```javascript
// Replace the placeholder div with:
<img src="${version.name}/preview.png" alt="Version ${version.version} preview" class="w-full h-full object-cover object-top">
```

## Navigation

- **Home**: Click "View Current" in the header to go to the active landing page
- **Back to Root**: Use the footer links to navigate
- **Documentation**: Access README.md and VERSION-INFO.md files from the footer

## Keyboard Shortcuts

- `d` - Toggle dark mode

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires JavaScript enabled.

# 🎨 Versions Browser - Complete Guide

## What You Now Have

Your landing page versioning system now includes a **beautiful visual browser** to view and manage all your versions!

---

## 🚀 Quick Start

### Open the Versions Browser

**Easiest way:**
```bash
./view-versions.sh
```

**Or visit directly:**
- Development server: `http://localhost:5173/versions/`
- Direct file: Open `versions/index.html` in your browser

---

## ✨ Features

### 📊 Dashboard View
- **Version count** - See how many versions you've created
- **Latest snapshot** - Quick view of most recent version
- **Status indicators** - Color-coded badges for each version

### 🎴 Version Cards
Each version is displayed in a clean card with:
- **Preview area** - Visual identifier for the version
- **Version number & title** - Clear labeling
- **Date stamp** - When the version was created
- **Description** - What changed in this version
- **Key features** - Bullet list of highlights
- **Action buttons**:
  - 🔗 **View Version** - Open the version in a new tab
  - 📋 **Copy Path** - Copy URL to clipboard
  - ℹ️ **Details** - View VERSION-INFO.md

### 🌙 Dark Mode
- Automatically matches your system preference
- Manual toggle button in header
- Keyboard shortcut: Press `d`

### 🎯 Navigation
- Link back to current/active landing page
- Footer links to documentation
- Clean, organized layout

---

## 📂 File Structure

```
versions/
├── index.html              ← Main versions browser page
├── versions-data.js        ← Version metadata (auto-updated)
├── BROWSER-README.md       ← Technical documentation
├── README.md               ← Version management guide
│
└── v1-baseline-2026-02-11/ ← Example version folder
    ├── VERSION-INFO.md
    ├── index.html
    ├── src/
    └── images/
```

---

## 🔄 Workflow

### 1. Work on Your Landing Page
Edit `index.html` and `src/styles.css` as normal.

### 2. Create a Version Snapshot
When you reach a milestone:
```bash
./create-version.sh
```

This will:
- Create version folder with timestamp
- Copy all files (HTML, CSS, images)
- Generate VERSION-INFO.md template
- **Auto-update versions-data.js** for the browser
- Show you next steps

### 3. View Your Versions
```bash
./view-versions.sh
```

Or click "View Versions" link in your landing page sidebar (desktop view).

### 4. Keep Iterating
Your versions are safely bookmarked. Continue working with confidence!

---

## 🎨 Customizing the Browser

### Update Version Information

Edit `versions/versions-data.js` to customize:
- Descriptions
- Feature lists
- Status badges
- Display order

### Add Preview Screenshots

1. Take a screenshot of each version
2. Save as `versions/v[X]-name/preview.png`
3. Update the preview section in `versions/index.html`

### Change Colors/Styling

The browser uses Tailwind CSS. Modify the `tailwind.config` in the `<script>` tag or update the class names.

---

## 🔗 Integration with Main Site

The main landing page (`index.html`) now includes a "View Versions" link in the sidebar. This is subtle and only visible on desktop for development reference.

To hide it for production:
```html
<!-- Remove this section from index.html sidebar -->
<div class="mt-auto pt-8 border-t border-gray-200 dark:border-gray-700">
  <a href="versions/index.html" ...>View Versions</a>
</div>
```

---

## 📋 Comparison Tools

### Visual Comparison
Open two versions in separate browser tabs and toggle between them.

### Command Line Comparison
```bash
./compare-versions.sh
```

This script offers multiple comparison options:
- Line count differences
- Side-by-side diff
- VS Code diff viewer
- HTML structure diff

---

## 💡 Tips & Tricks

### Version Naming
Use descriptive names:
- `v2-services-redesign` - Clear what changed
- `v3-new-projects` - Feature-focused
- `v4-pre-launch` - Milestone-based

### Status Badges
- **Baseline** (blue) - Your original reference
- **Current** (green) - Active production version
- **Archived** (gray) - Historical versions

Update the status in `versions-data.js`:
```javascript
status: "baseline"  // or "current" or "archived"
```

### Quick Access
Bookmark: `http://localhost:5173/versions/` in your browser for instant access during development.

---

## 🎯 Use Cases

### Client Presentations
- Show evolution of the design
- Compare different approaches
- Get feedback on specific iterations

### Personal Reference
- See what worked (and what didn't)
- Track design decisions over time
- Learn from your process

### Team Collaboration
- Share specific versions with team members
- Discuss changes between iterations
- Maintain a clear history

### Rollback Safety Net
- Safely experiment knowing you can go back
- Test radical changes
- Keep stable versions accessible

---

## 🚀 You're All Set!

Your versioning system is complete with:
- ✅ Automated version creation
- ✅ Beautiful visual browser
- ✅ Easy navigation and comparison
- ✅ Dark mode support
- ✅ Comprehensive documentation

**Try it now:**
```bash
./view-versions.sh
```

Happy iterating! 🎨

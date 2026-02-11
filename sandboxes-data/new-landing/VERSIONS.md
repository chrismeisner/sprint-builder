# Version Management Quick Reference

## Your Landing Page is Now Versioned! 🎯

### What Was Created

✅ **Baseline version saved**: `versions/v1-baseline-2026-02-11/`  
✅ **Complete snapshot**: HTML, CSS, and all images preserved  
✅ **Documentation**: README and VERSION-INFO files explain everything  
✅ **Easy script**: `create-version.sh` for creating future versions  
✅ **Visual browser**: Open `versions/index.html` to see all versions

---

## Quick Commands

### Browse All Versions (Visual Interface)
```bash
open versions/index.html
```
Or visit: `http://localhost:5173/versions/` when running dev server

### Create a New Version
```bash
./create-version.sh
```
The script will prompt you for:
- Version number (2, 3, 4, etc.)
- Brief description (services-redesign, new-projects, etc.)
- Full description (what changed in this version)
- Automatically adds the version to the visual browser

### View a Previous Version
```bash
cd versions/v1-baseline-2026-02-11
open index.html
```

### Compare Two Versions
```bash
# Using VS Code
code --diff versions/v1-baseline-2026-02-11/index.html index.html

# Using command line
diff versions/v1-baseline-2026-02-11/index.html index.html
```

### Restore a Previous Version
```bash
# Always backup current state first!
./create-version.sh  # Create a backup of current state

# Then restore the old version
cp versions/v1-baseline-2026-02-11/index.html ./
cp -r versions/v1-baseline-2026-02-11/src ./
cp -r versions/v1-baseline-2026-02-11/images ./
```

---

## Current Project Structure

```
one-site/
├── index.html              ← Active working version
├── src/
│   └── styles.css
├── images/
│   ├── headshot.jpeg
│   └── projects/
├── versions/               ← All version snapshots
│   ├── README.md          ← Full documentation
│   └── v1-baseline-2026-02-11/
│       ├── VERSION-INFO.md
│       ├── index.html
│       ├── src/
│       └── images/
├── create-version.sh      ← Version creation script
└── VERSIONS.md            ← This file
```

---

## When to Create a New Version

Create a new version when:
- ✨ Completing a significant redesign
- 📝 Before making major content changes
- 🚀 Before a launch or important demo
- 🎨 After finalizing a design iteration
- 🔄 When you want a rollback point

---

## Your Current Workflow

1. **Keep working** on `index.html` and `src/styles.css` as normal
2. **Create versions** at milestones: `./create-version.sh`
3. **Reference old versions** anytime from the `versions/` folder
4. **No git required** - this is a simple file-based versioning system

Your v1 baseline is now safely bookmarked. Start iterating with confidence! 🚀

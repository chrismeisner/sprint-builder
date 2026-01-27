# Sandboxes

Browser-based prototypes and sketches that run as static HTML/CSS/JS.

## ⚠️ SECURITY: Authentication Required

**Sandboxes are NOT publicly accessible.** They are served through an authenticated API route that checks:
1. User is logged in
2. User has access to the linked project (owner, member, or admin)

Files in this folder are NOT in `/public` - they cannot be accessed directly via URL.

---

## Intent & Philosophy

**Sandboxes are client-facing prototypes built locally by the studio.** They are uploaded here to share with clients via the platform.

### ⚠️ CRITICAL: Minimal Intervention Principle

When asked to "fix" or "clean up" a sandbox:

1. **Preserve the original code as much as possible** - These are hand-crafted sketches, not production code
2. **Make only the minimal changes needed** to make it work in this environment
3. **Do NOT refactor, modernize, or "improve"** the code style
4. **Do NOT add frameworks, build tools, or dependencies**
5. **Do NOT change the visual design** unless explicitly broken

The goal is: **"Make it work, don't make it different."**

---

## How Sandboxes Work

### File Structure

```
/sandboxes-data/                  ← Private folder (NOT in /public)
├── README.md                     ← You are here
├── demo-sketch/                  ← Example sandbox
│   └── index.html
├── {folder-name}/                ← Each sandbox is a folder
│   ├── index.html                ← Entry point (required for "Ready" status)
│   ├── style.css                 ← Optional
│   ├── script.js                 ← Optional
│   └── assets/                   ← Optional subfolder for images, fonts, etc.
├── styleguide/                   ← Brand styleguide (special sandbox)
│   ├── typography-data.js        ← 🎯 SINGLE SOURCE OF TRUTH for typography
│   ├── generate-typography-css.js ← Auto-generates CSS from data
│   ├── typography-styles.css     ← Auto-generated (DO NOT EDIT)
│   ├── fonts.html                ← Typography documentation
│   ├── style-tiles.html          ← Style tiles page
│   └── TYPOGRAPHY-README.md      ← Typography system docs
```

### Typography System (Styleguide)

The styleguide uses a **centralized typography system** where all type styles are defined once in `typography-data.js` and automatically applied everywhere.

**To update typography:**
1. Edit `sandboxes-data/styleguide/typography-data.js`
2. Run `cd sandboxes-data/styleguide && npm run generate-typography`
3. Changes apply to both `fonts.html` and `style-tiles.html`

See `sandboxes-data/styleguide/TYPOGRAPHY-README.md` for full documentation.

### Access Flow

1. **Admin drops folder** into `/sandboxes-data/` (via FTP or local file system)
2. **Admin registers sandbox** via Profile → Sandboxes → "Register Sandbox"
3. **Admin assigns to a project** (links sandbox to client's project)
4. **Client views sandbox** via their profile (must be logged in)

### How Files Are Served

Files are served through `/api/sandbox-files/[folder]/[path]`:
- `GET /api/sandbox-files/demo-sketch/index.html` → Serves the HTML (if authorized)
- `GET /api/sandbox-files/demo-sketch/style.css` → Serves the CSS (if authorized)

The API route:
1. Checks authentication (401 if not logged in)
2. Checks project access (403 if not authorized)
3. Serves the file with correct MIME type

### Visibility Rules

| User | Access |
|------|--------|
| Admin | All sandboxes (registered or not) |
| Project Owner | Sandboxes linked to their projects |
| Project Member | Sandboxes linked to projects they're members of |
| Not logged in | **NO ACCESS** (redirected to login) |

---

## Technical Details

### Database Registration

Sandboxes are tracked in the `sandboxes` table:
```sql
sandboxes (
  id,
  project_id,      -- Links to projects table (required)
  name,            -- Display name
  folder_name,     -- Matches folder in /sandboxes-data/
  description,
  created_by,
  created_at,
  updated_at
)
```

### API Endpoints

- `GET /api/sandboxes` - List sandboxes (filtered by project access)
- `GET /api/sandboxes?unregistered=true` - List unregistered folders (admin only)
- `POST /api/sandboxes` - Register a sandbox (admin only)
- `DELETE /api/sandboxes?id=xxx` - Unregister a sandbox (admin only)
- `GET /api/sandbox-files/[folder]/[...path]` - Serve sandbox files (authenticated)

### Viewing Sandboxes

Sandboxes are viewed by clicking "View Sandbox" on the profile page, which opens the sandbox directly in a new tab via `/api/sandbox-files/{folder}/index.html`.

There is no iframe viewer - sandboxes run in their own tab for best compatibility.

---

## Common Issues & Fixes

### "Access denied" error

**Cause:** User doesn't have access to the project the sandbox is linked to
**Fix:** Add user as a project member or link sandbox to a different project

### Sandbox shows blank in viewer

**Cause:** Authentication cookies not being sent to iframe
**Fix:** Ensure you're logged in and the session cookie is valid

### "No index.html" status

**Cause:** The folder doesn't have an `index.html` file
**Fix:** Add an `index.html` as the entry point

### "Missing" status

**Cause:** Sandbox is registered in DB but folder was deleted from filesystem
**Fix:** Either re-upload the folder or unregister the sandbox

### Relative paths not working

**Cause:** Sandbox uses paths that don't resolve correctly through the API
**Fix:** Use relative paths like `style.css` or `assets/image.png` (no leading `./` or `/`)

### External resources blocked

**Cause:** Sandbox loads fonts/scripts from CDNs that may be blocked
**Fix:** Download resources locally into the sandbox folder

---

## When Fixing a Sandbox

### Do ✅

- Fix broken relative paths
- Add missing closing tags
- Fix typos in file references
- Add `<!DOCTYPE html>` if missing
- Ensure `<meta charset="UTF-8">` is present

### Don't ❌

- Rewrite HTML structure
- Convert inline styles to external CSS
- Add CSS frameworks (Tailwind, Bootstrap)
- Convert to React/Vue/etc.
- Minify or bundle files
- Change colors, fonts, or layout
- Add "improvements" that weren't requested

---

## Example: Minimal Fix

**Before (broken):**
```html
<link rel="stylesheet" href="./styles/main.css">
<script src="./js/app.js"></script>
```

**After (fixed):**
```html
<link rel="stylesheet" href="styles/main.css">
<script src="js/app.js"></script>
```

Notice: Only the path format changed. Nothing else.

---

## Questions?

The sandboxes feature is designed to be simple and preserve the original work. When in doubt, make the smallest possible change.

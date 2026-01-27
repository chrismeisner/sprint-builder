# Typography System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   🎯 SINGLE SOURCE OF TRUTH                      │
│                                                                  │
│                    typography-data.js                            │
│                                                                  │
│  • Font families (Acme Gothic, Inter, Inter Tight, etc.)        │
│  • Type catalog (H1, H2, Body / M, etc.)                        │
│  • Desktop & mobile sizes                                       │
│  • Line heights, weights, tracking                              │
│  • Sample text & usage notes                                    │
│                                                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ imports
                          ▼
         ┌────────────────────────────────────┐
         │  generate-typography-css.js        │
         │  (Run: npm run generate-typography)│
         └────────────────┬───────────────────┘
                          │
                          │ generates
                          ▼
         ┌────────────────────────────────────┐
         │     typography-styles.css          │
         │     (Auto-generated CSS)           │
         │                                    │
         │  [data-style="H1"] {               │
         │    font-size: 60px;                │
         │    line-height: 1;                 │
         │    ...                             │
         │  }                                 │
         │  @media (max-width: 640px) {       │
         │    [data-style="H1"] {             │
         │      font-size: 52px;              │
         │    }                               │
         │  }                                 │
         └────────────────┬───────────────────┘
                          │
                          │ linked by both
                          │
        ┌─────────────────┴──────────────────┐
        │                                    │
        ▼                                    ▼
┌──────────────────┐              ┌──────────────────┐
│   fonts.html     │              │ style-tiles.html │
│                  │              │                  │
│ • Imports data   │              │ • Links CSS file │
│   from           │              │ • Renders with   │
│   typography-    │              │   [data-style]   │
│   data.js        │              │   attributes     │
│ • Shows table    │              │ • Shows live     │
│   with specs     │              │   examples       │
└──────────────────┘              └──────────────────┘
```

## Data Flow

### When You Edit Typography

```
1. Edit typography-data.js
   └─> Change: sizeDesktop: "60px" → "64px"

2. Run: npm run generate-typography
   └─> Reads: typography-data.js
   └─> Generates: typography-styles.css
   └─> Output: "✅ Generated typography-styles.css"

3. Both pages automatically updated:
   ├─> fonts.html
   │   └─> Imports typography-data.js
   │   └─> Shows new value in table: "64px"
   │
   └─> style-tiles.html
       └─> Links typography-styles.css
       └─> Renders with new size: 64px
```

## File Relationships

```
typography-data.js (SOURCE)
    │
    ├──> [ES Module Import] ──> fonts.html
    │                            (Interactive table view)
    │
    └──> [Script Input] ──> generate-typography-css.js
                             │
                             └──> [Output] ──> typography-styles.css
                                                │
                                                ├──> fonts.html
                                                │    (Applies via <link>)
                                                │
                                                └──> style-tiles.html
                                                     (Renders via [data-style])
```

## Why This Works

### Before (3 places to edit)
```
CSV Update
  ├─> Edit fonts.html (typeCatalog array)
  ├─> Edit typography-styles.css (CSS rules)
  └─> Edit style-tiles.html (if hardcoded anywhere)

❌ Easy to forget one
❌ Values can drift
❌ Manual sync required
```

### After (1 place to edit)
```
CSV Update
  └─> Edit typography-data.js
      └─> Run npm script
          └─> Everything updates automatically

✅ Single source of truth
✅ Auto-sync guaranteed
✅ One command to rule them all
```

## Benefits of This Architecture

1. **DRY (Don't Repeat Yourself)**
   - Typography values defined once
   - Eliminates duplication errors

2. **Type Safety** (JavaScript)
   - Structured data format
   - Easy to validate/lint
   - IDE autocomplete support

3. **Automation**
   - CSS auto-generated
   - No manual CSS writing
   - Consistent formatting

4. **Version Control**
   - Clear history of changes
   - Easy to review diffs
   - Rollback friendly

5. **Documentation**
   - Self-documenting data structure
   - Usage notes built-in
   - Sample text included

6. **Extensibility**
   - Easy to add new styles
   - Easy to add new breakpoints
   - Easy to export to other formats

## Usage in HTML

```html
<!-- Any page can use these styles by: -->

<!-- 1. Link the CSS -->
<link rel="stylesheet" href="typography-styles.css" />

<!-- 2. Use data-style attributes -->
<h1 data-style="H1">This renders as H1 style</h1>
<p data-style="Body / M">This renders as Body / M style</p>
<button data-style="Button">This renders as Button style</button>

<!-- 3. Styles apply automatically across all breakpoints -->
<!-- Desktop: H1 = 60px, Mobile: H1 = 52px (automatic via @media) -->
```

## Developer Workflow

```bash
# Daily workflow
code typography-data.js        # Edit the data
npm run generate-typography    # Generate CSS
git add .                      # Stage changes
git commit -m "Update H1 size" # Commit both files

# One-time setup (already done)
npm install                    # Install dependencies
```

## Maintenance

**Files you should edit:**
- ✅ `typography-data.js` - The source of truth

**Files you should never edit:**
- ❌ `typography-styles.css` - Auto-generated (will be overwritten)

**Files you can safely edit (not part of system):**
- 📝 Other HTML/CSS in styleguide (colors, images, etc.)

# Typography System - Single Source of Truth

This directory contains a **centralized typography system** where all type styles are defined once and used everywhere.

## 📁 File Structure

```
sandboxes-data/styleguide/
├── typography-data.js          # 🎯 SINGLE SOURCE OF TRUTH - Edit this!
├── generate-typography-css.js  # 🔧 Generator script
├── typography-styles.css       # 📝 Auto-generated CSS (DO NOT EDIT)
├── fonts.html                  # 📊 Typography documentation page
└── style-tiles.html            # 🎨 Style tiles page
```

## 🎯 How to Update Typography

### Step 1: Edit the Data File

Open `typography-data.js` and update the values:

```javascript
{
  name: "H1", 
  sizeDesktop: "60px",   // Desktop size
  sizeMobile: "52px",    // Mobile size
  lineHeight: 1,         // Desktop line-height
  lineHeightMobile: 1,   // Mobile line-height
  weight: 600,
  letterSpacing: "0em",
  // ... other properties
}
```

### Step 2: Regenerate the CSS

Run the generator script:

```bash
cd sandboxes-data/styleguide
node generate-typography-css.js
```

This will update `typography-styles.css` with your changes.

### Step 3: Verify the Changes

1. Open `http://localhost:3000/api/sandbox-files/styleguide/fonts.html` to see the updated table
2. Open `http://localhost:3000/api/sandbox-files/styleguide/style-tiles.html` to see the updated styles in action

## 📊 What Gets Updated

When you edit `typography-data.js` and run the generator:

- ✅ `typography-styles.css` - The CSS file that applies styles via `[data-style]` attributes
- ✅ `fonts.html` - Imports the data directly for the interactive table
- ✅ `style-tiles.html` - Uses the CSS file for actual rendering
- ✅ All pages that use `[data-style]` attributes

## 🚀 Adding New Type Styles

1. Add a new entry to `typeCatalog` in `typography-data.js`:

```javascript
{
  name: "My New Style",
  sizeDesktop: "18px",
  sizeMobile: "16px",
  lineHeight: 1.5,
  lineHeightMobile: 1.5,
  weight: 500,
  letterSpacing: "0em",
  sample: "Sample text here",
  usage: "When to use this style",
  fontFamily: "var(--font-family-sans)"
}
```

2. Run `node generate-typography-css.js`
3. Use it in HTML with `<div data-style="My New Style">Text</div>`

## 📝 Importing from CSV

If you have CSV data with desktop and mobile values:

1. Update `typography-data.js` manually with the CSV values
2. Run the generator script
3. All pages will automatically update

No need to edit multiple files!

## ⚠️ Important Notes

- **Never edit `typography-styles.css` directly** - it's auto-generated and will be overwritten
- Always run the generator script after editing `typography-data.js`
- The `fonts.html` file includes fallback data in case module imports fail
- Both desktop and mobile values should be specified for responsive designs

## 🔄 Migration from Old System

Previously, type styles were defined in three places:
1. ❌ JavaScript in `fonts.html` (typeCatalog array)
2. ❌ CSS in `typography-styles.css` (manual CSS rules)
3. ❌ Required manual sync between files

Now, type styles are defined in one place:
1. ✅ `typography-data.js` - Single source of truth
2. ✅ Auto-generated CSS and imported by HTML
3. ✅ Always in sync!

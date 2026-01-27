# Typography Quick Reference

## 🚀 Quick Start

```bash
# 1. Edit the data
code typography-data.js

# 2. Generate CSS
npm run generate-typography

# 3. Done! Both pages are now updated.
```

## 📝 Common Tasks

### Update a Type Style

```javascript
// In typography-data.js, find the style and edit:
{ 
  name: "H1", 
  sizeDesktop: "60px",  // Change this
  sizeMobile: "52px",   // And this
  lineHeight: 1,        // And this
  // ...
}
```

Then run: `npm run generate-typography`

### Add a New Type Style

```javascript
// In typography-data.js, add to the appropriate section:
{
  title: "Body",
  items: [
    // ... existing styles ...
    { 
      name: "My New Style",
      sizeDesktop: "18px",
      sizeMobile: "16px",
      lineHeight: 1.5,
      lineHeightMobile: 1.5,
      weight: 500,
      letterSpacing: "0em",
      sample: "Sample text",
      usage: "When to use this",
      fontFamily: "var(--font-family-sans)"
    }
  ]
}
```

Then run: `npm run generate-typography`

### Update from CSV

Copy the CSV values into `typography-data.js` manually, matching:
- Style name → `name`
- Desktop size → `sizeDesktop`
- Mobile size → `sizeMobile`
- Desktop line-height → `lineHeight`
- Mobile line-height → `lineHeightMobile`
- Weight → `weight`
- Tracking → `letterSpacing`

Then run: `npm run generate-typography`

## 🎯 What Gets Updated

After running the generator:
- ✅ `typography-styles.css` - Updated with new values
- ✅ `fonts.html` - Shows new values in table (auto-imports data)
- ✅ `style-tiles.html` - Renders with new styles (uses CSS)
- ✅ Any page using `[data-style]` attributes

## ⚠️ Important Rules

1. **Always edit `typography-data.js`, never `typography-styles.css`**
2. **Always run the generator after editing**
3. **Commit both the data file and generated CSS to git**

## 📦 Files You Should Edit

- ✅ `typography-data.js` - Edit this!
- ❌ `typography-styles.css` - Don't edit (auto-generated)
- ❌ `fonts.html` - Don't edit the data arrays (they're fallbacks)
- ❌ `style-tiles.html` - Don't edit the styles (they come from CSS)

## 🔧 Troubleshooting

### "Module not found" error
```bash
npm install  # Install dependencies
```

### Generator doesn't update CSS
```bash
# Make sure you're in the styleguide directory
cd sandboxes-data/styleguide
npm run generate-typography
```

### Changes don't appear on pages
1. Check that you ran the generator
2. Hard refresh the browser (Cmd+Shift+R or Ctrl+Shift+R)
3. Check the browser console for errors

# Sprint Packages Quick Start

## What Was Created

I've set up a complete sprint packages system with 3 example packages that follow your rules:
- **1 workshop deliverable per package**
- **1-3 execution deliverables per package**
- **Fixed pricing** based on deliverable costs
- **Clear "set touchpoint deliverables"** so clients know exactly what they're getting

## Quick Setup (3 Steps)

### Step 1: Seed Deliverables
First, ensure deliverables and workshops are in the database:

```bash
# Seed standard deliverables (logo, prototypes, landing pages, etc.)
curl -X POST http://localhost:3000/api/admin/deliverables/seed

# Seed workshop deliverables (kickoff workshops)
curl -X POST http://localhost:3000/api/admin/deliverables/seed-workshops
```

### Step 2: Seed Sprint Packages
Create the 3 example packages:

```bash
curl -X POST http://localhost:3000/api/admin/sprint-packages/seed
```

This creates:
1. **Brand Identity Sprint** - $3,500 (workshop + logo + style guide)
2. **MVP Launch Sprint** - $5,800 (workshop + landing page + prototype)
3. **Startup Branding Sprint** - $4,100 (workshop + logo + social kit + pitch deck)

### Step 3: View Packages
Visit these URLs to see your packages:

- `/packages` - All packages listing
- `/packages/brand-identity-sprint` - Example detail page
- `/how-it-works` - Shows example packages at bottom

## Files Created

### New API Route
- `app/api/admin/sprint-packages/seed/route.ts` - Seeds the 3 example packages

### Updated Pages
- `app/how-it-works/page.tsx` - Added "Example Packages" section with links to package detail pages

### Documentation
- `SPRINT_PACKAGES_SEED.md` - Complete technical documentation
- `PACKAGES_QUICK_START.md` - This file

## Package Details

### Brand Identity Sprint
**Perfect for:** Startups needing complete brand foundation  
**Price:** $3,500 | **Time:** 22 hours  
**Includes:**
- 🎯 Sprint Kickoff Workshop - Branding (4h, $800)
- ✏️ Typography Scale + Wordmark Logo (8h, $1,200)
- 📋 Brand Style Guide (10h, $1,500)

### MVP Launch Sprint
**Perfect for:** Validating product ideas  
**Price:** $5,800 | **Time:** 36 hours  
**Includes:**
- 🎯 Sprint Kickoff Workshop - Product (4h, $800)
- 🚀 Landing Page (Marketing) (12h, $2,000)
- 💻 Prototype - Level 1 (Basic) (20h, $3,000)

### Startup Branding Sprint
**Perfect for:** Early-stage startups  
**Price:** $4,100 | **Time:** 26 hours  
**Includes:**
- 🎯 Sprint Kickoff Workshop - Startup (4h, $800)
- ✏️ Typography Scale + Wordmark Logo (8h, $1,200)
- 📱 Social Media Template Kit (8h, $1,200)
- 📊 Pitch Deck Template (Branded) (6h, $900)

## How Pricing Works

Prices are **automatically calculated** from deliverable fixed prices:
- Each deliverable has a `fixed_price` and `fixed_hours`
- Package totals = sum of all included deliverables
- No manual updates needed when deliverable prices change

## System Rules (Remember These!)

✅ **Every sprint package MUST have:**
1. Exactly 1 workshop deliverable
2. 1-3 execution deliverables (with "set touchpoint" scope)
3. Fixed pricing (calculated from deliverables)
4. Fixed hours (calculated from deliverables)

✅ **Each deliverable has:**
- Clear name
- Description (when to use it)
- Detailed scope (bullet points of what's included)
- Fixed hours
- Fixed price
- Category (Branding, Product, Workshop, etc.)

## Next Steps

1. Run the seed commands above
2. Visit `/packages` to see your live packages
3. Test package detail pages
4. Review the "Example Packages" section on `/how-it-works`
5. Create additional custom packages as needed

## Troubleshooting

**Issue:** Seed returns "already exist" message  
**Solution:** Packages already seeded. To re-seed, manually delete from database first.

**Issue:** "Deliverable not found" error  
**Solution:** Make sure you've seeded deliverables and workshops FIRST (Step 1).

**Issue:** Package prices seem wrong  
**Solution:** Check that deliverables have `fixed_price` and `fixed_hours` set correctly.

## Support

For more details, see:
- `SPRINT_PACKAGES_SEED.md` - Full technical documentation
- `app/api/sprint-packages/route.ts` - API implementation
- `app/packages/PackagesClient.tsx` - Frontend component


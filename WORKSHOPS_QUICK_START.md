# Workshops Quick Start ✅

## What Are Workshops?

Workshops are special **kickoff sessions** that run at the start of every sprint (Monday). They're a special type of deliverable marked with `deliverable_type = 'workshop'` in the database.

## Current Setup

### ✅ 3 Workshops Created & Linked

#### 1. Brand Identity Sprint → **Sprint Kickoff Workshop - Branding**
- **Price**: $300
- **Duration**: 2 hours
- **Focus**: Brand positioning, visual direction, creative brief
- **Format**: 90-min video call with collaborative whiteboarding

#### 2. MVP Launch Sprint → **Sprint Kickoff Workshop - Product**
- **Price**: $400
- **Duration**: 2.5 hours
- **Focus**: Feature prioritization, user flows, technical validation
- **Format**: 2-hour video call with Figjam/Miro collaboration

#### 3. Startup Branding Sprint → **Sprint Kickoff Workshop - Startup**
- **Price**: $400
- **Duration**: 2.5 hours
- **Focus**: Brand story, pitch narrative, go-to-market strategy
- **Format**: 2-hour video call with strategic exercises

## Verification

Run this to verify workshops are set up:
```bash
curl http://localhost:3000/api/admin/sprint-packages/verify | python3 -m json.tool
```

Expected output:
```json
{
  "success": true,
  "workshopCount": 3,
  "packageCount": 3,
  "packages": [...]
}
```

## How Workshops Display

### In Sprint Deliverables Editor
- Purple badge: **📋 WORKSHOP**
- Purple border and background
- Sorted to appear first in lists

### In Package Pages
- Listed as the first deliverable in each package
- Clearly marked as "Sprint Kickoff Workshop"
- Hours and price included in package totals

## Database Schema

```sql
-- Workshops are deliverables with a special type
SELECT * FROM deliverables WHERE deliverable_type = 'workshop';

-- View workshops linked to packages
SELECT 
  sp.name as package_name,
  d.name as workshop_name,
  d.fixed_price,
  d.fixed_hours
FROM sprint_packages sp
JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
JOIN deliverables d ON spd.deliverable_id = d.id
WHERE d.deliverable_type = 'workshop';
```

## Admin Endpoints

### Seed Workshops
```bash
curl -X POST http://localhost:3000/api/admin/workshops/seed
```

### Reset Workshops (Delete All)
```bash
curl -X POST http://localhost:3000/api/admin/workshops/reset
```

### Seed Sprint Packages (with workshops)
```bash
curl -X POST http://localhost:3000/api/admin/sprint-packages/seed
```

### Reset Sprint Packages
```bash
curl -X POST http://localhost:3000/api/admin/sprint-packages/reset
```

### Verify Everything
```bash
curl http://localhost:3000/api/admin/sprint-packages/verify
```

## Full Reset & Reseed (If Needed)

```bash
# 1. Reset everything
curl -X POST http://localhost:3000/api/admin/sprint-packages/reset
curl -X POST http://localhost:3000/api/admin/workshops/reset

# 2. Reseed workshops first
curl -X POST http://localhost:3000/api/admin/workshops/seed

# 3. Then seed packages (will link workshops automatically)
curl -X POST http://localhost:3000/api/admin/sprint-packages/seed

# 4. Verify
curl http://localhost:3000/api/admin/sprint-packages/verify
```

## Current Status

✅ Schema updated with `deliverable_type` column  
✅ 3 workshops created in database  
✅ 3 sprint packages created  
✅ All workshops linked to their respective packages  
✅ UI displays workshops with purple badge  
✅ Workshops appear first in sorted lists  

## Next Steps (Optional Enhancements)

1. **Auto-add workshop on sprint creation** - Automatically include the appropriate workshop when a user creates a sprint
2. **Workshop scheduling** - Add `scheduled_date` to track when workshops are booked
3. **One workshop per sprint rule** - Add validation to ensure exactly one workshop per sprint
4. **Workshop calendar** - Admin UI to see all upcoming workshops
5. **Workshop prep checklist** - System to prepare materials before kickoff

---

**Everything is ready to go!** Your sprint packages now include workshops that will kickoff each 2-week sprint. 🚀

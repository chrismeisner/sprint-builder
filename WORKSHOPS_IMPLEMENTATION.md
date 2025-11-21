# Workshops Implementation

## Overview
Workshops are a special type of deliverable that represents kickoff sessions run at the start of each sprint. Each workshop is Monday-specific and tailored to align the team before diving into execution.

## Database Schema

### New Column: `deliverable_type`
- **Table**: `deliverables`
- **Type**: `text`
- **Default**: `'standard'`
- **Constraint**: `CHECK (deliverable_type IN ('standard', 'workshop'))`
- **Index**: `idx_deliverables_type`

Workshops are distinguished from standard deliverables using the `deliverable_type` column rather than a separate table.

## Three Workshop Types

### 1. Brand Identity Workshop
- **Category**: Branding
- **Duration**: 2 hours
- **Price**: $300
- **Points**: 3
- **Focus**: Brand positioning, visual direction, and creative brief alignment
- **Best for**: Brand Identity Sprint

### 2. MVP Strategy Workshop
- **Category**: Product
- **Duration**: 2.5 hours
- **Price**: $400
- **Points**: 4
- **Focus**: Feature prioritization, user flows, and technical validation
- **Best for**: MVP Launch Sprint

### 3. Startup Launch Workshop
- **Category**: Branding & Strategy
- **Duration**: 2.5 hours
- **Price**: $400
- **Points**: 4
- **Focus**: Brand story, pitch narrative, and go-to-market strategy
- **Best for**: Startup Branding Sprint

## Files Modified

### Database Schema
- ✅ `lib/db.ts` - Added `deliverable_type` column with index

### API Routes
- ✅ `app/api/deliverables/route.ts` - Updated queries to include `deliverable_type`
- ✅ `app/api/admin/workshops/seed/route.ts` - **NEW** Seed endpoint for workshops

### UI Components
- ✅ `app/sprints/[id]/DeliverablesEditor.tsx` - Updated to detect workshops by type (not name)
- ✅ `app/dashboard/deliverables/page.tsx` - Updated queries to include `deliverable_type`

## How to Seed Workshops

After restarting your dev server:

```bash
curl -X POST http://localhost:3000/api/admin/workshops/seed
```

Expected response:
```json
{
  "success": true,
  "message": "Seeded 3 workshops (0 already existed)",
  "inserted": 3,
  "skipped": 0
}
```

## UI Features

### Visual Differentiation
Workshops display with:
- 🎯 Purple badge labeled "📋 WORKSHOP"
- Purple border and background (`border-purple-300 bg-purple-50`)
- Clearly distinguished from standard deliverables

### Sorting
Deliverables are now sorted by:
1. `active` status (active first)
2. `deliverable_type` (workshops first, then standard)
3. `name` (alphabetical)

This ensures workshops appear at the top of deliverable lists.

## Next Steps (Optional Enhancements)

### 1. Auto-include Workshop on Sprint Creation
Automatically add the appropriate workshop when a sprint is created:
- Brand Identity Sprint → Brand Identity Workshop
- MVP Launch Sprint → MVP Strategy Workshop
- Startup Branding Sprint → Startup Launch Workshop

### 2. Business Rule: One Workshop Per Sprint
Add validation to ensure each sprint has exactly one workshop (no more, no less).

### 3. Workshop Scheduling
Add a `scheduled_date` field to `sprint_deliverables` to track when the workshop is scheduled for.

### 4. Workshop-Specific UI
Create a dedicated workshop management UI showing:
- Upcoming workshops
- Workshop preparation checklist
- Meeting link and calendar integration

## Why This Approach?

### ✅ Advantages of Using `deliverable_type`
1. **Single Source of Truth** - All deliverables (workshops and standard) share the same schema
2. **DRY Principle** - No duplicate code or tables
3. **Simpler Queries** - No complex JOINs needed
4. **Flexible** - Easy to add more types in the future (e.g., 'template', 'addon')
5. **Existing Infrastructure** - Uses the same `sprint_deliverables` junction table

### ❌ Why Not a Separate `workshops` Table?
- Would duplicate all the same fields (name, description, price, hours, etc.)
- Would require more complex queries and migrations
- Would make reporting and analytics harder
- Workshops fundamentally ARE deliverables, just a special type

## Database Migration Path

The schema changes are **additive only** (no destructive changes):
1. Column is added with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
2. Default value ensures existing rows remain valid
3. Index improves query performance
4. No data loss or migration scripts needed

## Testing

After restarting the dev server and seeding:

1. Visit `/dashboard/deliverables` - Workshops should appear at the top with proper type
2. Create or edit a sprint - Workshops should show with purple badge
3. Add a workshop to a sprint - Should work like any other deliverable but visually distinct
4. Check sorting - Workshops should appear before standard deliverables

---

**Status**: ✅ Implementation complete - Restart dev server to apply schema changes

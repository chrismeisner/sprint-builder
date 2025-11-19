# Sprint Builder - Manual Sprint Creation

## Overview

The **Sprint Builder** provides a manual way to create sprint drafts without requiring a Typeform submission or AI generation. This gives your team the flexibility to quickly create custom sprint plans for quotes, proposals, or special projects.

## Two Ways to Create Sprints

Your app now supports **two parallel workflows**:

### Path 1: AI-Powered (Original)
```
Typeform Submission → Document Created → AI Analysis → Sprint Draft + Deliverables
```

### Path 2: Manual (New)
```
Sprint Builder UI → Direct Creation → Sprint Draft + Deliverables
```

Both paths create identical data structures in the database.

## Features

### 🎯 Core Functionality
- **Manual sprint creation** without AI or intake form
- **Live calculation** of totals as deliverables are selected
- **Package support** - Start from a sprint package or build custom
- **Deliverable selection** - Choose from active deliverables catalog
- **Quantity control** - Set quantities per deliverable
- **Instant feedback** - See price, hours, and points update in real-time

### 📊 Live Calculations
The sticky sidebar shows real-time totals:
- **Total Price** - Sum of all selected deliverables × quantities
- **Total Hours** - Total effort required
- **Story Points** - Complexity estimate
- **Deliverable Count** - Number of items included

### 🏗️ Workflow Options

**Option A: Start from Scratch**
1. Enter sprint title
2. Select individual deliverables
3. Set quantities
4. Review totals
5. Create sprint

**Option B: Start from Package**
1. Enter sprint title
2. Select a sprint package from dropdown
3. Package deliverables auto-populate
4. Customize (add/remove/adjust quantities)
5. Review totals
6. Create sprint

## Technical Implementation

### API Endpoint

**POST /api/sprint-drafts**

Creates a sprint draft with deliverables directly.

**Request Body:**
```json
{
  "title": "Q1 2024 MVP Sprint",
  "sprintPackageId": "pkg-123", // optional
  "deliverables": [
    {
      "deliverableId": "del-456",
      "quantity": 2
    }
  ],
  "status": "draft"
}
```

**Response:**
```json
{
  "sprintDraftId": "sprint-789",
  "documentId": "doc-abc",
  "totalPoints": 21,
  "totalHours": 80,
  "totalPrice": 12000
}
```

### Data Model

The Sprint Builder creates two records:

1. **Document** (minimal "manual" record for referential integrity)
```json
{
  "id": "doc-abc",
  "content": {
    "source": "manual",
    "title": "Q1 2024 MVP Sprint",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "filename": "manual-sprint"
}
```

2. **Sprint Draft** (same structure as AI-generated)
```json
{
  "id": "sprint-789",
  "document_id": "doc-abc",
  "draft": {
    "sprintTitle": "Q1 2024 MVP Sprint",
    "source": "manual"
  },
  "status": "draft",
  "title": "Q1 2024 MVP Sprint",
  "sprint_package_id": "pkg-123", // or NULL
  "total_estimate_points": 21,
  "total_fixed_hours": 80,
  "total_fixed_price": 12000,
  "deliverable_count": 3
}
```

### Referential Integrity

To maintain consistency with the existing schema where `sprint_drafts.document_id` is required:
- Sprint Builder creates a minimal "manual" document
- This preserves foreign key relationships
- All sprints have a document parent (AI-generated or manual)
- Queries work consistently across both types

### Identifying Sprint Types

To distinguish between AI-generated and manual sprints:

```sql
-- Check document content
SELECT 
  sd.id,
  sd.title,
  d.content->>'source' as source
FROM sprint_drafts sd
JOIN documents d ON sd.document_id = d.id;

-- Manual sprints have: content->>'source' = 'manual'
-- AI sprints have: actual Typeform data
```

Or check for AI response:

```sql
-- Manual sprints have ai_response_id = NULL
SELECT id, title
FROM sprint_drafts
WHERE ai_response_id IS NULL;
```

## User Interface

### Location
`/dashboard/sprint-builder`

### Layout

**Left Column (2/3 width):**
- Sprint title input
- Package selector (optional)
- Selected deliverables list (with quantities and remove buttons)
- Available deliverables grid (organized by category)

**Right Column (1/3 width - Sticky):**
- Live calculation card showing:
  - Total Price (large, prominent)
  - Hours and Points
  - Deliverable count
- Create Sprint button
- Cancel button

### UX Features

✅ **Real-time updates** - Calculations update instantly
✅ **Visual feedback** - Selected deliverables show "✓ Added"
✅ **Categorization** - Deliverables grouped by category
✅ **Quantity control** - Adjust quantities inline
✅ **Package loading** - Auto-populate from package
✅ **Validation** - Can't submit without deliverables
✅ **Responsive** - Works on mobile and desktop

## Use Cases

### 1. Quick Quotes
**Scenario:** Client calls asking for a quote
**Solution:** 
- Open Sprint Builder
- Add relevant deliverables
- Get instant pricing
- Create sprint and share link

### 2. Custom Proposals
**Scenario:** Need a proposal that doesn't fit any package
**Solution:**
- Build custom combination of deliverables
- Fine-tune quantities
- Create sprint for proposal

### 3. Internal Projects
**Scenario:** Internal sprint planning without client form
**Solution:**
- Use Sprint Builder for team sprints
- Track work same as client projects

### 4. Package Variations
**Scenario:** Client wants package with modifications
**Solution:**
- Start from package
- Add/remove deliverables
- Adjust to client needs
- Create customized sprint

## Comparison: AI vs Manual

| Feature | AI-Powered | Manual (Sprint Builder) |
|---------|-----------|------------------------|
| **Input** | Typeform submission | Direct selection |
| **Speed** | ~10-30 seconds | Instant |
| **Requires** | Client intake form | Just deliverables |
| **Customization** | AI decides | Full control |
| **Best For** | Client-driven projects | Internal/custom work |
| **Creates** | Document + Sprint | Document + Sprint |
| **Deliverables** | AI selects 1-3 | Manual selection |
| **Package Support** | AI can recommend | Can start from package |

## Best Practices

### When to Use Sprint Builder

✅ **Use Sprint Builder for:**
- Quick quotes and proposals
- Internal projects
- Custom combinations not in packages
- Testing deliverable pricing
- Client modifications to packages
- Rush projects needing immediate sprint

❌ **Use AI generation for:**
- Standard client intake flow
- Projects starting with Typeform
- When AI recommendations add value
- Consistent, documented process

### Workflow Tips

1. **Keep packages updated** - They're great starting points
2. **Use categories** - Organize deliverables for easy finding
3. **Save common combinations** - Create packages for recurring needs
4. **Review before creating** - Check totals make sense
5. **Add descriptive titles** - Make sprints easy to identify later

## Example Workflows

### Example 1: Custom Quote
```
1. Client calls: "We need a logo and landing page"
2. Open /dashboard/sprint-builder
3. Title: "Acme Corp - Branding + Web"
4. Add: Typography + Logo (×1)
5. Add: Landing Page Design (×1)
6. Review: $4,500 total, 20 hours
7. Create Sprint
8. Share link with client
```

### Example 2: Package Modification
```
1. Client wants "MVP Package" but needs extra prototype
2. Open /dashboard/sprint-builder
3. Select: "MVP Launch Package"
4. Auto-loads: Spec + Prototype + Landing
5. Add: Additional Prototype (×1)
6. Review: $15,000 total (custom)
7. Create Sprint
8. Client gets modified package
```

### Example 3: Internal Sprint
```
1. Team needs sprint for internal tool
2. Open /dashboard/sprint-builder
3. Title: "Internal Dashboard Q1"
4. Add relevant deliverables
5. Set quantities for iterations
6. Create Sprint
7. Track like any client project
```

## Troubleshooting

### Sprint builder not loading deliverables
- Check that deliverables are marked as `active = true`
- Verify database connection
- Check browser console for errors

### Calculations seem wrong
- Verify deliverable `fixed_hours` and `fixed_price` are set
- Check quantity multipliers
- Ensure no null values in pricing

### Can't create sprint
- Must have at least one deliverable selected
- Title is required
- Check for API errors in browser console

### Package not loading deliverables
- Verify package has deliverables linked in `sprint_package_deliverables`
- Check that deliverables are active
- Refresh page

## Analytics

### Track Usage

**Count manual vs AI sprints:**
```sql
SELECT 
  COUNT(CASE WHEN d.content->>'source' = 'manual' THEN 1 END) as manual_sprints,
  COUNT(CASE WHEN d.content->>'source' != 'manual' THEN 1 END) as ai_sprints
FROM sprint_drafts sd
JOIN documents d ON sd.document_id = d.id;
```

**Most used deliverables in manual sprints:**
```sql
SELECT 
  del.name,
  COUNT(spdel.id) as times_used,
  SUM(spdel.quantity) as total_quantity
FROM sprint_deliverables spdel
JOIN deliverables del ON spdel.deliverable_id = del.id
JOIN sprint_drafts sd ON spdel.sprint_draft_id = sd.id
JOIN documents d ON sd.document_id = d.id
WHERE d.content->>'source' = 'manual'
GROUP BY del.id
ORDER BY times_used DESC;
```

## Future Enhancements

Potential additions to Sprint Builder:

1. **Save as template** - Save common combinations for reuse
2. **Duplicate sprint** - Copy existing sprint as starting point
3. **Bulk actions** - Add multiple deliverables at once
4. **Price overrides** - Custom pricing per deliverable
5. **Notes field** - Add internal notes to sprint
6. **Client selector** - Link sprint to existing client/account
7. **Timeline builder** - Add timeline visualization
8. **Export as PDF** - Generate proposal document
9. **Comparison mode** - Compare multiple sprint options
10. **Historical data** - Show "last used" for deliverables

## Summary

The Sprint Builder provides **full control** over sprint creation without requiring AI or intake forms. It's perfect for:

- 🚀 **Quick turnaround** - Create sprints in seconds
- 💪 **Full flexibility** - Choose any deliverable combination
- 💰 **Instant pricing** - See costs in real-time
- 🎯 **Custom solutions** - Build exactly what client needs

Combined with your AI-powered workflow, you now have the best of both worlds: **automation for standard cases** and **manual control for custom needs**.


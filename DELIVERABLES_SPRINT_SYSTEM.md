# Deliverables & Sprint System - Implementation Summary

## Overview
This document describes the simple, transparent system for connecting deliverables to sprint drafts, enabling fixed-price productized services for 2-week sprint planning.

## Philosophy: Productized Services with Fixed Scope

Deliverables are **productized services** - like menu items with fixed pricing:
- ✅ **Fixed hours** - Each deliverable has a set complexity/effort
- ✅ **Fixed price** - Client knows exactly what they're paying
- ✅ **Fixed scope** - Clear description of what's included
- ✅ **Tiered offerings** - Multiple complexity levels (Level 1, 2, 3)

Think of it like ordering from a menu rather than estimating custom work.

## Database Schema

### 1. `deliverables` Table (Productized Services Catalog)
**Purpose**: Catalog of fixed-price deliverables with defined scope

**Fields**:
- `id` - Unique identifier
- `name` - Deliverable name (e.g., "Prototype - Level 2 (Interactive)")
- `description` - When to use this deliverable
- `scope` - **NEW** - What's included (bullet points of features/items)
- `category` - Optional category (e.g., "Branding", "Product")
- `default_estimate_points` - Story points estimate
- `fixed_hours` - **Fixed** hours to complete (not estimated)
- `fixed_price` - **Fixed** price in dollars (not estimated)
- `active` - Whether this deliverable is currently available
- `created_at`, `updated_at` - Timestamps

**Example - Typography/Logo**:
```
name: "Typography Scale + Wordmark Logo"
description: "Essential branding foundation for startups and new products"
scope: "• Custom wordmark logo design
• Typography scale (6 weights)
• Font pairing recommendations
• Brand usage guidelines PDF"
category: "Branding"
default_estimate_points: 5
fixed_hours: 8
fixed_price: 1200
active: true
```

**Example - Tiered Prototypes**:
```
name: "Prototype - Level 1 (Basic)"
description: "Best for concept validation and early stakeholder feedback"
scope: "• Static prototype using HTML/CSS/vanilla JS
• 5-10 screens
• Basic interactivity
• Mobile responsive
• No backend integration"
category: "Product"
fixed_hours: 20
fixed_price: 3000
```

```
name: "Prototype - Level 2 (Interactive)"
description: "Interactive prototype for usability testing and investor demos"
scope: "• React + Tailwind CSS
• 10-20 screens with routing
• State management
• Mock data and APIs
• Form validations
• Responsive design"
category: "Product"
fixed_hours: 40
fixed_price: 6000
```

```
name: "Prototype - Level 3 (Production-Ready)"
description: "High-fidelity prototype that can evolve into production code"
scope: "• Next.js + React + TypeScript
• Supabase backend + auth
• Real database integration
• 20+ screens with full user flows
• API integrations
• Deployment-ready"
category: "Product"
fixed_hours: 80
fixed_price: 12000
```

### 2. `sprint_drafts` Table (Enhanced)
**Purpose**: Stores AI-generated sprint plans with calculated fixed-price totals

**New Fields**:
- `status` - 'draft', 'in_progress', 'completed', 'cancelled'
- `total_estimate_points` - Sum of all deliverable points
- `total_fixed_hours` - Sum of all deliverable fixed hours
- `total_fixed_price` - Sum of all deliverable fixed prices

**Existing Fields**:
- `id`, `document_id`, `ai_response_id`, `draft`, `created_at`

### 3. `sprint_deliverables` Table (NEW - Junction Table)
**Purpose**: Links sprint drafts to deliverables (many-to-many)

**Fields**:
- `id` - Unique identifier
- `sprint_draft_id` - Reference to sprint_drafts
- `deliverable_id` - Reference to deliverables
- `quantity` - How many of this deliverable (default: 1)
- `custom_estimate_points` - Override points for this sprint (optional)
- `custom_hours` - Override fixed hours for this sprint (optional)
- `custom_price` - Override fixed price for this sprint (optional)
- `notes` - Sprint-specific notes about this deliverable
- `created_at` - Timestamp

**Key Feature**: 
- Unique constraint on (sprint_draft_id, deliverable_id) - can't add same deliverable twice
- Allows custom overrides per sprint without changing the catalog
- Typically uses fixed values from catalog (productized pricing)

## Workflow

### Creating a Sprint Draft

1. **User submits intake form** → Creates `document` record
2. **User triggers sprint generation** → AI analyzes intake form
3. **AI loads deliverables catalog** → Gets active deliverables with all fields
4. **AI selects 1-3 deliverables** → Includes in sprint plan JSON
5. **System processes response**:
   - Creates `sprint_drafts` record with status='draft'
   - For each deliverable in AI response:
     - Creates record in `sprint_deliverables` table
     - Fetches hours/budget/points from deliverables catalog
     - Accumulates totals
   - Updates `sprint_drafts` with calculated totals

### Example Sprint Creation Flow

**Input**: Client wants a new mobile app
**AI Response** includes:
```json
{
  "deliverables": [
    {
      "deliverableId": "abc-123",
      "name": "Product spec doc",
      "reason": "Document requirements before development"
    },
    {
      "deliverableId": "xyz-789",
      "name": "Mobile app prototype",
      "reason": "Validate design with stakeholders"
    }
  ],
  "backlog": [...],
  "timeline": [...]
}
```

**System automatically**:
1. Links both deliverables via `sprint_deliverables` table
2. Calculates: 8 + 13 = 21 total points
3. Calculates: 40 + 60 = 100 total hours
4. Calculates: $5,000 + $8,000 = $13,000 total budget
5. Updates sprint_drafts with these totals

## User Interface

### Deliverables Dashboard (`/dashboard/deliverables`)
**Manages the catalog of productized service offerings**

**Form Fields**:
- Name (required) - e.g., "Prototype - Level 2 (Interactive)"
- Category (dropdown: Branding, Product, etc.)
- Description (when to use this) - Short guidance on use cases
- **Scope (what's included)** - Bullet points of deliverables/features
- Default estimate (points) - Complexity in story points
- **Fixed hours** - Set hours for this deliverable (not estimated)
- **Fixed price ($)** - Set price for this deliverable (not estimated)

**Table Columns**:
- Name, Category, Points, Hours, Price, Active, Scope, Actions

**Actions**:
- Add new deliverable (productized service)
- Edit existing deliverable
- Activate/Deactivate deliverable

**Design Philosophy**:
- Each deliverable is a productized offering with known scope
- Hours and price are FIXED, not estimates
- Scope field clearly defines what client gets
- Description helps AI/team understand when to use it

### Sprint Detail Page (`/sprints/[id]`)
**Shows sprint draft with fixed-price totals**

**New Display**:
- Status badge (draft/in_progress/completed/cancelled)
- **Sprint Totals (Fixed Pricing)** card showing:
  - Total Points
  - Fixed Hours (with "h" suffix)
  - Fixed Price (formatted as currency)
- Deliverables section (shows selected deliverables with reasons)

**Client-Facing Benefits**:
- Clear, transparent pricing
- No estimates or ranges - exact pricing
- Shows exactly what deliverables are included
- Professional productized service presentation

## API Endpoints

### Deliverables
- `GET /api/deliverables` - List all (or active only)
- `POST /api/deliverables` - Create new deliverable
- `PATCH /api/deliverables/[id]` - Update deliverable
- `DELETE /api/deliverables/[id]` - Delete deliverable

**All endpoints now support**: `fixedHours`, `fixedPrice`, and `scope` fields

### Sprint Creation
- `POST /api/documents/[id]/sprint` - Generate sprint draft
  - Now automatically links deliverables
  - Calculates and stores totals

## Benefits

### Simple
✅ Client sees exactly what they're getting (deliverables list with scope)
✅ **Fixed pricing** - no estimates, no surprises
✅ Menu-based selection - easy to understand
✅ No complex configuration needed

### Transparent
✅ **Fixed price breakdown** visible to client upfront
✅ Scope clearly defines what's included in each deliverable
✅ Totals calculated automatically from catalog
✅ Professional productized service model

### Robust
✅ Proper database relationships (referential integrity)
✅ Reusable deliverables catalog with fixed pricing
✅ Can override prices per sprint if needed (custom deals)
✅ Easy to query (which sprints use which deliverables?)
✅ Tiered complexity levels (Level 1, 2, 3, etc.)

### Productized
✅ **Fixed hours/price per deliverable** - like a menu
✅ Repeatable, scalable service offerings
✅ Clear scope definition prevents scope creep
✅ Easy to add new tiers/variations

## Example Queries

### Find all sprints using a specific deliverable:
```sql
SELECT sd.*, d.name as deliverable_name
FROM sprint_drafts sd
JOIN sprint_deliverables sdd ON sdd.sprint_draft_id = sd.id
JOIN deliverables d ON d.id = sdd.deliverable_id
WHERE d.id = 'deliverable-id-here';
```

### Get sprint with all its deliverables and fixed pricing:
```sql
SELECT sd.*, 
       json_agg(json_build_object(
         'name', d.name,
         'scope', d.scope,
         'points', d.default_estimate_points,
         'fixed_hours', d.fixed_hours,
         'fixed_price', d.fixed_price
       )) as deliverables
FROM sprint_drafts sd
LEFT JOIN sprint_deliverables sdd ON sdd.sprint_draft_id = sd.id
LEFT JOIN deliverables d ON d.id = sdd.deliverable_id
WHERE sd.id = 'sprint-id-here'
GROUP BY sd.id;
```

### Calculate total revenue across all active sprints:
```sql
SELECT 
  SUM(total_fixed_price) as total_active_revenue,
  SUM(total_fixed_hours) as total_active_hours,
  COUNT(*) as active_sprint_count
FROM sprint_drafts
WHERE status IN ('draft', 'in_progress');
```

## Real-World Examples

### Branding Package
```
Name: "Typography Scale + Wordmark Logo"
Category: Branding
Fixed Hours: 8
Fixed Price: $1,200
Scope:
• Custom wordmark logo design (3 concepts)
• Typography scale (6 weights)
• Font pairing recommendations
• Brand usage guidelines PDF
```

### Prototype Tiers
```
Level 1: $3,000 | 20h | Basic HTML/CSS prototype, 5-10 screens
Level 2: $6,000 | 40h | React prototype, 10-20 screens, state management
Level 3: $12,000 | 80h | Next.js + Supabase, production-ready, 20+ screens
```

### Example Sprint
**Client wants**: Mobile app with branding
**AI Selects**:
1. Typography Scale + Wordmark Logo ($1,200, 8h)
2. Prototype - Level 2 Interactive ($6,000, 40h)

**Sprint Total**: $7,200 | 48 hours | 2 deliverables

Client sees exactly what they're getting and the fixed price!

## Future Enhancements (Optional)

1. **Manual deliverable selection UI** - Let users manually add/remove deliverables when creating sprints
2. **Price constraints** - Set max budget per sprint and warn if exceeded
3. **Historical tracking** - Track actual vs fixed hours/prices for profitability
4. **Deliverable bundles** - Pre-packaged combinations (e.g., "Startup Branding Bundle")
5. **Client-facing proposal view** - Beautiful proposal page showing scope and fixed pricing
6. **Add-ons** - Optional extras that can be added to deliverables
7. **Volume discounts** - Automatic discounts for multiple deliverables

## Migration
The schema changes are automatically applied via `ensureSchema()` in `lib/db.ts`:
- New columns are added with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- New tables created with `CREATE TABLE IF NOT EXISTS`
- Existing `estimated_hours` and `estimated_budget` data is migrated to `fixed_hours` and `fixed_price`
- Old columns kept temporarily to prevent data loss
- Safe to run multiple times (idempotent)

## Key Terminology Changes

| Old Term | New Term | Why? |
|----------|----------|------|
| Estimated Hours | **Fixed Hours** | These are set amounts, not estimates |
| Estimated Budget | **Fixed Price** | Client pays exact price, not an estimate |
| Description | Description + **Scope** | Split into "when to use" vs "what's included" |

This reflects the **productized service** model where deliverables have fixed scope and pricing.


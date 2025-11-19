# Sprint Packages System - Implementation Guide

## Overview

Sprint Packages are **pre-defined bundles of deliverables** that clients can select "off the shelf" for their 2-week sprint. This system enables you to create productized service offerings that combine multiple deliverables with fixed pricing, making it easier for clients to understand and purchase your services.

## Key Benefits

✅ **Pre-packaged offerings** - Create menu-style packages clients can easily choose from
✅ **Fixed pricing** - Bundle pricing with optional discounts vs. individual deliverables
✅ **Faster sales** - Clients can select and start without custom quotes
✅ **Better value** - Package discounts encourage larger purchases
✅ **AI-powered recommendations** - AI can suggest packages that fit client needs

## Database Schema

### 1. `sprint_packages` Table
**Purpose**: Catalog of pre-defined sprint packages

**Fields**:
- `id` - Unique identifier
- `name` - Package name (e.g., "MVP Launch Package")
- `slug` - URL-friendly identifier (e.g., "mvp-launch-package")
- `description` - Full description of the package
- `category` - Package category (e.g., "Startup", "Product", "Branding")
- `tagline` - Short marketing tagline
- `flat_fee` - Override price (if set, ignores deliverable pricing)
- `flat_hours` - Override hours (if set, ignores deliverable hours)
- `discount_percentage` - Percentage discount off total deliverable price
- `active` - Whether package is available for purchase
- `featured` - Whether to highlight this package
- `sort_order` - Display order
- `created_at`, `updated_at` - Timestamps

### 2. `sprint_package_deliverables` Table (Junction)
**Purpose**: Links packages to deliverables (many-to-many)

**Fields**:
- `id` - Unique identifier
- `sprint_package_id` - Reference to sprint_packages
- `deliverable_id` - Reference to deliverables
- `quantity` - How many of this deliverable (default: 1)
- `notes` - Package-specific notes
- `sort_order` - Display order within package
- `created_at` - Timestamp

**Constraints**:
- UNIQUE(sprint_package_id, deliverable_id) - Can't add same deliverable twice

### 3. `sprint_drafts` Table (Enhanced)
**New Field**:
- `sprint_package_id` - Optional reference to sprint_packages (NULL if custom sprint)

## Pricing Logic

Packages support three pricing strategies:

### 1. Flat Fee (Simplest)
```
flat_fee = $10,000
→ Client pays exactly $10,000 regardless of deliverables
```

### 2. Percentage Discount
```
Deliverables total: $12,000
discount_percentage = 15%
→ Client pays $10,200 (15% off)
```

### 3. Sum of Deliverables
```
No flat_fee or discount_percentage set
→ Client pays sum of all deliverable prices
```

## Example Packages

### Startup Branding Bundle
```yaml
Name: "Startup Branding Bundle"
Slug: "startup-branding"
Category: "Branding"
Tagline: "Complete brand identity for your startup"
Flat Fee: $3,500
Deliverables:
  - Typography Scale + Wordmark Logo (×1)
  - Brand Guidelines Document (×1)
  - Social Media Assets (×1)
Savings: $500 vs. individual purchase
```

### MVP Launch Package
```yaml
Name: "MVP Launch Package"
Slug: "mvp-launch"
Category: "Startup"
Tagline: "Launch your MVP in 2 weeks"
Flat Fee: $12,000
Deliverables:
  - Product Spec Document (×1)
  - Prototype - Level 2 Interactive (×1)
  - Landing Page (×1)
Savings: $3,000 vs. individual purchase
```

### Complete Product Sprint
```yaml
Name: "Complete Product Sprint"
Slug: "complete-product"
Category: "Product"
Discount: 20%
Deliverables:
  - User Research & Personas (×1)
  - Wireframes (×1)
  - Prototype - Level 3 Production (×1)
Calculated: $18,000 → $14,400 (20% off)
```

## API Endpoints

### Packages Management
- `GET /api/sprint-packages` - List all packages
  - Query params: `?includeInactive=true`, `?featured=true`
- `POST /api/sprint-packages` - Create new package
- `GET /api/sprint-packages/[id]` - Get package by ID or slug
- `PATCH /api/sprint-packages/[id]` - Update package
- `DELETE /api/sprint-packages/[id]` - Delete package

### Request/Response Examples

**Create Package:**
```json
POST /api/sprint-packages
{
  "name": "MVP Launch Package",
  "slug": "mvp-launch",
  "tagline": "Launch your MVP in 2 weeks",
  "description": "Everything you need to launch your MVP...",
  "category": "Startup",
  "flatFee": 12000,
  "flatHours": 80,
  "active": true,
  "featured": true,
  "deliverables": [
    {
      "deliverableId": "abc-123",
      "quantity": 1,
      "sortOrder": 0
    },
    {
      "deliverableId": "def-456",
      "quantity": 1,
      "sortOrder": 1
    }
  ]
}
```

**Response:**
```json
{
  "id": "pkg-xyz",
  "slug": "mvp-launch"
}
```

## User Interface

### Admin Pages

#### `/dashboard/sprint-packages`
**Purpose**: Manage sprint packages

**Features**:
- List all packages (active and inactive)
- Card-based grid view
- Quick actions: Edit, Activate/Deactivate, Feature/Unfeature, Delete
- Shows pricing breakdown and savings
- Shows included deliverables

#### `/dashboard/sprint-packages/new`
**Purpose**: Create new package

**Form Sections**:
1. **Basic Info** - Name, slug, tagline, description, category
2. **Deliverables** - Select and order deliverables, set quantities
3. **Pricing** - Flat fee, flat hours, or discount percentage
4. **Settings** - Active, featured, sort order

#### `/dashboard/sprint-packages/[id]/edit`
**Purpose**: Edit existing package

**Same as create form** with pre-filled values

### Client-Facing Pages

#### `/packages`
**Purpose**: Browse available sprint packages

**Features**:
- Hero section with CTA
- Category filtering
- Featured packages section
- Grid layout with cards
- Shows pricing, hours, and what's included
- Links to detail pages

#### `/packages/[slug]`
**Purpose**: Detailed package view

**Features**:
- Hero with package name and tagline
- Pricing breakdown
- Detailed deliverables list with scope
- Itemized table showing calculations
- Savings display
- CTA to start project

## AI Integration

### How It Works

1. **AI loads catalogs** - Both packages and individual deliverables
2. **AI analyzes client needs** - Reviews intake form
3. **AI makes recommendation**:
   - **Option A**: Recommends a sprint package (preferred)
   - **Option B**: Recommends 1-3 individual deliverables
4. **System processes response**:
   - If package recommended: Links package, auto-adds all its deliverables
   - If individual deliverables: Links them individually

### AI Response Format

**Package Recommendation:**
```json
{
  "sprintTitle": "MVP Launch Sprint",
  "sprintPackageId": "pkg-xyz",
  "goals": ["Launch MVP", "Validate market"],
  "backlog": [...],
  "timeline": [...]
}
```

**Individual Deliverables:**
```json
{
  "sprintTitle": "Custom Sprint",
  "deliverables": [
    {
      "deliverableId": "abc-123",
      "name": "Product Spec",
      "reason": "Document requirements"
    }
  ],
  "backlog": [...],
  "timeline": [...]
}
```

### AI Prompt Structure

The AI receives:
1. **Sprint Packages Catalog** - All active packages with details
2. **Individual Deliverables Catalog** - All active deliverables
3. **Instructions** - Prefer packages when good fit exists

## Workflow

### Creating a Sprint with Package

1. Client fills intake form → `documents` created
2. "Generate Sprint" clicked → AI analyzes
3. AI recommends "MVP Launch Package"
4. System:
   - Creates `sprint_drafts` record
   - Links `sprint_package_id`
   - Fetches all deliverables from package
   - Creates `sprint_deliverables` records
   - Calculates totals from package pricing
   - Sends email notification
5. Client sees sprint with package included

### Creating a Custom Sprint

1. Client fills intake form → `documents` created
2. "Generate Sprint" clicked → AI analyzes
3. AI selects 3 individual deliverables
4. System:
   - Creates `sprint_drafts` record
   - NO package linked (sprint_package_id = NULL)
   - Creates `sprint_deliverables` records
   - Calculates totals from deliverable pricing
   - Sends email notification
5. Client sees sprint with custom deliverables

## Best Practices

### Package Design

✅ **DO**:
- Create 3-5 well-defined packages for common use cases
- Offer 15-20% discount vs. individual deliverables
- Include 2-4 deliverables per package
- Write clear taglines that communicate value
- Use descriptive slugs (e.g., "mvp-launch" not "package-1")
- Feature your best/most popular packages

❌ **DON'T**:
- Create too many packages (overwhelms clients)
- Set prices arbitrarily (base on deliverables)
- Mix unrelated deliverables
- Forget to update when deliverable prices change

### Pricing Strategy

**Conservative Approach:**
```
Sum deliverables, apply 10-15% discount
→ Client saves money, you maintain margins
```

**Aggressive Approach:**
```
Set flat fee at 20-25% discount
→ Higher perceived value, faster sales
```

**Premium Approach:**
```
Bundle premium deliverables, minimal discount (5-10%)
→ Positions as exclusive offering
```

## Migration & Updates

### Initial Setup

1. **Create deliverables first** - Build your deliverables catalog
2. **Design packages** - Decide what combinations make sense
3. **Set pricing strategy** - Choose discount model
4. **Create packages** - Use admin UI to create
5. **Feature best packages** - Mark 1-2 as featured
6. **Test AI recommendations** - Submit test forms

### Updating Existing Packages

When deliverable prices change:
- **Packages with flat_fee** → No automatic update needed
- **Packages with discount_percentage** → Automatically uses new prices
- **Packages without pricing override** → Automatically uses new prices

To update package deliverables:
1. Navigate to `/dashboard/sprint-packages/[id]/edit`
2. Add/remove deliverables
3. Adjust quantities if needed
4. Update pricing if desired
5. Save changes

## Analytics & Tracking

### Useful Queries

**Most popular packages:**
```sql
SELECT 
  sp.name,
  COUNT(sd.id) as sprint_count,
  SUM(sd.total_fixed_price) as total_revenue
FROM sprint_packages sp
LEFT JOIN sprint_drafts sd ON sp.id = sd.sprint_package_id
GROUP BY sp.id
ORDER BY sprint_count DESC;
```

**Package vs. custom sprint ratio:**
```sql
SELECT 
  COUNT(CASE WHEN sprint_package_id IS NOT NULL THEN 1 END) as package_sprints,
  COUNT(CASE WHEN sprint_package_id IS NULL THEN 1 END) as custom_sprints,
  ROUND(
    COUNT(CASE WHEN sprint_package_id IS NOT NULL THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as package_percentage
FROM sprint_drafts
WHERE status IN ('draft', 'in_progress', 'completed');
```

**Revenue by package:**
```sql
SELECT 
  sp.name,
  COUNT(sd.id) as times_sold,
  sp.flat_fee as package_price,
  COUNT(sd.id) * sp.flat_fee as total_revenue
FROM sprint_packages sp
JOIN sprint_drafts sd ON sp.id = sd.sprint_package_id
WHERE sd.status = 'completed'
GROUP BY sp.id
ORDER BY total_revenue DESC;
```

## Future Enhancements

### Potential Features
1. **Client customization** - Let clients modify packages before purchase
2. **Package bundles** - Combine multiple packages (e.g., "3-sprint roadmap")
3. **Add-ons** - Optional extras that can enhance packages
4. **Volume pricing** - Discounts for multiple packages
5. **Seasonal packages** - Time-limited offers
6. **Client testimonials** - Show social proof per package
7. **Package analytics dashboard** - Track performance metrics
8. **A/B testing** - Test different pricing strategies
9. **Proposal generator** - Export beautiful proposals
10. **Recurring packages** - Ongoing retainer-style packages

## Troubleshooting

### Package not appearing in client view
- Check `active = true`
- Check that deliverables are also active
- Clear cache if applicable

### AI not recommending packages
- Check that packages exist and are active
- Review AI prompt in settings
- Check that package descriptions are clear
- Verify deliverables are properly linked

### Pricing calculations incorrect
- Check if `flat_fee` overrides sum
- Verify `discount_percentage` is set correctly
- Ensure deliverables have valid `fixed_price`
- Check quantity values in junction table

### Sprint creation fails with package
- Verify package ID exists
- Check that package has deliverables
- Ensure deliverables are active
- Check database foreign key constraints

## Support

For questions or issues:
1. Check this documentation
2. Review API endpoint logs
3. Inspect database tables
4. Test with simple package first
5. Verify all foreign keys are valid

## Summary

The Sprint Packages system transforms your deliverables catalog into **productized offerings** that clients can easily understand and purchase. By pre-defining common combinations with clear pricing, you:

- **Reduce sales friction** - Clients choose instead of negotiate
- **Increase average order value** - Bundles encourage bigger purchases
- **Standardize delivery** - Repeatable processes improve quality
- **Scale faster** - Less custom quoting, more predictable work

Start by creating 3-5 packages for your most common client needs, then iterate based on what sells best!


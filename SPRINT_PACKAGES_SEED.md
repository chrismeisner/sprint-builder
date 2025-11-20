# Sprint Packages - Seeding Guide

## Overview

Sprint packages are pre-configured 2-week sprint offerings that combine:
- **1 workshop deliverable** (kickoff workshop)
- **1-3 execution deliverables** (specific, fixed-scope items)
- **Fixed pricing** (total calculated from deliverable prices)
- **Fixed hours** (total calculated from deliverable hours)

Each package provides clients with a clear understanding of what they're getting and at what cost.

## Package Structure Rules

Every sprint package MUST include:
1. **Exactly 1 workshop** - A kickoff workshop appropriate to the sprint type
2. **1-3 deliverables** - Set touchpoint deliverables with clear scope
3. **Fixed pricing** - Calculated automatically from deliverable prices
4. **Fixed hours** - Calculated automatically from deliverable hours

## Seeding the Database

### Prerequisites

Before seeding sprint packages, you must first seed the deliverables:

1. **Seed standard deliverables:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/deliverables/seed
   ```

2. **Seed workshop deliverables:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/deliverables/seed-workshops
   ```

### Seed Sprint Packages

Once deliverables are seeded, create the 3 example sprint packages:

```bash
curl -X POST http://localhost:3000/api/admin/sprint-packages/seed
```

This will create:

### 1. Brand Identity Sprint
- **Slug:** `brand-identity-sprint`
- **Category:** Branding
- **Featured:** Yes
- **Price:** $3,500 (calculated)
- **Hours:** 22 (calculated)
- **Deliverables:**
  - Sprint Kickoff Workshop - Branding
  - Typography Scale + Wordmark Logo
  - Brand Style Guide

### 2. MVP Launch Sprint
- **Slug:** `mvp-launch-sprint`
- **Category:** Product
- **Featured:** Yes
- **Price:** $5,800 (calculated)
- **Hours:** 36 (calculated)
- **Deliverables:**
  - Sprint Kickoff Workshop - Product
  - Landing Page (Marketing)
  - Prototype - Level 1 (Basic)

### 3. Startup Branding Sprint
- **Slug:** `startup-branding-sprint`
- **Category:** Branding
- **Featured:** Yes
- **Price:** $4,100 (calculated)
- **Hours:** 26 (calculated)
- **Deliverables:**
  - Sprint Kickoff Workshop - Startup
  - Typography Scale + Wordmark Logo
  - Social Media Template Kit
  - Pitch Deck Template (Branded)

## Viewing Packages

Once seeded, packages can be viewed at:

- **All packages:** `/packages`
- **Individual package:** `/packages/{slug}`
- **Examples on How It Works:** `/how-it-works` (bottom section)

## Database Schema

### sprint_packages table
```sql
CREATE TABLE sprint_packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category text,
  tagline text,
  flat_fee numeric(10,2),      -- Total package price
  flat_hours numeric(10,2),     -- Total package hours
  discount_percentage numeric(5,2),
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### sprint_package_deliverables table (junction)
```sql
CREATE TABLE sprint_package_deliverables (
  id text PRIMARY KEY,
  sprint_package_id text NOT NULL REFERENCES sprint_packages(id),
  deliverable_id text NOT NULL REFERENCES deliverables(id),
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  sort_order integer NOT NULL DEFAULT 0
);
```

## Creating Custom Packages

To create additional packages via API:

```bash
curl -X POST http://localhost:3000/api/sprint-packages \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Custom Sprint",
    "slug": "my-custom-sprint",
    "description": "Description of the sprint package",
    "tagline": "Short tagline",
    "category": "Product",
    "active": true,
    "featured": false,
    "sortOrder": 10,
    "deliverables": [
      {
        "deliverableId": "workshop-id-here",
        "quantity": 1,
        "sortOrder": 0
      },
      {
        "deliverableId": "deliverable-id-1",
        "quantity": 1,
        "sortOrder": 1
      },
      {
        "deliverableId": "deliverable-id-2",
        "quantity": 1,
        "sortOrder": 2
      }
    ]
  }'
```

The API will automatically calculate `flat_fee` and `flat_hours` from the deliverables.

## Admin Dashboard

Packages can also be managed via the admin dashboard:
- `/dashboard/sprint-packages` - View all packages
- `/dashboard/sprint-packages/new` - Create new package
- `/dashboard/sprint-packages/[id]` - Edit existing package

## Notes

- The seed script will skip seeding if packages already exist
- All 3 default packages are marked as "featured"
- Package prices/hours are calculated from deliverable prices/hours
- Packages link to individual deliverables via the junction table
- Clients see packages on `/packages` and can click through to details


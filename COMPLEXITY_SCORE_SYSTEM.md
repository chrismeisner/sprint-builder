# Complexity Score System

## Overview

The complexity score system allows you to adjust deliverable pricing and hours based on the specific requirements of each sprint. This maintains fixed base pricing while accounting for project-specific complexity variations.

## How It Works

### Base Concept

- **Base Value**: Every deliverable has fixed base hours and price
- **Complexity Score**: Each deliverable in a sprint gets a score from 1.0 to 5.0
- **Default**: 2.5 (standard complexity)
- **Multiplier Formula**: `(complexity_score / 2.5) × base_value = adjusted_value`

### Complexity Scale

```
1.0 = Very Simple     (40% of base price/hours)
1.5 = Simpler         (60% of base price/hours)
2.0 = Below Average   (80% of base price/hours)
2.5 = Standard        (100% of base price/hours) ← DEFAULT
3.0 = Above Average   (120% of base price/hours)
3.5 = More Complex    (140% of base price/hours)
4.0 = Complex         (160% of base price/hours)
4.5 = Very Complex    (180% of base price/hours)
5.0 = Extremely Complex (200% of base price/hours)
```

## Real-World Examples

### Example 1: Simple Wordmark Logo

**Deliverable**: Typography Scale + Wordmark Logo  
**Base**: 8h, $1,200  
**Client Request**: "Just our company name in a clean sans-serif font"

- **Complexity Score**: 1.5 (simpler than average)
- **Adjusted Hours**: 8 × (1.5 / 2.5) = 4.8h
- **Adjusted Price**: $1,200 × (1.5 / 2.5) = $720

### Example 2: Complex Logo Design

**Deliverable**: Typography Scale + Wordmark Logo  
**Base**: 8h, $1,200  
**Client Request**: "Custom ligatures, multiple language support, and special kerning"

- **Complexity Score**: 4.0 (complex)
- **Adjusted Hours**: 8 × (4.0 / 2.5) = 12.8h
- **Adjusted Price**: $1,200 × (4.0 / 2.5) = $1,920

### Example 3: Standard Prototype

**Deliverable**: Prototype - Level 1 (Basic)  
**Base**: 20h, $3,000  
**Client Request**: Standard 5-screen prototype with basic navigation

- **Complexity Score**: 2.5 (standard - no adjustment)
- **Adjusted Hours**: 20 × (2.5 / 2.5) = 20h
- **Adjusted Price**: $3,000 × (2.5 / 2.5) = $3,000

### Example 4: Complex Prototype

**Deliverable**: Prototype - Level 1 (Basic)  
**Base**: 20h, $3,000  
**Client Request**: 10 screens, custom animations, complex data filtering

- **Complexity Score**: 4.5 (very complex)
- **Adjusted Hours**: 20 × (4.5 / 2.5) = 36h
- **Adjusted Price**: $3,000 × (4.5 / 2.5) = $5,400

## Database Implementation

### Schema

The complexity score is stored in the junction table that links deliverables to sprint packages:

```sql
ALTER TABLE sprint_package_deliverables
ADD COLUMN complexity_score numeric(3,1) DEFAULT 2.5 
CHECK (complexity_score >= 1.0 AND complexity_score <= 5.0);
```

### Constraints

- **Type**: Numeric with 1 decimal place
- **Range**: 1.0 to 5.0
- **Default**: 2.5
- **Validation**: Database-level CHECK constraint

## UI Implementation

### Admin Dashboard

When creating or editing a sprint package at `/dashboard/sprint-packages/new`:

1. Select deliverables to include
2. Set quantity for each
3. **Set complexity score (1-5)** ← NEW FIELD
4. See real-time adjusted pricing in the summary

**Complexity Input Features:**
- Number input (min: 1, max: 5, step: 0.5)
- Default: 2.5
- Tooltip: "1=Very Simple, 2.5=Standard, 5=Very Complex"
- Shows adjusted hours/price in real-time

### Client-Facing Pages

**Package Listings** (`/packages`):
- Automatically calculates total price using complexity adjustments
- No complexity score shown (transparent to client)

**Package Detail Page** (`/packages/[slug]`):
- Shows adjusted hours and price per deliverable
- If complexity ≠ 2.5, shows: "Adjusted for project complexity"
- Displays base values with adjusted values
- Complexity score visible but not emphasized

## API Updates

### POST `/api/sprint-packages`

**Request body includes complexity per deliverable:**

```json
{
  "name": "Custom MVP Sprint",
  "slug": "custom-mvp",
  "deliverables": [
    {
      "deliverableId": "workshop-uuid",
      "quantity": 1,
      "sortOrder": 0,
      "complexityScore": 2.5
    },
    {
      "deliverableId": "logo-uuid",
      "quantity": 1,
      "sortOrder": 1,
      "complexityScore": 1.5
    },
    {
      "deliverableId": "prototype-uuid",
      "quantity": 1,
      "sortOrder": 2,
      "complexityScore": 4.0
    }
  ]
}
```

### GET `/api/sprint-packages`

**Response includes complexity for each deliverable:**

```json
{
  "packages": [
    {
      "id": "pkg-123",
      "name": "Custom MVP Sprint",
      "deliverables": [
        {
          "deliverableId": "uuid",
          "name": "Wordmark Logo",
          "fixedHours": 8,
          "fixedPrice": 1200,
          "complexityScore": 1.5,
          "quantity": 1
        }
      ]
    }
  ]
}
```

## Calculation Examples

### Simple Package (All Standard Complexity)

```
Sprint Kickoff Workshop:      4h × (2.5/2.5) × 1 =  4h    $800
Wordmark Logo:                 8h × (2.5/2.5) × 1 =  8h  $1,200
Brand Style Guide:            10h × (2.5/2.5) × 1 = 10h  $1,500
                                                    ----  ------
Total:                                              22h  $3,500
```

### Adjusted Package (Mixed Complexity)

```
Sprint Kickoff Workshop:      4h × (2.5/2.5) × 1 =  4.0h    $800
Wordmark Logo (Simple):       8h × (1.5/2.5) × 1 =  4.8h    $720
Brand Style Guide (Complex): 10h × (3.5/2.5) × 1 = 14.0h  $2,100
                                                    -----  ------
Total:                                              22.8h  $3,620
```

## When to Adjust Complexity

### Increase Complexity (3.0 - 5.0) When:

- Client requests are more extensive than typical
- Multiple revisions or iterations expected
- Complex technical requirements
- Tight integrations with existing systems
- Custom animations or interactions
- Multiple stakeholder approval processes
- Specialized domain knowledge required

### Decrease Complexity (1.0 - 2.0) When:

- Client has very clear, simple requirements
- Minimal customization needed
- Template-based approach acceptable
- Client provides ready-to-use assets
- Limited scope within the deliverable
- Straightforward implementation

### Keep Standard (2.5) When:

- Typical project requirements
- Standard deliverable scope
- Average level of customization
- Normal revision cycles
- Unsure about complexity

## Best Practices

### 1. Assess During Discovery

- Review client requirements during intake
- Ask clarifying questions about scope
- Set expectations about complexity impact on pricing

### 2. Be Consistent

- Use similar complexity scores for similar requirements across projects
- Document why you chose a specific complexity score
- Create internal guidelines for common scenarios

### 3. Communicate Transparently

- Explain to clients why certain deliverables have adjusted pricing
- Show value of complexity adjustments (paying for what they need)
- Use it to prevent scope creep

### 4. Default to Standard

- When in doubt, use 2.5 (standard complexity)
- Only adjust when requirements clearly deviate from standard
- Avoid micro-adjustments (use 0.5 increments)

## Migration Notes

### Existing Packages

- All existing packages will default to 2.5 complexity
- No price changes unless complexity is explicitly adjusted
- Backward compatible with existing data

### Database Migration

The migration is automatic via the schema update:

```sql
ALTER TABLE sprint_package_deliverables
ADD COLUMN IF NOT EXISTS complexity_score numeric(3,1) DEFAULT 2.5 
CHECK (complexity_score >= 1.0 AND complexity_score <= 5.0);
```

All existing records will have `complexity_score = 2.5`, maintaining current pricing.

## Testing Scenarios

### Test Case 1: Create Package with Mixed Complexity

1. Go to `/dashboard/sprint-packages/new`
2. Add 3 deliverables
3. Set complexity: 1.5, 2.5, 4.0
4. Verify calculated total reflects adjustments
5. Save and view on `/packages`
6. Verify pricing is correct

### Test Case 2: Edit Existing Package

1. Go to `/dashboard/sprint-packages/[id]/edit`
2. Change complexity score of one deliverable
3. Verify calculated total updates in real-time
4. Save changes
5. View package detail page
6. Verify new pricing is displayed

### Test Case 3: Seed Default Packages

1. Run seed command: `POST /api/admin/sprint-packages/seed`
2. Verify all deliverables have complexity = 2.5
3. Verify pricing matches expected values
4. View on `/packages` and `/how-it-works`

## Support for Custom Sprints

The complexity system works seamlessly with:

- Pre-packaged sprint templates
- Custom sprint builder
- AI-generated sprint drafts
- Manual sprint creation

In the future, AI could suggest appropriate complexity scores based on client intake form responses.

## Global Sprint Rules (Maintained)

✅ **Every sprint package MUST have:**
1. Exactly 1 workshop deliverable (complexity usually 2.5)
2. 1-3 execution deliverables (complexity adjustable 1.0-5.0)
3. Fixed base pricing per deliverable
4. Complexity-adjusted final pricing

The complexity system **enhances** these rules by adding flexibility while maintaining the fixed-base-price model.


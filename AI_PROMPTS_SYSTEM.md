# AI Prompts System - Updated Documentation

## Overview
The AI prompt system has been comprehensively updated to align with the **productized services model** using a deliverables catalog with fixed pricing. The prompts now guide the AI to create realistic, actionable 2-week sprint plans that leverage predefined deliverables.

## Architecture

### System Components

```
Client Intake Form
      ↓
Documents Table (stores intake JSON)
      ↓
Sprint Generation API (/api/documents/[id]/sprint)
      ↓
AI Prompts System (System + User Prompts + Deliverables Catalog)
      ↓
OpenAI GPT-4o / GPT-4o-mini
      ↓
Sprint Draft JSON (with selected deliverables)
      ↓
Database Processing:
  - Creates sprint_drafts record
  - Links deliverables via sprint_deliverables junction table
  - Calculates totals (points, hours, price)
      ↓
Sprint Display (/sprints/[id])
```

## Updated Prompts

### System Prompt (`DEFAULT_SPRINT_SYSTEM_PROMPT`)

**Purpose**: Define the AI's role, expertise, and operating principles

**Key Elements**:
- **Role Definition**: Experienced software PM and product strategist
- **Core Responsibilities**:
  - Analyze client intake forms for goals and constraints
  - Design realistic 2-week sprint plans
  - Select appropriate productized deliverables from catalog
  - Create detailed backlog with acceptance criteria
  - Plan realistic timelines considering capacity

- **Key Principles**:
  - Pragmatic: What's realistically achievable in 2 weeks?
  - Specific: Clear, actionable tasks (no vague items)
  - Client-focused: Align with stated objectives
  - Productized: Use 1-3 fixed-price deliverables from catalog
  - Constraint-aware: Consider budget, timeline, team size

**Format Requirement**: Output ONLY valid JSON (no markdown, no explanations)

### User Prompt (`DEFAULT_SPRINT_USER_PROMPT`)

**Purpose**: Provide detailed JSON structure and field-by-field guidance

**JSON Structure**:

```json
{
  "sprintTitle": "Descriptive title",
  "deliverables": [
    {
      "deliverableId": "exact-id-from-catalog",
      "name": "Deliverable name",
      "reason": "Why this deliverable is essential"
    }
  ],
  "goals": ["Measurable sprint goals (2-4 items)"],
  "backlog": [
    {
      "id": "SPRINT-001",
      "title": "User story or task",
      "description": "Detailed description with technical approach",
      "estimatePoints": 3,
      "owner": "Role responsible",
      "acceptanceCriteria": ["Testable criteria"]
    }
  ],
  "timeline": [
    {
      "day": 1,
      "focus": "Daily focus area",
      "items": ["Specific tasks for the day"]
    }
  ],
  "assumptions": ["Clear assumptions about team/resources"],
  "risks": ["Identified risks with potential impact"],
  "notes": ["Important context and recommendations"]
}
```

**Field-Specific Guidance**:

#### Deliverables
- Select 1-3 from catalog that match client needs
- Align with project stage (early = prototypes, mature = features)
- Consider budget and timeline constraints
- Choose appropriate tier for prototypes (Level 1/2/3)
- Empty array [] if no catalog items fit
- **MUST use exact `deliverableId` from catalog**

#### Backlog
- 5-12 items that support selected deliverables
- Story points scale:
  - 1 = Trivial task
  - 3 = Moderate complexity
  - 5 = Complex task
  - 8 = Very complex
  - 13 = Epic (should be split)
- Total sprint points: 20-40 for small team
- Logical sequencing (dependencies considered)
- Mix of dev, design, testing, documentation

#### Timeline
- Day-by-day breakdown for 10 working days (2 weeks)
- **Days 1-2**: Setup, research, design
- **Days 3-7**: Core development work
- **Days 8-9**: Testing, refinement, bug fixes
- **Day 10**: Final polish, documentation, demo prep
- Realistic about parallel work and dependencies

## Deliverables Catalog Integration

### How Catalog Data is Provided

The sprint generation API (`/api/documents/[id]/sprint/route.ts`) automatically:

1. **Fetches Active Deliverables**:
```sql
SELECT id, name, description, category, scope, 
       default_estimate_points, fixed_hours, fixed_price
FROM deliverables
WHERE active = true
ORDER BY name ASC
LIMIT 50
```

2. **Formats Catalog for AI**:
```
=== PRODUCTIZED SERVICES CATALOG ===

[1] Typography Scale + Wordmark Logo
    id: abc-123-xyz
    category: Branding
    when to use: Essential branding foundation for startups and new products
    points: 5
    fixed_hours: 8h
    fixed_price: $1200
    scope: • Custom wordmark logo design (3 concepts, 2 revisions)
           • Typography scale with 6 weights
           • Font pairing recommendations
           • Brand usage guidelines PDF
           • Logo files in all formats (SVG, PNG, JPG)

[2] Prototype - Level 2 (Interactive)
    id: def-456-uvw
    category: Product
    when to use: Interactive prototype for usability testing and investor demos
    points: 13
    fixed_hours: 40h
    fixed_price: $6000
    scope: • React + Tailwind CSS
           • 10-20 screens with routing
           • State management
           • Mock data and APIs
           • Form validations
           • Responsive design

=== END CATALOG ===
```

3. **Appends to User Prompt**:
- The formatted catalog is appended after the main user prompt
- AI sees complete context: prompt structure + guidance + actual catalog
- AI must select from this specific catalog using exact IDs

### Catalog Fields Explained

| Field | Purpose | Example |
|-------|---------|---------|
| `id` | Unique identifier (must be exact in AI response) | `"abc-123-xyz"` |
| `name` | Deliverable display name | `"Typography Scale + Wordmark Logo"` |
| `description` | When to use this deliverable | `"Essential branding foundation for startups"` |
| `scope` | What's included (bullet list) | `"• Custom wordmark logo (3 concepts)"` |
| `category` | Grouping for organization | `"Branding"`, `"Product"` |
| `default_estimate_points` | Complexity in story points | `5` |
| `fixed_hours` | Set hours to complete (not estimate) | `8` |
| `fixed_price` | Set price in dollars (not estimate) | `1200` |

## Processing Flow

### 1. AI Generation Phase

**Input to AI**:
- System prompt (role and principles)
- User prompt (JSON structure and guidance)
- Deliverables catalog (formatted list)
- Client intake form JSON

**AI Output**:
```json
{
  "sprintTitle": "MVP Mobile App Sprint",
  "deliverables": [
    {
      "deliverableId": "abc-123",
      "name": "Prototype - Level 2",
      "reason": "Client needs interactive prototype for investor demo"
    }
  ],
  "goals": [...],
  "backlog": [...],
  "timeline": [...]
}
```

### 2. Database Processing Phase

**Automatic Calculations** (lines 327-396 in sprint route):

```javascript
// For each deliverable in AI response:
for (const d of deliverables) {
  // 1. Fetch actual values from deliverables table
  const delRow = await pool.query(
    `SELECT default_estimate_points, fixed_hours, fixed_price
     FROM deliverables WHERE id = $1`,
    [deliverableId]
  );
  
  // 2. Accumulate totals
  totalPoints += delRow.default_estimate_points;
  totalHours += delRow.fixed_hours;
  totalBudget += delRow.fixed_price;
  
  // 3. Create junction table record
  await pool.query(
    `INSERT INTO sprint_deliverables 
     (id, sprint_draft_id, deliverable_id, quantity)
     VALUES ($1, $2, $3, 1)`,
    [junctionId, sprintDraftId, deliverableId]
  );
}

// 4. Update sprint_drafts with totals
await pool.query(
  `UPDATE sprint_drafts
   SET total_estimate_points = $1,
       total_fixed_hours = $2,
       total_fixed_price = $3,
       deliverable_count = $4
   WHERE id = $5`,
  [totalPoints, totalHours, totalBudget, deliverables.length, sprintDraftId]
);
```

**Why This Matters**:
- ✅ **Single source of truth**: Totals calculated from catalog, not AI estimates
- ✅ **Accurate pricing**: Fixed prices never drift from catalog
- ✅ **Audit trail**: Junction table tracks exactly which deliverables were selected
- ✅ **Flexibility**: Can override prices per sprint if needed (custom deals)

## Customization

### Updating Default Prompts

The prompts can be overridden via the `app_settings` table:

```sql
-- Update system prompt
INSERT INTO app_settings (key, value)
VALUES ('sprint_system_prompt', 'Your custom system prompt here')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Update user prompt
INSERT INTO app_settings (key, value)
VALUES ('sprint_user_prompt', 'Your custom user prompt here')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

**Use Cases**:
- Industry-specific language (e.g., healthcare, fintech)
- Different sprint lengths (1-week or 3-week sprints)
- Company-specific methodologies
- Custom deliverable selection criteria

**Admin UI**: Can be built at `/dashboard/settings` to manage prompts

### Best Practices for Custom Prompts

1. **Keep JSON structure**: Don't change field names that database expects
2. **Maintain deliverables format**: Must include `deliverableId`, `name`, `reason`
3. **Test thoroughly**: Generate multiple sprints to verify output consistency
4. **Version control**: Keep history of prompt changes
5. **A/B testing**: Compare outputs from different prompts

## Validation & Quality Control

### AI Output Validation

**Automatic Checks** (in sprint route):

1. **Valid JSON**: Response must parse as JSON
   - If not: Stores raw text in `ai_responses` but doesn't create sprint
   - Returns 202 status with warning

2. **Required Fields**: Must include `sprintTitle`, `deliverables`, etc.
   - Missing fields result in incomplete sprints (still created but flagged)

3. **Deliverable IDs**: Must match catalog
   - Invalid IDs are skipped silently
   - Only valid deliverables are linked

### Quality Indicators

**Good Sprint Output**:
- ✅ 1-3 deliverables selected (not 0, not 5+)
- ✅ Deliverables match client's stated needs
- ✅ Backlog items support the deliverables
- ✅ Timeline is realistic (10 working days)
- ✅ Total points are reasonable (20-40 range)
- ✅ Acceptance criteria are specific and testable

**Warning Signs**:
- ⚠️ No deliverables selected (might indicate catalog doesn't fit)
- ⚠️ Too many deliverables (>3, sprint overload)
- ⚠️ Generic backlog items ("Set up project", "Write code")
- ⚠️ Unrealistic timeline (too much in first 2 days)
- ⚠️ Too many story points (>50 total)

## Examples

### Example 1: Startup Branding Sprint

**Client Intake**: "We're a new startup and need branding basics - logo, colors, fonts"

**AI Selects**:
```json
{
  "sprintTitle": "Brand Foundation Sprint",
  "deliverables": [
    {
      "deliverableId": "branding-logo-001",
      "name": "Typography Scale + Wordmark Logo",
      "reason": "Client needs essential branding foundation as a new startup. This deliverable provides logo, typography system, and usage guidelines needed to establish brand identity."
    }
  ],
  "goals": [
    "Establish core brand identity system",
    "Create reusable logo assets for all platforms",
    "Define typography hierarchy for consistency"
  ],
  "backlog": [
    {
      "id": "SPRINT-001",
      "title": "Brand discovery workshop",
      "description": "Conduct stakeholder interviews to understand brand values, target audience, and competitive landscape",
      "estimatePoints": 3,
      "owner": "Brand Designer",
      "acceptanceCriteria": [
        "Interview 3-5 stakeholders",
        "Document brand values and personality",
        "Identify 3 competitor brands for differentiation"
      ]
    },
    {
      "id": "SPRINT-002",
      "title": "Wordmark logo concepts",
      "description": "Design 3 distinct wordmark logo concepts exploring different typographic approaches",
      "estimatePoints": 5,
      "owner": "Brand Designer",
      "acceptanceCriteria": [
        "3 unique logo concepts presented",
        "Each concept includes color and B&W versions",
        "Rationale provided for each design direction"
      ]
    }
  ]
}
```

**Calculated Totals**:
- Points: 5
- Hours: 8h
- Price: $1,200

### Example 2: Mobile App Prototype Sprint

**Client Intake**: "We need an interactive prototype for our fitness app to show investors"

**AI Selects**:
```json
{
  "sprintTitle": "Fitness App Interactive Prototype Sprint",
  "deliverables": [
    {
      "deliverableId": "prototype-level2-001",
      "name": "Prototype - Level 2 (Interactive)",
      "reason": "Client specifically needs an interactive prototype for investor demos. Level 2 provides React-based prototype with state management and form validations, perfect for demonstrating user flows to investors while keeping development time to 2 weeks."
    }
  ],
  "goals": [
    "Create functional prototype demonstrating core fitness tracking flows",
    "Implement key user interactions for investor demo",
    "Validate UX with interactive state management"
  ],
  "backlog": [
    {
      "id": "SPRINT-001",
      "title": "Set up React + Tailwind prototype foundation",
      "description": "Initialize React project with Tailwind CSS, routing, and basic component structure",
      "estimatePoints": 3,
      "owner": "Frontend Dev",
      "acceptanceCriteria": [
        "React app initialized with TypeScript",
        "Tailwind configured with custom theme",
        "React Router set up for navigation",
        "Component folder structure established"
      ]
    },
    {
      "id": "SPRINT-002",
      "title": "Design and implement workout tracking flow",
      "description": "Create screens for starting workout, logging exercises, and viewing completed session",
      "estimatePoints": 8,
      "owner": "Frontend Dev",
      "acceptanceCriteria": [
        "Workout start screen with exercise selection",
        "Active workout screen with timer and rep counter",
        "Workout summary screen showing completed exercises",
        "State persists across screen navigation",
        "Responsive design for mobile and tablet"
      ]
    }
  ],
  "timeline": [
    {
      "day": 1,
      "focus": "Project setup and foundation",
      "items": [
        "Initialize React + Tailwind project",
        "Set up routing structure",
        "Create basic component library"
      ]
    },
    {
      "day": 2,
      "focus": "Design system and UI components",
      "items": [
        "Build reusable UI components (buttons, cards, forms)",
        "Implement navigation and app shell",
        "Set up state management"
      ]
    }
  ]
}
```

**Calculated Totals**:
- Points: 13
- Hours: 40h
- Price: $6,000

## Monitoring & Optimization

### Metrics to Track

1. **Deliverable Selection Rate**: Which deliverables are most commonly selected?
2. **Empty Deliverables**: How often does AI return `deliverables: []`?
3. **Point Distribution**: Average total points per sprint
4. **Price Distribution**: Average total price per sprint
5. **JSON Parse Failures**: How often does AI return invalid JSON?

### Queries for Analysis

```sql
-- Most popular deliverables
SELECT d.name, COUNT(*) as usage_count
FROM sprint_deliverables sd
JOIN deliverables d ON d.id = sd.deliverable_id
GROUP BY d.name
ORDER BY usage_count DESC;

-- Average sprint totals
SELECT 
  AVG(total_estimate_points) as avg_points,
  AVG(total_fixed_hours) as avg_hours,
  AVG(total_fixed_price) as avg_price
FROM sprint_drafts
WHERE status = 'draft';

-- Sprints with no deliverables selected
SELECT COUNT(*)
FROM sprint_drafts
WHERE deliverable_count = 0 OR deliverable_count IS NULL;
```

## Troubleshooting

### Common Issues

**Issue**: AI returns invalid JSON
- **Cause**: Model confusion or complex intake form
- **Solution**: Check raw response in `ai_responses` table; refine system prompt clarity
- **Status**: Returns 202 with warning; raw text still stored

**Issue**: AI selects inappropriate deliverables
- **Cause**: Deliverable descriptions unclear or catalog doesn't fit client needs
- **Solution**: Update deliverable `description` field to better explain use cases
- **Prevention**: Regularly review and refine catalog based on client patterns

**Issue**: AI doesn't select any deliverables
- **Cause**: No catalog items match client needs or AI confused about requirements
- **Solution**: Expand catalog with more diverse options; check if intake form is clear
- **Status**: Sprint created but totals will be zero

**Issue**: Backlog items don't align with deliverables
- **Cause**: Prompt doesn't emphasize connection between backlog and deliverables
- **Solution**: Already addressed in updated prompts ("Create backlog items that support deliverables")

## Future Enhancements

1. **Few-shot Examples**: Include 2-3 example sprint JSONs in prompt
2. **Client Budget Awareness**: Pass budget constraint to AI for deliverable selection
3. **Historical Data**: "Similar clients received X deliverables"
4. **Multi-turn Refinement**: Allow AI to ask clarifying questions
5. **Deliverable Recommendations**: Pre-select deliverables based on intake keywords
6. **Quality Scoring**: Rate sprint outputs and feed back into prompt engineering

## Conclusion

The updated prompt system is now:
- ✅ **Aligned with database schema** (deliverables, fixed pricing, junction tables)
- ✅ **Productized service focused** (fixed prices, clear scope, catalog-driven)
- ✅ **Comprehensive guidance** (field-by-field instructions, examples, constraints)
- ✅ **Realistic and pragmatic** (2-week focus, capacity-aware, dependency-conscious)
- ✅ **Quality-oriented** (specific acceptance criteria, testable outcomes, professional language)

The system is ready for production use and will generate high-quality, client-ready sprint plans.


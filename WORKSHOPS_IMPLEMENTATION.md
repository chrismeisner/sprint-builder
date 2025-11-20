# Workshops Implementation Guide

## Overview

Workshops have been implemented as **deliverables** in your productized services catalog. Each 2-week sprint now includes a Monday kickoff workshop for alignment, plus 1-3 execution deliverables.

## Why Workshops as Deliverables?

✅ **Simpler architecture** - Uses existing deliverables infrastructure
✅ **Flexible** - AI can mix and match workshops with other deliverables
✅ **Productized pricing** - Fixed scope and pricing, just like other services
✅ **Works with packages** - Can be bundled into sprint packages
✅ **Less complexity** - No new tables or schemas needed

## Workshop Types

### 1. Sprint Kickoff Workshop - Strategy
- **Best for**: Strategic planning, business goals, roadmaps, GTM strategies
- **Fixed Hours**: 4h
- **Fixed Price**: $800
- **Scope**:
  - 90-minute virtual workshop (Monday 9am kickoff)
  - Goals alignment session with stakeholders
  - Strategic objectives prioritization
  - Success metrics definition
  - Risk assessment and mitigation planning
  - Sprint backlog review and prioritization
  - Q&A and next steps alignment

### 2. Sprint Kickoff Workshop - Product
- **Best for**: Product development, features, user experience, technical planning
- **Fixed Hours**: 4h
- **Fixed Price**: $800
- **Scope**:
  - 90-minute virtual workshop (Monday 9am kickoff)
  - Product vision and goals alignment
  - User stories and acceptance criteria review
  - Feature prioritization exercise
  - Technical requirements discussion
  - Sprint backlog refinement
  - Team capacity and timeline confirmation

### 3. Sprint Kickoff Workshop - Design
- **Best for**: UI/UX, branding, visual design work
- **Fixed Hours**: 4h
- **Fixed Price**: $800
- **Scope**:
  - 90-minute virtual workshop (Monday 9am kickoff)
  - Design vision and brand alignment
  - Style direction and aesthetic goals
  - Design principles workshop
  - User experience objectives review
  - Design critique guidelines establishment
  - Design backlog prioritization

### 4. Sprint Kickoff Workshop - Branding
- **Best for**: Brand identity, messaging, positioning
- **Fixed Hours**: 4h
- **Fixed Price**: $800
- **Scope**:
  - 90-minute virtual workshop (Monday 9am kickoff)
  - Brand positioning and messaging alignment
  - Target audience and persona review
  - Brand personality and values definition
  - Visual identity direction discussion
  - Competitive landscape review
  - Brand deliverables prioritization

### 5. Sprint Kickoff Workshop - Startup
- **Best for**: MVP development, launch planning, early-stage startups
- **Fixed Hours**: 4h
- **Fixed Price**: $800
- **Scope**:
  - 90-minute virtual workshop (Monday 9am kickoff)
  - MVP scope and goals alignment
  - Market validation approach
  - Launch strategy and timeline
  - Resource and budget planning
  - Success metrics for MVP
  - Startup sprint backlog review

### 6. Sprint Kickoff Workshop - Marketing
- **Best for**: Campaigns, content strategy, growth initiatives
- **Fixed Hours**: 4h
- **Fixed Price**: $800
- **Scope**:
  - 90-minute virtual workshop (Monday 9am kickoff)
  - Marketing goals and KPIs alignment
  - Campaign strategy and messaging
  - Channel selection and prioritization
  - Content calendar planning
  - Budget allocation review
  - Marketing sprint deliverables prioritization

## AI Selection Logic

The AI has been trained to:
1. **Always select 1 workshop** that matches the project category
2. **Select 1-3 execution deliverables** that deliver the actual work
3. **List workshop FIRST** in the deliverables array
4. **Reference the workshop in Day 1 timeline** (Monday kickoff)

### Workshop Selection Rules

The AI chooses workshops based on project focus:

| Project Type | Workshop Selected |
|-------------|-------------------|
| Business/Strategic | Sprint Kickoff Workshop - Strategy |
| Product Development | Sprint Kickoff Workshop - Product |
| UI/UX/Design | Sprint Kickoff Workshop - Design |
| Brand Identity | Sprint Kickoff Workshop - Branding |
| MVP/Early-Stage | Sprint Kickoff Workshop - Startup |
| Marketing/Growth | Sprint Kickoff Workshop - Marketing |

## How It Works

### Example Sprint Structure

**Before Workshops:**
```
Sprint: "MVP Launch"
Deliverables:
- Prototype - Level 2 ($6,000, 40h)
- Landing Page ($2,000, 16h)
Total: $8,000, 56h, 2 deliverables
```

**After Workshops:**
```
Sprint: "MVP Launch with Kickoff"
Deliverables:
1. Sprint Kickoff Workshop - Startup ($800, 4h) ← Workshop
2. Prototype - Level 2 ($6,000, 40h)
3. Landing Page ($2,000, 16h)
Total: $8,800, 60h, 3 deliverables

Timeline:
Monday 9am: Sprint Kickoff Workshop (alignment)
Monday 2pm - Friday: Begin prototype work
Week 2: Landing page + prototype refinement
```

## Visual Distinction

Workshops are visually distinct in the sprint display:

✨ **Purple badge**: "📋 WORKSHOP"
✨ **Purple background**: Highlighted workshop deliverable
✨ **Monday timing**: "📅 Monday 9:00 AM - Sprint kickoff and alignment session"
✨ **Listed first**: Workshops appear before execution deliverables

## Implementation Files

### 1. Workshop Seed API
**File**: `app/api/admin/deliverables/seed-workshops/route.ts`
**Endpoint**: `POST /api/admin/deliverables/seed-workshops`
**Purpose**: Seeds database with 6 workshop deliverables

### 2. AI Prompts
**File**: `lib/prompts.ts`
**Changes**:
- System prompt updated to mention workshop selection
- User prompt includes detailed workshop selection rules
- Timeline guidance mentions Monday workshop kickoff

### 3. Sprint Display UI
**File**: `app/sprints/[id]/page.tsx`
**Changes**:
- Detects workshop deliverables by name
- Adds purple badge and background styling
- Shows Monday timing for workshops
- Visual distinction from execution deliverables

## Setup Instructions

### 1. Seed Workshop Deliverables

```bash
# Development
curl -X POST http://localhost:3000/api/admin/deliverables/seed-workshops

# Production
curl -X POST https://yourdomain.com/api/admin/deliverables/seed-workshops
```

Expected response:
```json
{
  "success": true,
  "message": "Successfully created 6 workshop deliverables",
  "count": 6,
  "workshops": [
    { "id": "workshop-...", "name": "Sprint Kickoff Workshop - Strategy" },
    { "id": "workshop-...", "name": "Sprint Kickoff Workshop - Product" },
    ...
  ]
}
```

### 2. Verify Workshops

Visit `/dashboard/deliverables` and confirm:
- ✓ 6 workshop deliverables exist
- ✓ Category = "Workshop"
- ✓ Fixed Hours = 4h
- ✓ Fixed Price = $800
- ✓ All are active

### 3. Test Sprint Generation

1. Create a test intake form
2. Generate a sprint
3. Verify the sprint includes:
   - ✓ 1 workshop deliverable (listed first)
   - ✓ 1-3 execution deliverables
   - ✓ Workshop appears with purple badge
   - ✓ Monday timing shows in workshop description

## Pricing Impact

### Before Workshops
- Typical sprint: 1-3 deliverables
- Average: $7,000-$15,000

### After Workshops
- Typical sprint: 1 workshop + 1-3 deliverables
- Average: $7,800-$15,800
- **Additional value**: $800 per sprint for kickoff alignment

### Client Perspective
- ✅ **Clear expectation**: Every sprint starts with Monday kickoff
- ✅ **Better alignment**: Stakeholder alignment before work begins
- ✅ **Reduced risk**: Early detection of scope/goal mismatches
- ✅ **Professional**: Shows structured, methodical approach

## Sprint Package Integration

You can now create packages that include workshops:

### Example: MVP Launch Package
```
Name: "MVP Launch Package"
Deliverables:
- Sprint Kickoff Workshop - Startup ($800, 4h)
- Product Spec Document ($2,000, 16h)
- Prototype - Level 2 ($6,000, 40h)
- Landing Page ($2,000, 16h)
Total: $10,800 (package price)
Savings: $1,000 vs. individual pricing
```

## Best Practices

### Workshop Selection
✅ **DO**: Let AI choose the workshop based on project focus
✅ **DO**: Include 1 workshop per sprint as standard
✅ **DO**: Use workshops to set clear expectations
❌ **DON'T**: Skip workshops for cost savings (they provide critical value)
❌ **DON'T**: Add multiple workshops to one sprint (1 is enough)

### Pricing Strategy
✅ **DO**: Include workshop cost in sprint totals
✅ **DO**: Emphasize value of kickoff alignment to clients
✅ **DO**: Use workshop time for actual client alignment
❌ **DON'T**: Discount workshops (they're already reasonably priced)
❌ **DON'T**: Skip workshop time for execution work

### Client Communication
✅ **DO**: Set expectations that sprints start Monday 9am with workshop
✅ **DO**: Send calendar invite for workshop kickoff
✅ **DO**: Prepare workshop agenda before Monday
❌ **DON'T**: Make workshops optional (they're core value)
❌ **DON'T**: Cancel workshops to speed up execution

## Database Structure

Workshops use the existing `deliverables` table:

```sql
SELECT id, name, category, fixed_hours, fixed_price 
FROM deliverables 
WHERE category = 'Workshop';
```

Example record:
```
id: workshop-a1b2c3d4
name: Sprint Kickoff Workshop - Product
category: Workshop
fixed_hours: 4
fixed_price: 800
scope: • 90-minute virtual workshop...
active: true
```

## Future Enhancements

### Potential Features
1. **Workshop scheduling** - Calendar integration for automatic booking
2. **Workshop templates** - Pre-defined agendas per workshop type
3. **Workshop recordings** - Automatic Zoom integration
4. **Workshop notes** - Collaborative note-taking during sessions
5. **Workshop artifacts** - Generated documents from workshop (e.g., PRD outline)
6. **Post-workshop surveys** - Collect feedback after each workshop
7. **Workshop library** - Archive of past workshop recordings/notes

### Advanced Pricing
1. **Premium workshops** - 2-hour workshops at $1,200
2. **Multi-day workshops** - 2-3 day intensive workshops
3. **In-person workshops** - Higher price for on-site facilitation
4. **Workshop bundles** - Multiple workshops for roadmap planning

## Troubleshooting

### Workshop not appearing in sprint
- Check that workshops were seeded successfully
- Verify workshop deliverables are `active = true`
- Review AI prompt settings
- Check that intake form has clear project category

### AI selecting wrong workshop
- Review intake form for clarity on project focus
- Update AI prompt to refine workshop selection logic
- Consider manually editing sprint after generation

### Visual badge not showing
- Clear browser cache
- Verify workshop name includes "workshop" (case-insensitive)
- Check sprint page component for styling updates

### Pricing seems high
- Remember: $800 workshop provides significant value
- Kickoff alignment reduces costly mid-sprint changes
- Professional agencies include discovery/kickoff in all engagements
- Consider workshop part of overall sprint value, not extra cost

## Metrics to Track

### Adoption Metrics
- **Workshop inclusion rate**: % of sprints with workshops
- **Workshop type distribution**: Which workshops are most common
- **Client satisfaction**: Feedback on workshop value

### Business Metrics
- **Additional revenue**: $800 per sprint from workshops
- **Reduced scope changes**: Fewer mid-sprint adjustments
- **Client retention**: Better alignment = happier clients

### Operational Metrics
- **Workshop attendance**: % of clients who attend
- **Workshop prep time**: Actual time spent preparing
- **Workshop duration**: Average workshop length

## Summary

Workshops add **structured kickoff alignment** to every sprint while:
- ✅ Using existing deliverables infrastructure
- ✅ Maintaining productized service model
- ✅ Adding clear client value
- ✅ Increasing revenue per sprint
- ✅ Reducing mid-sprint scope issues

**Next Steps:**
1. Run seed endpoint to add workshops
2. Generate test sprint to verify
3. Update client communication to mention Monday kickoffs
4. Consider adding workshops to sprint packages

**Questions?** Review this documentation or test the implementation with a sample intake form.


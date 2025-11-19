# Sprint Custom Content - Week-Level Planning

## Overview

Sprints now support **structured custom content** that provides personalized, week-level planning and context. This makes sprint plans more actionable and tailored to specific client needs.

## What Was Added

### 1. **Week-Level Structure**
Each sprint can now have detailed breakdowns for Week 1 and Week 2:

```json
{
  "week1": {
    "overview": "Narrative describing Week 1's focus and strategy",
    "goals": ["Week 1 goal 1", "Week 1 goal 2"],
    "deliverables": ["Deliverable names for week 1"],
    "milestones": ["Checkpoint 1", "Checkpoint 2"]
  },
  "week2": {
    "overview": "Narrative describing Week 2's execution and completion",
    "goals": ["Week 2 goal 1", "Week 2 goal 2"],
    "deliverables": ["Deliverable names for week 2"],
    "milestones": ["Final demo", "Delivery"]
  }
}
```

### 2. **Sprint Approach**
A custom methodology explanation tailored to the specific sprint:

```json
{
  "approach": "1-2 paragraph explanation of the approach and methodology for THIS specific sprint, customized based on the client's situation and constraints."
}
```

### 3. **Visual Display**
Sprint detail pages now prominently display:
- **Sprint Approach** (purple card) - Overall methodology
- **Week 1** (blue card) - First week breakdown
- **Week 2** (orange card) - Second week breakdown

## Features

### AI-Generated Content
AI now creates custom content based on client intake forms:
- ✅ Analyzes client goals, constraints, and context
- ✅ Writes narrative overviews for each week
- ✅ Maps deliverables to appropriate weeks
- ✅ Sets weekly-specific goals and milestones
- ✅ Explains customized approach

### Manual Sprint Builder
Manual sprints can also include custom content:
- ✅ Optional fields for approach and week overviews
- ✅ Simple textarea inputs
- ✅ Same display as AI-generated sprints
- ✅ Flexibility to add as much or little detail as needed

## Sprint Detail Page

### New Sections (in order):

1. **Sprint Totals** (existing - green card)
   - Total points, hours, price

2. **Sprint Approach** (new - purple card)
   - Overall methodology and strategy
   - Customized to client situation

3. **Week 1 & Week 2 Breakdown** (new - side-by-side cards)
   - **Week 1** (blue) - Discovery and foundation
   - **Week 2** (orange) - Execution and delivery
   - Each shows: overview, goals, deliverables, milestones

4. **Deliverables** (existing)
   - Selected deliverables with reasons

5. **Goals, Backlog, Timeline, etc.** (existing)
   - Detailed sprint planning sections

## Use Cases

### 1. Client Communication
**Before:**
> "Here's your sprint with X, Y, Z deliverables."

**After:**
> "Here's your personalized 2-week sprint plan:
> - Week 1: Discovery and research focused on understanding your users
> - Week 2: Building and delivering your interactive prototype
> - Approach: We're using rapid prototyping because you need quick validation"

### 2. Team Alignment
- Teams can see **week-by-week focus**
- Clear **milestones** for checkpoints
- Understanding of **why** this approach was chosen

### 3. Proposal Enhancement
- More professional and detailed proposals
- Shows thought and planning
- Builds confidence in your process

## AI Prompt Changes

### What AI Now Generates

**Before** (focused on day-by-day):
```json
{
  "timeline": [
    { "day": 1, "focus": "Setup", "items": [...] },
    { "day": 2, "focus": "Research", "items": [...] },
    ...
  ]
}
```

**After** (adds week-level narrative):
```json
{
  "approach": "Custom explanation of methodology...",
  "week1": {
    "overview": "Week 1 focuses on discovery...",
    "goals": [...],
    "deliverables": [...],
    "milestones": [...]
  },
  "week2": {
    "overview": "Week 2 is execution...",
    "goals": [...],
    "deliverables": [...],
    "milestones": [...]
  },
  "timeline": [...] // Still has day-by-day detail
}
```

### Prompt Guidance

The AI receives clear instructions:

**Week 1/Week 2:**
- Write narrative overviews that tell the story
- Customize based on client's specific needs
- Week 1: discovery, foundation, setup, research
- Week 2: execution, completion, testing, delivery
- Map deliverables to appropriate weeks
- Set specific checkpoints (milestones)

**Approach:**
- Explain methodology for THIS specific sprint
- Reference client's intake form details
- Explain why selected deliverables make sense
- Make it feel custom, not generic

## Manual Sprint Builder

### New Optional Fields

When creating a sprint manually, you can now add:

1. **Sprint Approach** (textarea)
   - Explain overall methodology
   - Optional but recommended

2. **Week 1 Overview** (textarea)
   - Describe first week's focus
   - Optional

3. **Week 2 Overview** (textarea)
   - Describe second week's execution
   - Optional

These fields are **optional** - you can still create sprints with just deliverables.

## Examples

### Example 1: Startup MVP Sprint

**Approach:**
> "Given your 8-week runway and need to validate with investors, we're using a lean approach focused on speed and visual impact. We'll create an interactive prototype that looks production-ready but uses mock data, allowing you to demo without backend complexity."

**Week 1:**
> "Week 1 is dedicated to understanding your vision and setting up foundations. We'll conduct user research, create detailed product specifications, and design key user flows. The goal is to have a clear, validated plan before any development begins. By end of week, you'll have a complete spec document and approved designs."

**Week 2:**
> "Week 2 shifts to rapid execution. We'll build the interactive prototype using React and Tailwind, implementing all designed screens with realistic interactions. The focus is on creating a demo-ready product that feels real to users. Final deliverable includes a deployed prototype with documentation."

### Example 2: Enterprise Feature Sprint

**Approach:**
> "Working within your existing design system and development standards, we're taking an iterative approach. Week 1 focuses on integration planning and API design to ensure seamless connection with your current platform. Week 2 executes the build with continuous testing against your staging environment."

**Week 1:**
> "Week 1 is about integration and planning. We'll analyze your existing codebase, design API contracts, and create detailed technical specifications that align with your architecture patterns. Daily syncs with your tech lead ensure we're aligned with internal standards."

**Week 2:**
> "Week 2 delivers the feature implementation. Development follows your Git workflow, with pull requests for review. We'll include unit tests, integration tests, and documentation. Final demo on Day 10 shows the feature running in your staging environment."

## Visual Design

### Color Coding
- **Purple** - Sprint Approach (overall)
- **Blue** - Week 1 (beginning)
- **Orange** - Week 2 (completion)
- **Green** - Sprint Totals (pricing)

### Icons & Badges
- **Numbered badges** (1, 2) for week identification
- **✓** for deliverables
- **🎯** for milestones
- Clean, professional layout

## Data Structure

### In Database (`sprint_drafts.draft` JSONB)

```json
{
  "sprintTitle": "MVP Development Sprint",
  "approach": "Custom approach explanation...",
  "week1": {
    "overview": "Week 1 narrative...",
    "goals": ["Goal 1", "Goal 2"],
    "deliverables": ["Product Spec", "Wireframes"],
    "milestones": ["Spec review", "Design approval"]
  },
  "week2": {
    "overview": "Week 2 narrative...",
    "goals": ["Goal 1", "Goal 2"],
    "deliverables": ["Prototype", "Documentation"],
    "milestones": ["Prototype demo", "Final delivery"]
  },
  "deliverables": [...],
  "backlog": [...],
  "timeline": [...],
  "goals": [...],
  "assumptions": [...],
  "risks": [...],
  "notes": [...]
}
```

## Backward Compatibility

✅ **Fully backward compatible**
- Existing sprints without week structure still work
- Fields are optional in UI
- Sprint detail page gracefully handles missing fields
- No migration required

## Benefits

### For Clients
- 📖 **Better understanding** of sprint flow
- 🎯 **Clear expectations** for each week
- 💡 **Insight into methodology**
- 📅 **Visible milestones** for check-ins

### For Your Team
- 🗺️ **Week-by-week roadmap**
- 🎯 **Clear focus** for each week
- 📋 **Structured approach**
- 🤝 **Easier communication**

### For Sales
- 💼 **Professional proposals**
- 📈 **Demonstrates planning expertise**
- 🎨 **Visual sprint breakdown**
- 💰 **Justifies pricing with detailed planning**

## Best Practices

### AI-Generated Sprints
✅ **Do:**
- Provide detailed client context in intake forms
- Let AI customize based on client situation
- Review and adjust AI-generated content
- Use as starting point for client conversations

❌ **Don't:**
- Accept generic AI content without review
- Skip reviewing week breakdowns
- Ignore client-specific details

### Manual Sprints
✅ **Do:**
- Add approach for important/complex sprints
- Write week overviews for clarity
- Keep it concise but informative
- Reference client goals

❌ **Don't:**
- Leave all fields blank (defeats purpose)
- Write generic boilerplate text
- Make it too long/verbose
- Copy-paste from other sprints

## Future Enhancements

Potential additions:
1. **Rich text editing** for overviews
2. **Template library** for common approaches
3. **Weekly goals** as structured list (not just overview)
4. **Dependencies** between weeks
5. **Resource allocation** per week
6. **Client collaboration** on week planning
7. **Milestone tracking** with status updates
8. **Week-level time tracking**

## Summary

The custom content enhancement makes sprints:
- 🎯 **More actionable** - Week-by-week focus
- 📖 **More understandable** - Clear narrative
- 💪 **More professional** - Demonstrates planning
- 🎨 **More personalized** - Tailored to client needs

AI generates this automatically, or you can add it manually. Either way, your sprints are now **strategic planning documents**, not just task lists!


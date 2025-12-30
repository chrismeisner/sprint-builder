export const DEFAULT_SPRINT_SYSTEM_PROMPT = `You are an experienced software project manager and product strategist specializing in 2-week sprint planning using a modular sprint system with Uphill→Downhill methodology and Jobs-to-be-Done framework.

Your role:
- Analyze client intake forms to understand their goals, constraints, and context
- Identify the Job to Be Done (JTBD) - what progress does the client need to make?
- Design realistic, actionable 2-week sprint plans that deliver tangible value
- Select appropriate productized service deliverables from a predefined catalog
- Determine if this is a foundation sprint (needs 3h Brand Sprint Workshop) or follow-on sprint (needs 60-90min JTBD session)
- Frame sprints around outcomes and the real problem, not just deliverable checklists
- Apply Uphill (exploration/shaping) → Downhill (confident execution) thinking

Key principles:
- Outcome-driven: What struggling moment are we solving? What progress does client need?
- Be pragmatic: What can realistically be accomplished in 2 weeks?
- Be specific: Avoid vague tasks; provide clear, actionable items
- Foundation first: New clients need 3-hour Brand Sprint Workshop (Google Ventures style)
- Follow-on sprints: Returning clients need 60-90min JTBD Alignment Session
- Uphill→Downhill: Exploration phase (Days 1-5) leads to confident execution phase (Days 6-10)
- Use productized services: Select sprint packages or individual deliverables from catalog

Output format: Return ONLY a valid JSON object (no markdown, no explanations).`;

// DEPRECATED: Workshops are now deliverables in the catalog, not AI-generated
// export const WORKSHOP_GENERATION_SYSTEM_PROMPT = ...

// DEPRECATED: Workshop generation user prompt - workshops are now catalog deliverables
// export const WORKSHOP_GENERATION_USER_PROMPT = ...

export const DEFAULT_SPRINT_USER_PROMPT = `Based on the client's intake form, create a comprehensive 2-week sprint plan as a JSON object with the following structure:

{
  "sprintTitle": "Short, descriptive title for this sprint (e.g., 'MVP Mobile App Development Sprint')",
  
  "deliverables": [
    {
      "deliverableId": "EXACT id from catalog below",
      "name": "Deliverable name from catalog",
      "reason": "2-3 sentence explanation of why this specific deliverable is essential for this sprint and how it addresses client needs"
    }
  ],
  
  "goals": [
    "Primary measurable goal for this sprint",
    "Secondary goal aligned with client objectives",
    "Additional goals as needed (2-4 total)"
  ],
  
  "week1": {
    "overview": "2-3 paragraph narrative describing Week 1's focus, approach, and how it aligns with client needs. Explain the strategy, key activities, and expected outcomes for the first week.",
    "goals": [
      "Specific goal for week 1",
      "Another week 1 goal"
    ],
    "deliverables": [
      "Deliverable names being worked on in week 1"
    ],
    "milestones": [
      "Key checkpoint or review point",
      "Important milestone to hit by end of week 1"
    ]
  },
  
  "week2": {
    "overview": "2-3 paragraph narrative describing Week 2's focus, approach, and how it builds on Week 1. Explain the execution strategy, completion activities, and final deliverables.",
    "goals": [
      "Specific goal for week 2",
      "Another week 2 goal"
    ],
    "deliverables": [
      "Deliverable names being completed in week 2"
    ],
    "milestones": [
      "Key checkpoint or review point",
      "Final sprint demo or delivery milestone"
    ]
  },
  
  "approach": "1-2 paragraph explanation of the overall approach and methodology for this sprint, customized based on the client's specific situation, constraints, and goals from their intake form.",
  
  "backlog": [
    {
      "id": "SPRINT-001",
      "title": "Clear, actionable user story or task",
      "description": "Detailed description including context, technical approach, and expected outcome",
      "estimatePoints": 3,
      "owner": "Role responsible (e.g., 'Frontend Dev', 'Designer', 'Product Manager')",
      "acceptanceCriteria": [
        "Specific, testable criterion 1",
        "Specific, testable criterion 2",
        "Add 2-5 criteria per item"
      ]
    }
  ],
  
  "timeline": [
    {
      "day": 1,
      "dayOfWeek": "Monday",
      "focus": "Kickoff & Alignment",
      "items": [
        "Workshop with client for discovery and alignment",
        "Capture vision and requirements"
      ]
    }
  ],
  
  "assumptions": [
    "Clear assumption about team, resources, or requirements",
    "Technical assumptions (e.g., 'Client has existing design system')",
    "Process assumptions (e.g., 'Daily standups will occur')"
  ],
  
  "risks": [
    "Identified risk with potential impact",
    "Technical or process risks to watch",
    "Dependency or timeline risks"
  ],
  
  "notes": [
    "Important context or recommendations",
    "Suggestions for future sprints",
    "Technical considerations"
  ]
}

SPRINT TYPE DETERMINATION:
First, identify which type of sprint this is:

TYPE 1: FOUNDATION SPRINT (Brand or Product)
- Client is NEW (first engagement)
- Needs strategic foundation
- INCLUDES: 3-hour Brand Sprint Workshop (Google Ventures style)
- Creates "company operating system" for all future work
- Recommend: "Foundation Branding Sprint" OR "Foundation Product Sprint"

TYPE 2: FOLLOW-ON SPRINT (Iteration Work)
- Client is RETURNING (has completed foundation sprint)
- Needs specific progress on existing foundation
- INCLUDES: 60-90min JTBD Alignment Session
- Focus: Clarify struggling moment, desired outcome, constraints, success criteria
- Recommend: Follow-on sprint package OR custom deliverables with JTBD session

JOBS-TO-BE-DONE FRAMEWORK (for Follow-On Sprints):
Before selecting deliverables, identify:
1. **Struggling Moment**: What's not working for the client right now?
2. **Desired Outcome**: What progress do they want to make?
3. **Constraints**: Time, budget, team size, technical limitations
4. **Success Criteria**: How will we know this sprint succeeded?

Deliverables should SERVE the JTBD, not just check boxes.

SPRINT PACKAGE vs INDIVIDUAL DELIVERABLES:
- Prefer sprint packages when they match client needs and JTBD
- Foundation packages include 3h Brand Sprint Workshop
- Follow-on packages include 60-90min JTBD Alignment Session
- For custom needs, select individual deliverables
- ALWAYS include appropriate workshop type (Brand Sprint OR JTBD Session)
- Use EXACT deliverableId from catalog

BACKLOG GUIDANCE:
- Create 5-12 backlog items that directly support the selected deliverables
- Use story points (1=trivial, 3=moderate, 5=complex, 8=very complex, 13=epic that should be split)
- Total sprint points should be realistic (typically 20-40 points for a small team)
- Ensure items are sequenced logically (dependencies considered)
- Include mix of development, design, testing, and documentation tasks

WEEK 1/WEEK 2 GUIDANCE:
- Write narrative overviews that tell the story of each week's focus and strategy
- Customize based on the client's specific needs, constraints, and goals from their intake form
- Week 1 typically focuses on: discovery, foundation, setup, research, and initial builds
- Week 2 typically focuses on: execution, completion, testing, refinement, and delivery
- Deliverables list should map to which deliverables are actively worked on each week
- Milestones should be specific checkpoints (not tasks, but outcomes/reviews)
- Goals should be weekly-specific, not just restatements of overall goals

APPROACH GUIDANCE:
- The "approach" field should explain the methodology and strategy for THIS specific sprint
- Reference specific details from the client's intake form (their goals, constraints, context)
- Explain why the selected deliverables and timeline make sense for their situation
- This is NOT generic advice - it should feel custom and thoughtful

TIMELINE GUIDANCE (Uphill → Downhill Methodology):
Create day-by-day breakdown for all 10 working days using Uphill→Downhill flow:

**UPHILL PHASE (Days 1-5): Exploration & Shaping**
Purpose: Reduce uncertainty, build confidence, find direction
- Day 1 (Monday): Kickoff workshop
  - Foundation sprint: 3-hour Brand Sprint Workshop
  - Follow-on sprint: 60-90min JTBD Alignment Session
  - Client input REQUIRED - extract real problem, align on intent, confirm success criteria
- Day 2 (Tuesday): Research + divergence
  - Studio heads down exploring options; no live touchpoints, client leaves async comments only
- Day 3 (Wednesday): Work-in-progress share
  - Async Loom/Figma review with OPTIONAL sync, showing "ingredient"/"solution" buckets—categories with grouped variations so the client can react and steer what to carry into Ingredient Review
- Day 4 (Thursday): Ingredient Review
  - Client input REQUIRED - review grouped solutions and categorized ingredients together; decide which to keep, refine, discard, or combine to shape the raw materials into one clear direction
- Day 5 (Friday): Direction locked
  - Studio compiles Day 4 feedback into one clear direction and shares an async outline; the client should see it and think "Yes, this is the solution we want to refine"

**DOWNHILL PHASE (Days 6-10): Confident Execution**
Purpose: Execute with locked direction, no major changes
- Day 6 (Monday): Direction check + build kickoff
  - OPTIONAL sync to review the locked direction, answer last questions, and confirm alignment before going downhill; no directional changes after today
- Day 7 (Tuesday): Deep build day
  - Production continues with OPTIONAL sync share if the client wants another peek
- Day 8 (Wednesday): Work-in-progress review
  - Client input REQUIRED - live or Loom review to see it coming together; early testing, validate progress, request tweaks before polish
- Day 9 (Thursday): Polish + stress test
  - Studio heads down refining assets, QA flows, prepping exports
- Day 10 (Friday): Delivery + handoff
  - Final deliverables and Loom walkthrough with OPTIONAL live demo

**Key Principles**:
- Uphill = uncertainty reduces as we explore, confidence builds
- Downhill = confident execution with locked direction, no surprises
- Direction lock (Day 5) is the pivot point
- Clearly tag each day as “Client input required”, “Optional sync share”, or “Studio heads down”
- Include day of week for client planning

Use clear, professional language. Be specific and actionable.`;

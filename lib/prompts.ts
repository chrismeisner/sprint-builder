export const DEFAULT_SPRINT_SYSTEM_PROMPT = `You are an experienced software project manager and product strategist specializing in 2-week sprint planning.

Your role:
- Analyze client intake forms to understand their goals, constraints, and context
- Design realistic, actionable 2-week sprint plans that deliver tangible value
- Select appropriate productized service deliverables from a predefined catalog
- Create detailed backlog items with clear acceptance criteria
- Plan realistic timelines considering team capacity and complexity

Key principles:
- Be pragmatic: What can realistically be accomplished in 2 weeks?
- Be specific: Avoid vague tasks; provide clear, actionable items
- Be client-focused: Align sprint goals with client's stated objectives
- Use productized services: Select 1-3 execution deliverables from the catalog (NO workshops - those are generated separately)
- Consider constraints: Budget, timeline, team size, and technical complexity

Output format: Return ONLY a valid JSON object (no markdown, no explanations).`;

export const WORKSHOP_GENERATION_SYSTEM_PROMPT = `You are an expert workshop facilitator and strategic consultant specializing in designing highly effective kickoff workshops for 2-week design and development sprints.

Your role:
- Analyze sprint details (deliverables, client goals, project context) to design a custom workshop
- Select proven workshop exercises from a library of real-world tested methods
- Create detailed workshop agendas with timing, activities, and expected outcomes
- Provide client preparation checklists to ensure productive sessions

Key principles:
- Be practical: Workshops should be 90-150 minutes (not too long, not too short)
- Be strategic: Each exercise must serve a clear purpose aligned with sprint deliverables
- Be specific: Provide exact timing, clear instructions, and expected outputs for each activity
- Be client-ready: Give clients a clear checklist of what to prepare/bring
- Use proven methods: Draw from established workshop frameworks (Design Sprint, Lean UX, Jobs-to-be-Done, etc.)

Output format: Return ONLY a valid JSON object (no markdown, no explanations).`;

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

DELIVERABLES GUIDANCE:
- Select 1-3 execution deliverables that BEST match the client's stated needs
- DO NOT include workshop deliverables - those are generated separately by the studio after reviewing the sprint
- Prefer deliverables that align with the project stage (e.g., early-stage projects need prototypes, established products need features)
- Consider the client's budget and timeline constraints
- If prototype tiers exist, choose the appropriate level (Level 1 for validation, Level 2 for testing, Level 3 for production)
- ALWAYS use the EXACT deliverableId from the catalog
- Focus on tangible execution deliverables (design, development, content, etc.)

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

TIMELINE GUIDANCE:
- Create day-by-day breakdown for all 10 working days (2 weeks, Monday-Friday each week)
- Day 1 (Monday): Kickoff & Alignment workshop with client for discovery
- Day 2 (Tuesday): Studio exploration - create direction options to choose from
- Day 3 (Wednesday): First Review - studio presents direction solutions
- Day 4 (Thursday): Feedback & Refinement - collect client feedback, refine directions
- Day 5 (Friday): Direction Lock - finalize and share locked direction with client
- Day 6 (Monday): Deliverables Alignment - revisit deliverables from Day 1 with locked solution direction, map deliverables to solution, align on execution path
- Day 7 (Tuesday): Build & Execution - studio heads down crafting solution
- Day 8 (Wednesday): Progress Review - studio shares progress, all deliverables outlined, Q&A
- Day 9 (Thursday): Final Execution - heads down refining assets and deliverables
- Day 10 (Friday): Delivery - solution delivered, demo to client, handoff completed
- Include day of week for each day to help client plan their schedule
- Specify whether activity is client-facing or studio internal work

Use clear, professional language. Be specific and actionable.`;

export const WORKSHOP_GENERATION_USER_PROMPT = `Based on the sprint draft details below, design a custom kickoff workshop as a JSON object with the following structure:

{
  "title": "Clear, descriptive title for this workshop (e.g., 'MVP Product Strategy Workshop')",
  
  "duration": 120,  // Total duration in minutes (typically 90-150 minutes)
  
  "objectives": [
    "Primary objective for this workshop",
    "Secondary objective aligned with sprint deliverables",
    "2-4 objectives total"
  ],
  
  "agenda": [
    {
      "section": "Welcome & Context Setting",
      "duration": 10,  // minutes
      "activities": [
        "Team introductions and roles",
        "Review sprint deliverables and timeline",
        "Set expectations for workshop outcomes"
      ],
      "facilitator": "Studio lead",
      "output": "Aligned understanding of sprint scope and goals"
    },
    {
      "section": "Exercise Name (e.g., 'Lightning Decision Jam')",
      "duration": 30,
      "description": "Brief explanation of what this exercise accomplishes and why it's valuable for this sprint",
      "activities": [
        "Step-by-step activity instructions",
        "Each step should be clear and actionable"
      ],
      "materials": ["Miro board", "Sticky notes", "Timer"],
      "facilitator": "Studio facilitator",
      "participants": "Client + design team",
      "output": "Specific, tangible outcome from this exercise (e.g., 'Prioritized list of 5 core features')"
    }
    // Include 3-5 total agenda sections with varied exercise types
  ],
  
  "exercises": [
    {
      "name": "Name of the proven exercise (e.g., 'How Might We', 'Rose/Thorn/Bud', '5 Whys')",
      "source": "Origin/framework (e.g., 'Design Sprint by Google Ventures', 'Lean UX', 'Agile Retrospectives')",
      "purpose": "What problem this exercise solves or what insight it reveals",
      "bestFor": "Type of situation where this exercise excels",
      "timing": "15-20 minutes",
      "howToRun": [
        "Step 1: Clear instruction",
        "Step 2: Clear instruction",
        "Step 3: Clear instruction"
      ]
    }
    // List 1-2 key exercises used in the agenda with full details
  ],
  
  "clientPreparation": {
    "beforeWorkshop": [
      "Specific thing client should prepare (e.g., 'List of 3-5 competitors with links')",
      "Another preparation item with clear why (e.g., 'Brand adjectives or mood board if available - helps us understand your vision')",
      "Technical requirements (e.g., 'Access to Figma/Miro - we'll send invite 24h before')"
    ],
    "toBring": [
      "What client should have ready during workshop",
      "Examples: 'Product requirements doc', 'User research insights', 'Brand guidelines if they exist'"
    ],
    "attendees": [
      "Decision maker who can approve directions (critical)",
      "Product owner or project lead",
      "Optional: Key stakeholder or subject matter expert"
    ],
    "timeCommitment": "2 hours + 15 min post-workshop recap"
  },
  
  "expectedOutcomes": [
    "Concrete deliverable from the workshop (e.g., 'Prioritized feature list with effort estimates')",
    "Another key outcome (e.g., 'Visual direction board with 3 design concepts')",
    "Alignment outcome (e.g., 'Shared understanding of target user and their needs')"
  ],
  
  "nextSteps": [
    "What happens immediately after workshop",
    "How workshop outcomes inform sprint execution",
    "Communication plan for rest of sprint"
  ],
  
  "notes": [
    "Important context or recommendations for running this workshop",
    "Potential challenges to watch for",
    "Suggestions for making workshop more effective"
  ]
}

EXERCISE SELECTION GUIDANCE:
- Choose 1-2 proven workshop exercises that map directly to the sprint deliverables
- For BRANDING sprints: Brand personality exercises, mood boarding, competitor analysis
- For PRODUCT sprints: User story mapping, feature prioritization (MoSCoW, Kano), journey mapping
- For PROTOTYPE sprints: Sketch sessions, rapid ideation, assumption mapping
- For MARKETING sprints: Persona definition, messaging hierarchy, channel strategy
- For WEBSITE sprints: Content prioritization, IA card sorting, wireframe co-creation
- Mix strategic exercises (understanding) with tactical exercises (decision-making)
- Prefer interactive, collaborative exercises over passive presentations

TIMING GUIDANCE:
- Start with 5-10 min context setting (not too long)
- Each exercise should be 15-30 minutes (time-boxed)
- Include 5-min buffers between major sections
- End with 10-15 min recap and next steps
- Total: 90-150 minutes (no longer - respect client time)

CLIENT PREPARATION GUIDANCE:
- Be specific about what to prepare and WHY it's needed
- Request only essential items (don't overwhelm)
- Provide examples for abstract requests
- Include technical setup (Zoom, Miro, Figma access)
- Emphasize that decision-maker attendance is critical
- Set realistic time expectations

OUTPUT GUIDANCE:
- Each agenda item must have a clear, measurable output
- Outputs should feed directly into sprint execution
- Avoid vague outcomes like "better understanding" - be specific
- Workshop should produce artifacts the team can reference throughout sprint

Use clear, professional language. Be specific and actionable. Base workshop design on the actual sprint deliverables and client context provided.`;




/**
 * Miles Personas Data
 * User personas for the Miles teen driving app.
 * 
 * Schema follows JTBD (Jobs To Be Done) framework:
 * - Role + Relationship
 * - Core Job (JTBD statement)
 * - Trigger Moments
 * - Must-Have Outcomes
 * - Trust & Fairness Rules
 * - Default Visibility Model
 * - What Success Looks Like
 */

const PERSONAS = [
  {
    id: "driving-parent",
    name: "The Driving Parent",
    emoji: "👨‍👧",
    avatar: "./images/persona-1-male-light.jpg",
    avatarBase: "./images/persona-1",  // variants: {base}-{gender}-{skintone}.jpg
    
    // Role & Relationship
    role: "Account Owner (Admin)",
    relationship: "Parent/guardian of a new teen driver (often the researcher; decision is usually joint)",

    // Core Job (JTBD)
    coreJob: "When my teen is driving independently, I want confidence they're safe and building good habits, so I can let them grow up without constant worry.",

    // Trigger Moments (why they open Miles)
    triggerMoments: [
      "Teen departs / is out longer than expected",
      "Arrival/departure confirmation",
      "Incident alert (hard brake/impact)",
      "Insurance renewal / \"prove safe driver\" moment"
    ],

    // Must-Have Outcomes (non-negotiables)
    mustHaveOutcomes: [
      {
        label: "Know what's happening & what to do next",
        description: "clear picture of what occurred and actionable next steps — aspiration is to explain why when possible, but the baseline is always what + what to do"
      },
      {
        label: "Alerts, not streams — \"I'll know when I need to know\"",
        description: "trust Miles to run quietly in the background; it's not another thing to monitor and worry about — it surfaces what matters when it matters"
      },
      {
        label: "Vehicle peace of mind",
        description: "head off costly maintenance issues; trusting a teen with car upkeep is stressful and expensive — Miles keeps you informed so nothing slips through the cracks"
      },
      {
        label: "Coaching frame, not punishment",
        description: "help them guide behavior without \"gotcha\" dynamics (avoid punitive-dongle vibes)"
      },
      {
        label: "Trust ladder",
        description: "more support early → taper to summaries over time"
      }
    ],

    // Trust & Fairness Rules (what can't be violated)
    trustFairnessRules: [
      "Teen shouldn't feel secretly surveilled; no secret monitoring",
      "If parent accesses deeper details, teen is aware (override transparency model)",
      "Alerts should be shared, so conversations stay fact-based, not adversarial",
      "Information presented in a non-judgmental way — empowering to know more, not demotivating to feel judged",
      "Only parents and teen see data — confidence it won't be used against them, sold, or shared with third parties"
    ],

    // Default Visibility Model (how Miles should behave by default)
    defaultVisibility: {
      sees: "arrival/departure + summaries + incident alerts + \"coach-ready\" insights. If a trip is in progress and parent opens the app, show real-time confirmation the trip is \"good\" (status, key stats) — but powerful summaries should naturally become the primary touchpoint over time.",
      doesNotSee: "constant live feed/speed/map as the default posture — the app shouldn't feel like something to watch, but something to trust"
    },

    // What Success Looks Like
    successLooksLike: [
      "Head off costly maintenance issues before they escalate",
      "Fewer check-in texts, less anxiety → proxy: decreasing frequency of parent opening the app within 15 min of a trip starting",
      "More productive \"here's what happened\" conversations",
      "Trust built through visible track record → proxy: teen opens their score screen weekly, shares a milestone",
      "Clear proof + better insurance posture (score/certificate)"
    ]
  },

  {
    id: "new-teen-driver",
    name: "The New Driver",
    emoji: "🚗",
    avatar: "./images/persona-2-male-light.jpg",
    avatarBase: "./images/persona-2",  // variants: {base}-{gender}-{skintone}.jpg
    
    // Role & Relationship
    role: "Driver (consent-needed participant)",
    relationship: "Teen driver (often skeptical at first; buy-in can kill adoption)",

    // Core Job (JTBD)
    coreJob: "When I'm driving, I want to prove I'm responsible and know help is coming if I need it, so I can enjoy independence without feeling constantly watched.",

    // Trigger Moments (why they open Miles)
    triggerMoments: [
      "Install/setup (\"what's in it for me?\")",
      "After a drive: check score / progress",
      "\"What did my parents see?\"",
      "Check engine light or vehicle issue — feel empowered, not helpless; know what's happening and what to do about it",
      "Demystify car ownership & maintenance — build confidence around an unfamiliar responsibility",
      "Incident: need proof / need help"
    ],

    // Must-Have Outcomes (non-negotiables)
    mustHaveOutcomes: [
      {
        label: "Progress path",
        description: "know and feel confident they are improving — milestones → less oversight (earned independence). Less anxiety and nerves about driving."
      },
      {
        label: "Help is coming",
        description: "reliable incident response beyond phone-detection limitations"
      },
      {
        label: "Fairness/transparency",
        description: "know exactly what parents can see; no hidden parent mode"
      },
      {
        label: "Proof of innocence",
        description: "video evidence so they aren't blamed \"because I'm young\" (comes with camera — future phase)"
      }
    ],

    // Trust & Fairness Rules (what can't be violated)
    trustFairnessRules: [
      "Privacy by default: teen \"owns\" driving data; parent sees summaries by default",
      "Parent can override for safety, but teen is notified (transparent override)",
      "Symmetric alerts: if something triggers an alert, both get it",
      "Parent sees more at the beginning, then access ramps down over time as trust is earned (phase model)",
      "Information presented in a non-judgmental way — empowering to know more, not demotivating to feel judged",
      "Only parents and teen see data — confidence it won't be used against them, sold, or shared with third parties"
    ],

    // Default Visibility Model (how Miles should behave by default)
    defaultVisibility: {
      sees: "their own trips/scores; understands what's shared",
      doesNotSee: null,
      productPositioning: "The product reads as protection + proof + savings, not surveillance"
    },

    // What Success Looks Like
    successLooksLike: [
      "More independence, fewer arguments",
      "Trust built through a visible \"track record\"",
      "Feeling protected + believed when things go wrong"
    ]
  }
];

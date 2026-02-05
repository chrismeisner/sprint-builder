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
    avatar: "./images/scene-01.jpg",
    
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
        label: "Context > constant monitoring",
        description: "understand WHY, not just THAT (video proof, incident summarization)"
      },
      {
        label: "Alerts, not streams",
        description: "threshold breaches + incidents + trip summaries (not live speed/map as default)"
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
      "Alerts should be shared, so conversations stay fact-based, not adversarial"
    ],

    // Default Visibility Model (how Miles should behave by default)
    defaultVisibility: {
      sees: "arrival/departure + summaries + incident alerts + \"coach-ready\" insights",
      doesNotSee: "constant live feed/speed/map as the default posture"
    },

    // What Success Looks Like
    successLooksLike: [
      "Fewer check-in texts, less anxiety",
      "More productive \"here's what happened\" conversations",
      "Clear proof + better insurance posture (score/certificate)"
    ]
  },

  {
    id: "new-teen-driver",
    name: "The New Driver",
    emoji: "🚗",
    avatar: "./images/scene-02.jpg",
    
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
      "Incident: need proof / need help"
    ],

    // Must-Have Outcomes (non-negotiables)
    mustHaveOutcomes: [
      {
        label: "Proof of innocence",
        description: "video evidence so they aren't blamed \"because I'm young\""
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
        label: "Progress path",
        description: "milestones → less oversight (earned independence)"
      }
    ],

    // Trust & Fairness Rules (what can't be violated)
    trustFairnessRules: [
      "Privacy by default: teen \"owns\" driving data; parent sees summaries by default",
      "Parent can override for safety, but teen is notified (transparent override)",
      "Symmetric alerts: if something triggers an alert, both get it"
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

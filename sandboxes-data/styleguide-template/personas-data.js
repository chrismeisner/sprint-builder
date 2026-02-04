/**
 * Shared Personas Data
 * Edit this file to customize your user personas.
 * Both profiles.html and user-journey.html reference this data.
 */

const PERSONAS = [
  {
    id: "alex",
    name: "Alex Chen",
    role: "Early-Stage Founder",
    avatar: null, // Set to image path, or null for emoji placeholder
    emoji: "👨‍💻",
    tags: ["B2B SaaS", "Technical", "First-time founder"],
    quote: "I need to move fast and validate ideas before we run out of runway. I can't spend weeks on something that might not work.",
    demographics: {
      age: "28-35",
      location: "San Francisco, CA",
      techLevel: "High",
      budget: "Bootstrap / Pre-seed"
    },
    goals: [
      "Launch MVP in under 8 weeks",
      "Get first 10 paying customers",
      "Validate product-market fit quickly",
      "Build something users actually want"
    ],
    painPoints: [
      "Limited time and resources",
      "Uncertainty about what to build first",
      "No dedicated design resources",
      "Analysis paralysis on tool choices"
    ],
    behaviors: [
      "Researches extensively before committing",
      "Values speed over perfection",
      "Active in founder communities (Twitter, Slack)",
      "Prefers self-serve tools with good docs"
    ],
    // Which journey stages this persona is most engaged in
    journeyStages: ["Awareness", "Consideration", "Decision"]
  },
  {
    id: "sarah",
    name: "Sarah Martinez",
    role: "Product Manager",
    avatar: null,
    emoji: "👩‍💼",
    tags: ["B2B", "Growth-stage", "Non-technical"],
    quote: "I need to ship features that actually move the needle, not just check boxes. But getting alignment across teams is half the battle.",
    demographics: {
      age: "30-40",
      location: "New York, NY",
      techLevel: "Medium",
      budget: "Series A-B budget"
    },
    goals: [
      "Ship features that improve key metrics",
      "Get stakeholder alignment faster",
      "Reduce time from idea to launch",
      "Build a scalable product process"
    ],
    painPoints: [
      "Too many stakeholders with opinions",
      "Engineering bottlenecks",
      "Hard to prioritize competing requests",
      "Lack of user research capacity"
    ],
    behaviors: [
      "Uses data to justify decisions",
      "Relies on frameworks and processes",
      "Collaborates heavily with design/eng",
      "Reads product blogs and newsletters"
    ],
    journeyStages: ["Consideration", "Onboarding", "Engagement"]
  }
];

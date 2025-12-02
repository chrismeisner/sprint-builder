/**
 * Great Work Studio - Messaging Constants
 * Single Source of Truth (SSOT) for all copy blocks
 * 
 * Based on the Copy & Messaging Guide
 */

export const MESSAGING = {
  // Core Value Proposition
  valueProposition: "Fast clarity. Fast momentum. Real output every 10 days.",
  
  // Brand Essence
  oneLiner: "Fast clarity. Fast momentum. Real output every 10 days.",
  
  // Reusable Language Blocks
  foundationBlock: "Every founder begins with a Foundation Sprint—a structured intake followed by the strategic base your brand or product will build on.",
  
  modelExplanation: "Each 2-week sprint is how Great Work Studio keeps momentum. Week 1 is Uphill (exploration, understanding, decision). Week 2 is Downhill (execution, refinement, delivery).",
  
  outcomeBlock: "Every sprint ends with a tangible, shareable deliverable.",
  
  founderTimeBlock: "You're only involved when your input meaningfully advances the sprint. We carry the rest.",
  
  promiseBlock: "No chaos. No drifting. Just structured, fast, meaningful progress.",
  
  // Sprint Types
  foundationDescription: "Where every founder begins. Your clarity layer. Your strategic base. Sets the cadence for every future sprint.",
  
  expansionDescription: "Your next move. A focused two-week sprint for a specific outcome. Built on your foundation.",
  
  customDescription: "For ambiguous or hybrid challenges. Shaped via discovery. Still two weeks. Same trusted cadence.",
} as const;

/**
 * 10-Day Emotional Journey
 * Mandatory sequence that all sprints should follow
 */
export const EMOTIONAL_ARC = [
  { day: 1, emotion: "Aligned", description: "Workshop brings clarity and shared understanding" },
  { day: 2, emotion: "Curious", description: "Exploration begins, possibilities emerge" },
  { day: 3, emotion: "Excited", description: "Direction takes shape, energy builds" },
  { day: 4, emotion: "Decisive", description: "Decision Day locks in the winning path" },
  { day: 5, emotion: "Clear", description: "Execution plan set, uncertainty eliminated" },
  { day: 6, emotion: "Focused", description: "Build mode begins with clear direction" },
  { day: 7, emotion: "Inspired", description: "Progress visible, momentum building" },
  { day: 8, emotion: "Confident", description: "WIP review confirms we're on track" },
  { day: 9, emotion: "Meticulous", description: "Polish phase ensures quality" },
  { day: 10, emotion: "Satisfied", description: "Delivery complete, sprint accomplished" },
] as const;

/**
 * Approved Headlines (H1)
 */
export const APPROVED_HEADLINES = [
  "Let's climb",
  "BUILD WITH CLARITY",
  "YOUR NEXT TWO-WEEK SPRINT STARTS HERE",
  "FAST BRAND & PRODUCT PROGRESS",
  "STRUCTURED MOMENTUM FOR FOUNDERS",
] as const;

/**
 * Core Vocabulary
 * Always use these terms consistently
 */
export const VOCABULARY = {
  sprintSystem: "Great Work Studio sprint cadence",
  week1: "Uphill Week",
  week2: "Downhill Week",
  foundationSprint: "Foundation Sprint",
  expansionSprint: "Expansion Sprint",
  customSprint: "Custom Sprint",
  deliverableLibrary: "Deliverable Library",
  brandPackage: "Brand Foundation Package",
  productPackage: "Product Foundation Package",
} as const;

/**
 * Terms to avoid
 */
export const AVOID = [
  "zig/zag",
  "retainer",
  "engagement",
  "creative cycle",
  "agency terms",
  "summit",
  "peak performance",
  "sherpa",
] as const;


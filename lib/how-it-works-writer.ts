export type HowItWorksOption = {
  value: string;
  label: string;
  description: string;
  guidance: string;
};

function toMap(options: HowItWorksOption[]): Record<string, HowItWorksOption> {
  return options.reduce<Record<string, HowItWorksOption>>((acc, option) => {
    acc[option.value] = option;
    return acc;
  }, {});
}

export const STRATEGY_OPTIONS: HowItWorksOption[] = [
  {
    value: "narrative-arc",
    label: "Narrative Arc",
    description: "Frame each step as a chapter in the customer’s transformation story.",
    guidance:
      "Open with the customer’s trigger moment, show how each stage removes friction, and close with the measurable win.",
  },
  {
    value: "proof-stack",
    label: "Proof Stack",
    description: "Lead with evidence, de-risk adoption, and anchor every step in outcomes.",
    guidance:
      "Pair each phase with proof (metrics, testimonials, benchmarks) so buyers see your credibility before the CTA.",
  },
  {
    value: "product-tour",
    label: "Product Tour",
    description: "Walk through the signature product moments from setup to success.",
    guidance:
      "Describe exactly what happens on screen or in product at every step and highlight the ‘aha’ moment that follows.",
  },
  {
    value: "service-blueprint",
    label: "Service Blueprint",
    description: "Reveal the behind-the-scenes team, tooling, and handoffs that create the experience.",
    guidance:
      "Call out owners, rituals, and quality gates so operations leaders trust the reliability of each phase.",
  },
  {
    value: "momentum-loop",
    label: "Momentum Loop",
    description: "Emphasize iteration, speed, and the feedback loops that keep improvements shipping.",
    guidance:
      "Each step should show how learnings feed the next sprint—think pilot, measure, refine, relaunch.",
  },
];

export const PERSONALITY_OPTIONS: HowItWorksOption[] = [
  {
    value: "neutral",
    label: "Editorial Neutral",
    description: "Balanced, clear voice that feels like a trusted newsroom source.",
    guidance: "Write with confident, precise sentences. Avoid hype and let the facts carry the persuasion.",
  },
  {
    value: "mentor",
    label: "Seasoned Mentor",
    description: "Calm, experienced partner with pragmatic guidance.",
    guidance: "Use reassuring language and signal you’ve seen this before. Prioritize clarity over slogans.",
  },
  {
    value: "hype",
    label: "Launch Partner",
    description: "Energetic, optimistic, and rallying—perfect for big reveals.",
    guidance: "Lean into momentum, use vivid verbs, and finish each step with a punchy promise.",
  },
  {
    value: "analyst",
    label: "Product Analyst",
    description: "Crisp, data-fluent tone for operators and finance leaders.",
    guidance: "Stay structured, cite specific metrics, and connect each step to measurable ROI.",
  },
];

export const EMPHASIS_OPTIONS: HowItWorksOption[] = [
  {
    value: "speed",
    label: "Speed to Value",
    description: "Highlight how quickly teams reach a meaningful win.",
    guidance: "Quantify time saved or launches accelerated in every step.",
  },
  {
    value: "control",
    label: "Control & Safety",
    description: "Show enterprise-grade guardrails, governance, and compliance.",
    guidance: "Mention approvals, reviews, or safeguards that keep risk low.",
  },
  {
    value: "proof",
    label: "Evidence & ROI",
    description: "Anchor the story in data, testimonials, and measurable lift.",
    guidance: "Reference metrics, case studies, or benchmarks where possible.",
  },
  {
    value: "delight",
    label: "Craft & Delight",
    description: "Focus on the polished experience and customer joy.",
    guidance: "Describe sensory details, polish, and unexpected moments of care.",
  },
];

export const FORMAT_OPTIONS: HowItWorksOption[] = [
  {
    value: "concise",
    label: "Snapshot (≈120 words)",
    description: "Two tight paragraphs plus a compact list of steps.",
    guidance: "Keep intros under 40 words and limit each step description to ~30 words.",
  },
  {
    value: "medium",
    label: "Feature Story (≈220 words)",
    description: "Short opener followed by fuller paragraphs per step.",
    guidance: "Give each stage ~60 words and weave in transitions for a premium feel.",
  },
  {
    value: "playbook",
    label: "Bullet Playbook",
    description: "Headline, subhead, and crisp bullets for each stage.",
    guidance: "Use bolded step titles and tight bullet sentences with verbs up front.",
  },
];

export const STRATEGY_MAP = toMap(STRATEGY_OPTIONS);
export const PERSONALITY_MAP = toMap(PERSONALITY_OPTIONS);
export const EMPHASIS_MAP = toMap(EMPHASIS_OPTIONS);
export const FORMAT_MAP = toMap(FORMAT_OPTIONS);

export const HOW_IT_WORKS_MIN_STEPS = 2;
export const HOW_IT_WORKS_MAX_STEPS = 8;

export type HowItWorksPlanStep = {
  title: string;
  description: string;
  proofPoint?: string;
  successSignal?: string;
};

export type HowItWorksPlan = {
  headline: string;
  intro: string;
  steps: HowItWorksPlanStep[];
  outro?: string;
  callToAction?: string;
  toneNotes?: string;
  formatNotes?: string;
};

export const HOW_IT_WORKS_PLAN_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string", minLength: 3 },
    intro: { type: "string", minLength: 3 },
    steps: {
      type: "array",
      minItems: HOW_IT_WORKS_MIN_STEPS,
      maxItems: HOW_IT_WORKS_MAX_STEPS,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description"],
        properties: {
          title: { type: "string", minLength: 3 },
          description: { type: "string", minLength: 3 },
          proofPoint: { type: "string" },
          successSignal: { type: "string" },
        },
      },
    },
    outro: { type: "string" },
    callToAction: { type: "string" },
    toneNotes: { type: "string" },
    formatNotes: { type: "string" },
  },
  required: ["headline", "intro", "steps"],
} as const;

export function sanitizePlan(raw: unknown): HowItWorksPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;

  const headline = typeof candidate.headline === "string" ? candidate.headline.trim() : "";
  const intro = typeof candidate.intro === "string" ? candidate.intro.trim() : "";
  const stepsRaw = Array.isArray(candidate.steps) ? candidate.steps : [];

  if (!headline || !intro || stepsRaw.length === 0) {
    return null;
  }

  const steps = stepsRaw.reduce<HowItWorksPlanStep[]>((acc, step) => {
    if (!step || typeof step !== "object") {
      return acc;
    }
    const record = step as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title.trim() : "";
    const description = typeof record.description === "string" ? record.description.trim() : "";
    const proofPoint =
      typeof record.proofPoint === "string" && record.proofPoint.trim() ? record.proofPoint.trim() : undefined;
    const successSignal =
      typeof record.successSignal === "string" && record.successSignal.trim() ? record.successSignal.trim() : undefined;

    if (!title || !description) {
      return acc;
    }

    acc.push({ title, description, proofPoint, successSignal });
    return acc;
  }, []);

  if (steps.length === 0) {
    return null;
  }

  const outro =
    typeof candidate.outro === "string" && candidate.outro.trim() ? candidate.outro.trim() : undefined;
  const callToAction =
    typeof candidate.callToAction === "string" && candidate.callToAction.trim()
      ? candidate.callToAction.trim()
      : undefined;
  const toneNotes =
    typeof candidate.toneNotes === "string" && candidate.toneNotes.trim()
      ? candidate.toneNotes.trim()
      : undefined;
  const formatNotes =
    typeof candidate.formatNotes === "string" && candidate.formatNotes.trim()
      ? candidate.formatNotes.trim()
      : undefined;

  return {
    headline,
    intro,
    steps,
    outro,
    callToAction,
    toneNotes,
    formatNotes,
  };
}

export type HowItWorksGeneratePayload = {
  productExplanation: string;
  steps: number;
  strategy: string;
  personality: string;
  emphasis: string;
  format: string;
  model?: string;
};



export const ONBOARDING_TASK_SEQUENCE = [
  "intake_form",
  "discovery_call",
  "kickoff_request",
  "agreement",
  "deposit",
  "kickoff_workshop",
] as const;

export type OnboardingTaskKey = typeof ONBOARDING_TASK_SEQUENCE[number];

export type OnboardingStatus =
  | "pending"
  | "in_progress"
  | "submitted"
  | "completed";

export const ONBOARDING_TASK_CONTENT: Record<
  OnboardingTaskKey,
  {
    title: string;
    description: string;
    optional?: boolean;
    helperText?: string;
  }
> = {
  intake_form: {
    title: "Complete Intake Form",
    description:
      "Tell us about your product, team, timelines, and goals so we can scope your Foundation Sprint.",
    helperText:
      "We automatically mark this complete as soon as you submit any intake form.",
  },
  discovery_call: {
    title: "Book Discovery Call",
    description:
      "Optional 30-minute call to align on goals and confirm the best path into your kickoff workshop.",
    optional: true,
  },
  kickoff_request: {
    title: "Request Sprint & Kickoff Date",
    description:
      "Pick a Monday that works for your schedule. We’ll confirm availability and lock in your Foundation Sprint slot.",
  },
  agreement: {
    title: "Sign Agreement",
    description:
      "Review and sign the MSA. We’ll wire up DocuSign later, but you can mark it complete once signed.",
  },
  deposit: {
    title: "Pay Deposit",
    description:
      "Reserve your sprint by submitting the 50% deposit. A Stripe link will live here once payments are wired up.",
  },
  kickoff_workshop: {
    title: "Attend Kickoff Workshop",
    description:
      "Once your workshop wraps, we’ll automatically complete this step. For now, mark it off manually after the session.",
  },
};

export const DISCOVERY_CALL_URL = "https://calendly.com/foundation-studio/discovery";
export const AGREEMENT_PLACEHOLDER_URL = "https://example.com/agreement";
export const DEPOSIT_PLACEHOLDER_URL = "https://example.com/deposit";



























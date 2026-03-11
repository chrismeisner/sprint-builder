/* ------------------------------------------------------------------ */
/*  Miles Agent — shared types                                         */
/*                                                                     */
/*  Single source of truth for card, context, and message shapes.      */
/*  Import from here in both data and UI layers.                       */
/* ------------------------------------------------------------------ */

export type StatusLevel = "good" | "warn" | "info";

export type ActionStyle = "primary" | "secondary" | "dismiss";

export type ActionIcon = "clock" | "calendar" | "check" | "none";

export interface CardRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface ActionOption {
  id: string;
  label: string;
  detail?: string;
  style: ActionStyle;
  icon?: ActionIcon;
  /**
   * text + subtext appear as an agent bubble.
   * card (if present) is appended as an interactive follow-up card.
   * followUpMessages (if present) are injected after followUpDelay ms — used for async events like trip completion.
   */
  response: {
    text: string;
    subtext?: string;
    card?: AgentCard;
    followUpMessages?: ChatMessage[];
    followUpDelay?: number;
  };
}

/**
 * Unified card type — every section is optional.
 *
 * - intro  → agent bubble shown above the card
 * - rows   → key/value data in the context block
 * - status → colored badge (top-right of card header)
 * - whyItMatters → expandable coaching section
 * - actions → action buttons with resolution flow
 *
 * An "info card" is just an AgentCard without actions.
 * An "action card" is an AgentCard with actions.
 */
/** Four-corner tire pressure snapshot. Values are in PSI. */
export interface TireMap {
  frontLeft: number;
  frontRight: number;
  rearLeft: number;
  rearRight: number;
  recommended: number;
}

export interface AgentCard {
  intro?: string;
  title: string;
  subtitle?: string;
  status?: { label: string; level: StatusLevel };
  /** Renders a faux GPS map above the data rows. "live" shows a pulsing current-position dot. */
  mapPreview?: "live" | "completed";
  /** Renders a four-corner tire pressure visualization instead of rows. */
  tireMap?: TireMap;
  /** Renders a prominent speed-vs-limit display instead of rows. */
  speedAlert?: { current: number; limit: number; timestamp?: string };
  rows?: CardRow[];
  whyItMatters?: string;
  actions?: ActionOption[];
}

export interface ContextConfig {
  greeting: string;
  badgeLabel?: string;
  card?: AgentCard;
  prompts: string[];
}

export interface PendingItem {
  id: string;
  card: AgentCard;
}

export type ChatMessage =
  | { role: "user"; text: string }
  | { role: "agent"; text: string; subtext?: string }
  | { role: "agent-card"; card: AgentCard };

export interface ResponseRule {
  match: (query: string, context: string) => boolean;
  messages: ChatMessage[];
}

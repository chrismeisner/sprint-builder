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
  response: { text: string; subtext?: string };
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
export interface AgentCard {
  intro?: string;
  title: string;
  subtitle?: string;
  status?: { label: string; level: StatusLevel };
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

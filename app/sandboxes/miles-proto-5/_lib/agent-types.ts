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
   * If set, navigates to this sandbox-relative route when the action is tapped
   * (in addition to posting the chat response).
   */
  href?: string;
  /**
   * text + subtext appear as an agent bubble.
   * card (if present) is appended as an interactive follow-up card.
   * followUpMessages (if present) are injected after followUpDelay ms — used for async events like trip completion.
   * awaitingFor (if present) puts the chat into "awaiting input" mode — the
   *   user's next free-text message is treated as the answer to whatever this
   *   action asked for. The chat surface uses this key to build a contextual
   *   confirmation (see MilesChat.buildAwaitingConfirmation).
   */
  response: {
    text: string;
    subtext?: string;
    card?: AgentCard;
    followUpMessages?: ChatMessage[];
    followUpDelay?: number;
    awaitingFor?: string;
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
  /** When set with mapPreview, use the shared MapView (Leaflet) instead of the static SVG. */
  mapRoute?: [number, number][];
  /** Markers for the map (e.g. vehicle position). Used when mapRoute is set. */
  mapMarkers?: { lat: number; lng: number; type?: "start" | "end" | "event" | "vehicle"; color?: string; label?: string }[];
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
  /**
   * Same semantics as ActionOption.response.awaitingFor — if set, after
   * these messages render the chat enters "awaiting input" mode so the
   * user's next free-text message is treated as the answer.
   */
  awaitingFor?: string;
  /**
   * If set, replaces the suggested-prompts chip set after these messages
   * render. Useful for narrowing the user's next steps once a flow has
   * begun (e.g. "Something else" while a chooser card is on screen).
   * Persists until the context changes or another rule sets new prompts.
   */
  nextPrompts?: string[];
}

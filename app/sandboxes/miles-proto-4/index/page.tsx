"use client";

import { useState, useMemo, useEffect } from "react";
import { BASE } from "@/app/sandboxes/miles-proto-4/_lib/nav";

type Priority = "p0" | "p1" | "p2" | "p3";
type SprintPriority = "p1" | "p2" | "p3";
type DesignStatus = "scoping" | "wireframe" | "design";
type DevStatus = "scoping" | "prototype" | "implementing";
type ScenarioMode = "agent" | "hybrid" | "screen";
type Surface = "push" | "ask-miles" | "tab" | "onboarding";
type Persona = "all" | "admin" | "driver" | "teen" | "solo";

interface PageEntry {
  href: string;
  label: string;
  note?: string;
  designStatus?: DesignStatus;
  devStatus?: DevStatus;
  priority?: Priority;
}

interface Section {
  title: string;
  pages: PageEntry[];
}

type Tab = "screens" | "scenarios" | "widgets" | "personas";

interface PersonaInfo {
  id: Exclude<Persona, "all">;
  name: string;
  description: string;
  scopeRules: string[];
  copyNotes: string;
}

type WidgetMode = "free-form" | "scope-routed" | "FSM" | "locally-injected" | "fallback";
type WidgetStatus = "shipped" | "partial" | "planned" | "future";

interface Widget {
  name: string;
  mode: WidgetMode;
  status: WidgetStatus;
  purpose: string;
}

interface Scenario {
  id: number;
  name: string;
  overview: string;
  mode: ScenarioMode;
  surfaces: Surface[];
  persona: Persona;
  components: string[];
  designStatus: DesignStatus;
  devStatus: DevStatus;
  priority: Priority;
  sprintPriority?: SprintPriority;
  constraint?: string;
  href?: string;
}

interface ScreenOverride { designStatus?: DesignStatus; devStatus?: DevStatus; priority?: Priority; }
interface ScenarioOverride {
  name?: string;
  overview?: string;
  href?: string;
  constraint?: string;
  mode?: ScenarioMode;
  surfaces?: Surface[];
  persona?: Persona;
  components?: string[];
  designStatus?: DesignStatus;
  devStatus?: DevStatus;
  sprintPriority?: SprintPriority;
}
interface WidgetOverride {
  mode?: WidgetMode;
  status?: WidgetStatus;
  purpose?: string;
}

const WIDGET_STORAGE_KEY = "miles-proto-4-widget-overrides";

const SCENARIO_STATE_API = "/api/sandboxes/miles-proto-4/scenario-state";

async function loadScenarioState(): Promise<{ scenarioOverrides: Record<string, ScenarioOverride>; scenarioOrder: number[]; screenOverrides: Record<string, ScreenOverride>; updatedAt: string | null }> {
  try {
    const res = await fetch(SCENARIO_STATE_API);
    if (res.ok) return res.json();
  } catch {}
  return { scenarioOverrides: {}, scenarioOrder: [], screenOverrides: {}, updatedAt: null };
}

async function saveScenarioState(
  scenarioOverrides: Record<string, ScenarioOverride>,
  scenarioOrder: number[],
  screenOverrides: Record<string, ScreenOverride>
): Promise<string | null> {
  try {
    const res = await fetch(SCENARIO_STATE_API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioOverrides, scenarioOrder, screenOverrides }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.updatedAt ?? null;
    }
  } catch {}
  return null;
}

// ── Attachments (server-backed via /api/sandboxes/miles-proto-4/widget-attachments) ──
const ATTACHMENTS_API = "/api/sandboxes/miles-proto-4/widget-attachments";

interface AttachmentRecord {
  id: string;
  widgetName: string;
  filename: string;
  mimetype: string | null;
  fileUrl: string;
  sizeBytes: number | null;
  createdAt: string;
}

async function listAllAttachments(): Promise<AttachmentRecord[]> {
  const res = await fetch(ATTACHMENTS_API);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.attachments ?? []) as AttachmentRecord[];
}

async function uploadAttachment(widgetName: string, file: File): Promise<AttachmentRecord> {
  const fd = new FormData();
  fd.append("widgetName", widgetName);
  fd.append("file", file);
  const res = await fetch(ATTACHMENTS_API, { method: "POST", body: fd });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Upload failed");
  }
  const data = await res.json();
  return data.attachment as AttachmentRecord;
}

async function deleteAttachment(id: string): Promise<void> {
  const res = await fetch(`${ATTACHMENTS_API}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Delete failed");
  }
}

const COMPONENT_SUGGESTIONS = [
  // Shipped (brief §7)
  "quick_reply_group", "insight_card", "fuel_alert",
  "confirm_action", "name_input", "profile_displayname_input",
  "role_pills", "sso_picker", "welcome_with_scan",
  "qr_scanner", "device_banner", "accept_invite",
  // Planned (brief §8)
  "vin_input", "vin_review", "vehicle_picker", "driver_picker",
  "email_invite_input", "document_upload", "place_naming",
  "alert_prefs_builder", "tier_picker", "score_certificate_request",
  "incident_status", "roadside_request", "maintenance_todo",
  "mechanic_explainer", "geofence_radius",
  // Proposed (sprint additions)
  "trip_status", "coaching_alert", "vehicle_health_alert",
  "maintenance_history_builder", "trip_summary", "trip_event_markers",
  "reminder_card", "service_briefing", "nav_card",
] as const;

const scenarios: Scenario[] = [
  { id: 1,  name: "Kid Starts Driving / Trip in Progress",    overview: "Prove that both parents receive, view, and trust a live trip as it happens and after it ends.",                                                                                                                                           designStatus: "design", devStatus: "scoping",     priority: "p1", mode: "hybrid", surfaces: ["push"], persona: "all", href: "/notification?context=kid-trip", components: ["trip_status", "quick_reply_group", "driver_picker"] },
  { id: 2,  name: "Kid Speeding",                             overview: "Show the agent interrupting an active trip thread with a driving behavior alert and parent response options.",                                                                                                                         designStatus: "design", devStatus: "scoping",     priority: "p1", mode: "hybrid", surfaces: ["push"], persona: "all", href: "/notification?context=kid-speeding", components: ["coaching_alert", "quick_reply_group", "trip_status"] },
  { id: 3,  name: "Hard Braking (Real-Time Alert)",           overview: "Same as speeding but for a deceleration event, proving the mid-trip alert pattern repeats cleanly.",                                                                                                                                 designStatus: "design", devStatus: "scoping",     priority: "p2", mode: "hybrid", surfaces: ["push"], persona: "all", href: "/notification?context=coaching-braking", components: ["coaching_alert", "quick_reply_group"] },
  { id: 4,  name: "Fuel Low After a Trip",                    overview: "Establish the baseline reminder pattern: agent surfaces a low-stakes issue, user picks how to handle it, done.",                                                                                                                     designStatus: "design", devStatus: "scoping", priority: "p2", mode: "hybrid", surfaces: ["push"], persona: "all", href: "/notification?context=fuel", components: ["fuel_alert", "quick_reply_group"] },
  { id: 5,  name: "Low Tire Pressure",                        overview: "Prove the full card anatomy works end-to-end: data visualization, coaching layer, action set, and resolution.",                                                                                                                     designStatus: "design", devStatus: "scoping",     priority: "p1", mode: "hybrid", surfaces: ["push"], persona: "all", href: "/notification?context=tire-pressure", components: ["vehicle_health_alert", "quick_reply_group", "maintenance_todo"] },
  { id: 6,  name: "Oil Change Due",                           overview: "Show the reminder pattern with more action variety (time-based, mileage-based, already done) and the \"don't badger\" behavior.",                                                                                                   designStatus: "design", devStatus: "scoping", priority: "p2", mode: "hybrid", surfaces: ["push"], persona: "all", href: "/notification?context=oil", components: ["maintenance_todo", "quick_reply_group"] },
  { id: 7,  name: "Severe Crash — Emergency",                 overview: "Define the boundary where the agent pattern stops and a full-screen, red-button emergency UI takes over. Send push alert to trusted contact with details of incident; tell primary driver we've dispatched first responder; monitoring center calls them.",                                                                                                                           designStatus: "scoping", devStatus: "scoping",     priority: "p0", mode: "screen", surfaces: ["push"], persona: "all", components: ["incident_status"] },
  { id: 8,  name: "Less Severe Crash / Vehicle Breakdown",    overview: "Show the second tier of crash response where the user is conscious and choosing between tow or ambulance. Push notification to trusted contact; ask primary user if they need help. Two buttons: roadside, emergency services.",                                                                                                                          designStatus: "scoping", devStatus: "scoping",     priority: "p0", mode: "screen", surfaces: ["push"], persona: "all", components: ["incident_status", "roadside_request"] },
  { id: 9,  name: "Maintenance Intake / Source of Truth Setup", overview: "Walk through the onboarding moment where the agent builds the vehicle's maintenance baseline item by item.",                                                                                                                      designStatus: "scoping", devStatus: "scoping",     priority: "p2", mode: "hybrid", surfaces: ["onboarding"], persona: "admin", components: ["maintenance_history_builder", "quick_reply_group", "document_upload"] },
  { id: 10, name: "Check Engine Light",                       overview: "Test the alert → chat flow with a higher-anxiety vehicle issue that needs calm explanation. Surface context on the issue, severity, and cost range. CTAs: get reminder in 2–3 days; send email/documentation to mechanic.",                                                                                                                                       designStatus: "design", devStatus: "scoping",     priority: "p1", mode: "hybrid", surfaces: ["push"], persona: "all", href: "/notification?context=check-engine", components: ["mechanic_explainer", "quick_reply_group"] },
  { id: 11, name: "Trip Summary — Contextual Q&A",            overview: "Prove the agent can be user-initiated from a screen, not just alert-driven, with suggested prompts scoped to a completed trip.",                                                                                                    designStatus: "design", devStatus: "scoping", priority: "p2", mode: "hybrid", surfaces: ["ask-miles"], persona: "all", href: "/miles?context=trip-detail", components: ["trip_summary", "insight_card", "quick_reply_group"] },
  { id: 12, name: "Hard Braking (Post-Trip Review)",          overview: "Show braking events as markers on a completed trip route inside the trip summary view.",                                                                                                                                            designStatus: "design", devStatus: "scoping",     priority: "p2", mode: "hybrid", surfaces: ["ask-miles"], persona: "all", href: "/miles?context=coaching-braking", components: ["trip_event_markers", "insight_card", "quick_reply_group"] },
  { id: 13, name: "Insurance Photo Intake",                   overview: "Demonstrate the agent asking the user to contribute a document and following up months later with insight from it. Future: share insights on their rates vs others or market trends; prompt to get a quote from our partner when rates look high or near renewal.",                                                                                                                 designStatus: "scoping", devStatus: "scoping",     priority: "p3", mode: "hybrid", surfaces: ["ask-miles"], persona: "all", components: ["document_upload", "quick_reply_group"] },
  { id: 14, name: "Registration Expiring",                    overview: "Show the passive badge entry point for a time-based reminder that's handled in seconds and backgrounded.",                                                                                                                          designStatus: "design", devStatus: "scoping",     priority: "p2", mode: "hybrid", surfaces: ["ask-miles"], persona: "all", href: "/notification?context=registration", components: ["reminder_card", "quick_reply_group", "document_upload"] },
  { id: 15, name: "Post-Incident Follow-Up",                  overview: "Prove the agent can re-open a closed loop days after an emergency with a human-touch check-in.",                                                                                                                                    designStatus: "scoping", devStatus: "scoping",     priority: "p3", mode: "hybrid", surfaces: ["push"], persona: "all", components: ["insight_card", "quick_reply_group"] },
  { id: 16, name: "Service Receipt Photo",                    overview: "Show the agent prompting for a photo after a maintenance item is marked done to keep the log accurate. Store image in \"digital glovebox\" for reference; parse info to show in records; set behind-the-scenes reminders for future service milestones. (Glovebox concept could extend to insurance, service records, todo list, etc.)",                                                                                                                            designStatus: "scoping", devStatus: "scoping",     priority: "p3", mode: "hybrid", surfaces: ["push"], persona: "all", components: ["document_upload", "maintenance_todo", "quick_reply_group"] },
  { id: 17, name: "Major Maintenance Early Warning",          overview: "Surface a future maintenance milestone from the vehicle's schedule before it becomes urgent. In future, we'll pull in info about the recommended service: anticipated cost range, how long service takes, etc. Also can ask to book an appointment.", designStatus: "scoping", devStatus: "scoping", priority: "p3", mode: "hybrid", surfaces: ["ask-miles"], persona: "all", components: ["maintenance_todo", "insight_card", "quick_reply_group"] },
  { id: 18, name: "Model-Specific Known Issue",               overview: "Proactively flag a common problem for this make/model/mileage that the user may not know about.",                                                                                                                                   designStatus: "scoping", devStatus: "scoping",     priority: "p3", mode: "hybrid", surfaces: ["ask-miles"], persona: "all", components: ["insight_card", "quick_reply_group"] },
  { id: 19, name: "Pre-Service Appointment Briefing",         overview: "Arm the user with what their car actually needs before they walk into the shop. Prepare people before they go in based on recommended services for their mileage, what's coming up in future, and cost ranges.",                                                                                  designStatus: "design", devStatus: "scoping", priority: "p2", mode: "hybrid", surfaces: ["ask-miles"], persona: "all", components: ["service_briefing", "maintenance_todo", "quick_reply_group"] },
  { id: 20, name: "Trip Detail — Save Destination",           overview: "Show the agent offering to name a location based on where the user is in the app, replacing a settings screen.",                                                                                                                    designStatus: "scoping", devStatus: "scoping",     priority: "p3", mode: "hybrid", surfaces: ["ask-miles"], persona: "all", components: ["place_naming", "quick_reply_group"] },
  { id: 21, name: "Inspection Due",                           overview: "Same pattern as registration expiring: passive badge for a time-based reminder (state/safety inspection due), handled in seconds and backgrounded.",                                                                                 designStatus: "scoping", devStatus: "scoping",     priority: "p3", mode: "hybrid", surfaces: ["ask-miles"], persona: "all", components: ["reminder_card", "quick_reply_group", "document_upload"] },
  { id: 22, name: "Navigation Concierge / 'Where do I…?'",    overview: "Agent answers wayfinding questions and routes the user to the correct screen — turns the chat into an in-app GPS for the product itself.",                                                                                              designStatus: "scoping", devStatus: "scoping",     priority: "p2", mode: "agent", surfaces: ["tab"], persona: "all",  components: ["nav_card", "quick_reply_group"] },
  { id: 23, name: "Add a Driver / Invite Family Member",      overview: "Guide an admin through inviting a driver, including the COPPA branch when the invitee is a minor. Email + role pick + optional consent capture.",                                                                                       designStatus: "scoping", devStatus: "scoping",     priority: "p1", mode: "hybrid", surfaces: ["tab"], persona: "admin", components: ["email_invite_input", "quick_reply_group", "role_pills"] },
  { id: 24, name: "Update Profile",                           overview: "Scope-routed agent flow for editing profile fields (display name, avatar, timezone, phone, email). Display name is shipped; the rest follow the same template.",                                                                       designStatus: "design", devStatus: "prototype",     priority: "p2", mode: "agent", surfaces: ["ask-miles"], persona: "all",  components: ["profile_displayname_input", "quick_reply_group"] },
  { id: 25, name: "First-Run Setup / Pair Your Miles Plug",   overview: "Full-screen onboarding FSM: welcome → scan QR → pair device → confirm. The agent's onboarding home; everything else hangs off this entry.",                                                                                              designStatus: "design",  devStatus: "implementing",         priority: "p1", mode: "hybrid", surfaces: ["onboarding"], persona: "admin", components: ["welcome_with_scan", "qr_scanner", "confirm_action", "accept_invite"] },
  { id: 26, name: "Add a Vehicle (VIN Scan → Confirm → Pair)", overview: "Multi-step FSM: VIN capture (scan or type) → server decode → review year/make/model → optional device pair. ~4–5 turns end to end.",                                                                                                    designStatus: "scoping", devStatus: "scoping",     priority: "p1", mode: "hybrid", surfaces: ["tab"], persona: "admin", components: ["vin_input", "vin_review", "qr_scanner", "confirm_action", "quick_reply_group"] },
  { id: 27, name: "Configure Alert Preferences",              overview: "Agent-driven builder for alert prefs per driver-per-watcher. Possibly recommended bundles up front, drill-down toggles for power users.",                                                                                                designStatus: "scoping", devStatus: "scoping",     priority: "p2", mode: "agent", surfaces: ["ask-miles"], persona: "admin",  components: ["alert_prefs_builder", "quick_reply_group"] },
  { id: 28, name: "'I Need Help Now' — Manual Incident Trigger", overview: "User-initiated emergency from the Help button. Same full-screen overlay as auto-detected crash — shares the incident_status surface, bypasses chat.",                                                                                designStatus: "scoping", devStatus: "scoping",     priority: "p0", mode: "screen", surfaces: [], persona: "all", components: ["incident_status"] },
];

const widgets: Widget[] = [
  // Free-form (LLM-emittable allowlist)
  { name: "quick_reply_group",          mode: "free-form",        status: "shipped", purpose: "1–4 tappable follow-ups. Labels in user's voice; values machine-readable. Also reused as scope-route chip set." },
  { name: "insight_card",               mode: "free-form",        status: "shipped", purpose: "Structured callout for driving insights, maintenance reminders, anomalies. Title + body + severity." },
  { name: "fuel_alert",                 mode: "free-form",        status: "shipped", purpose: "Fuel-level callout for a specific vehicle. Vehicle ID required from list_vehicles tool." },

  // FSM (command-bound)
  { name: "confirm_action",             mode: "FSM",              status: "shipped", purpose: "Two-button confirmation card. Used before any irreversible action (decommission, cancel, transfer)." },
  { name: "welcome_with_scan",          mode: "FSM",              status: "shipped", purpose: "First onboarding turn. Two actions: scan device or skip." },
  { name: "qr_scanner",                 mode: "FSM",              status: "shipped", purpose: "Scan a Miles Plug serial via device camera. Routes to multi-step pairing orchestrator." },
  { name: "accept_invite",              mode: "FSM",              status: "shipped", purpose: "Render org invitation with org name, inviter, persona. Two actions: accept or decline." },
  { name: "name_input",                 mode: "FSM",              status: "partial", purpose: "Inline name capture during onboarding via expanded composer. M08B mock today." },
  { name: "role_pills",                 mode: "FSM",              status: "partial", purpose: "2–4 mutually exclusive roles. Mock today; not wired into live FSM." },
  { name: "sso_picker",                 mode: "FSM",              status: "partial", purpose: "Apple / Google / email SSO selection. Mock-only — real auth happens at the marketing site." },

  // Scope-routed (Path C, command-bound)
  { name: "profile_displayname_input",  mode: "scope-routed",     status: "shipped", purpose: "Path C scope-write template. Tap AskMilesBadge → 'Update my name' emits this widget. Calls updateProfile command." },

  // Locally-injected (mobile-side)
  { name: "device_banner",              mode: "locally-injected", status: "shipped", purpose: "Status updates during multi-step pairing: looking up → BLE found → connecting → connected. No server round-trip per update." },

  // Fallback (system-level)
  { name: "UnknownWidgetFallback",      mode: "fallback",         status: "shipped", purpose: "Renders when server emits a widget type the mobile app doesn't know how to render. Version-skew safety net." },
  { name: "FallbackQuickReplies",       mode: "fallback",         status: "shipped", purpose: "Static three-option fallback row appended when an assistant turn ends with no widget at all. Keeps user from getting stuck." },

  // Planned (brief §8)
  { name: "vin_input",                  mode: "FSM",              status: "planned", purpose: "VIN capture (manual or photo-OCR). First step of Add Vehicle flow." },
  { name: "vin_review",                 mode: "FSM",              status: "planned", purpose: "Year/make/model review card with Confirm/Edit. Pairs with vin_input after server decode." },
  { name: "vehicle_picker",             mode: "FSM",              status: "planned", purpose: "List of user's vehicles with avatar + nickname + plate. Single or multi-select variants." },
  { name: "driver_picker",              mode: "FSM",              status: "planned", purpose: "Driver row with avatar, name, relationship chip, persona." },
  { name: "email_invite_input",         mode: "FSM",              status: "planned", purpose: "Email + role + optional COPPA consent. Used in Add Driver flow." },
  { name: "document_upload",            mode: "FSM",              status: "planned", purpose: "File picker / camera capture → preview → confirm. Used in Glovebox upload, maintenance record." },
  { name: "place_naming",               mode: "FSM",              status: "planned", purpose: "Map snapshot + name input + optional category. Triggered from trip detail or onboarding." },
  { name: "alert_prefs_builder",        mode: "FSM",              status: "planned", purpose: "Composite widget: list of event types with per-driver-per-watcher toggles. Multi-step." },
  { name: "tier_picker",                mode: "FSM",              status: "planned", purpose: "Insight vs Insight + Guard side-by-side. Tap → routes to mileslabs.com checkout (App Store policy)." },
  { name: "score_certificate_request",  mode: "scope-routed",     status: "planned", purpose: "Confirm 90-day window + driver + vehicle → generates signed PDF." },
  { name: "incident_status",            mode: "locally-injected", status: "planned", purpose: "Live status banner: notifying contacts → dispatched → monitoring engaged → cancelled. Tier-aware copy." },
  { name: "maintenance_todo",           mode: "free-form",        status: "planned", purpose: "Single-task card with due date + severity + Mark done / Schedule actions. Strong allowlist candidate." },
  { name: "mechanic_explainer",         mode: "free-form",        status: "planned", purpose: "DTC code + plain-English explanation + severity + shop-prep summary. Strong allowlist candidate." },
  { name: "roadside_request",           mode: "FSM",              status: "future",  purpose: "Service type picker → location confirm → live truck tracking. Multi-turn. Guard tier only." },
  { name: "geofence_radius",            mode: "FSM",              status: "future",  purpose: "Map widget with adjustable radius. Post-V1." },

  // Proposed (sprint additions, not yet in brief catalog)
  { name: "trip_status",                mode: "free-form",        status: "future",  purpose: "Live trip card: route polyline + ETA + driver + vehicle. Streams via push notification entry." },
  { name: "coaching_alert",             mode: "free-form",        status: "future",  purpose: "Real-time driving behavior alert (speeding, hard brake) interrupting trip thread. Severity-tiered." },
  { name: "vehicle_health_alert",       mode: "free-form",        status: "future",  purpose: "Vehicle health callout (tire pressure, fuel) with data viz. Variant of insight_card with vehicle anatomy." },
  { name: "maintenance_history_builder", mode: "FSM",             status: "future",  purpose: "Multi-step onboarding to build the vehicle's baseline maintenance log item by item." },
  { name: "trip_summary",               mode: "free-form",        status: "future",  purpose: "Post-trip recap card with route, events, score impact, suggested next actions." },
  { name: "trip_event_markers",         mode: "free-form",        status: "future",  purpose: "Map view annotated with hard-brake / speeding markers from a completed trip." },
  { name: "reminder_card",              mode: "free-form",        status: "future",  purpose: "Time-based reminder (registration, inspection) with deadline + dismiss / handle actions." },
  { name: "service_briefing",           mode: "free-form",        status: "future",  purpose: "Pre-shop briefing: recommended services + cost ranges + future milestones." },
  { name: "nav_card",                   mode: "free-form",        status: "future",  purpose: "Wayfinding answer with a screen-route handoff button. Used in Navigation Concierge." },
];

const personaInfos: PersonaInfo[] = [
  {
    id: "admin",
    name: "Family admin",
    description: "Primary household account holder. Owns the subscription, devices, and family roster.",
    scopeRules: [
      "Full agency: transfer device, invite/remove members, change billing, request certificates for any driver",
      "Sees aggregate fleet view across all vehicles and drivers",
      "Receives all coaching alerts for family members the household is watching",
      "Can configure alert preferences per-driver-per-watcher",
    ],
    copyNotes: "Plural family framing: \"your family\", \"everyone driving\". Admin scopes are visible by default.",
  },
  {
    id: "driver",
    name: "Family driver",
    description: "Non-admin parent or adult member of the household.",
    scopeRules: [
      "Owns their own data: profile, trips, score certificate",
      "Can request own certificate; admin write scopes are hidden",
      "Receives alerts only for the drivers they're configured to watch",
      "Cannot transfer devices, invite/remove members, or change billing",
    ],
    copyNotes: "Standard plural framing. Admin scopes return Miles-anchored alternatives (\"ask the admin to…\").",
  },
  {
    id: "teen",
    name: "Teen driver",
    description: "Minor driver added via COPPA consent flow.",
    scopeRules: [
      "Locked to self only: own profile, own trips, own score",
      "Cannot transfer devices, invite members, change billing, request certificates",
      "Coaching alerts target the watching admin, not the teen — teen sees self-coaching framing",
      "Agent declines admin scopes and escalates to the household admin contact",
    ],
    copyNotes: "Conversational + coaching tone. No mention of admin powers. Decline copy is supportive, not corrective.",
  },
  {
    id: "solo",
    name: "Solo household",
    description: "Single user, single vehicle, no family roster.",
    scopeRules: [
      "Effectively admin agency over self — no one to invite, transfer to, or coach",
      "Full feature parity with admin minus family-roster operations",
      "Some flows simplify (e.g., alert prefs are self-only, not per-driver-per-watcher)",
    ],
    copyNotes: "Singular framing throughout — \"your car\" not \"your cars\", \"you\" not \"your family\". Hide family-only UI.",
  },
];

const sections: Section[] = [
  /* ── Design system ── */
  {
    title: "Design system",
    pages: [
      { href: "/hub", label: "Design system hub", note: "tokens, typography, component inventory" },
    ],
  },
  /* ── Faux Home Screen ── */
  {
    title: "Home Screen & Notifications",
    pages: [
      { href: "/home-screen", label: "Lock screen", note: "all notifications" },
    ],
  },
  {
    title: "Notification Entry Points",
    pages: [
      { href: "/notification?context=kid-speeding", label: "Speed Alert — Jack", note: "notification → agent", designStatus: "design", devStatus: "scoping" },
      { href: "/notification?context=tire-pressure", label: "Low Tire Pressure", note: "notification → agent", designStatus: "design", devStatus: "scoping" },
      { href: "/notification?context=kid-trip", label: "Kid Started a Trip", note: "notification → agent", designStatus: "design", devStatus: "scoping" },
      { href: "/notification?context=coaching-braking", label: "Hard Braking Detected", note: "notification → agent", designStatus: "design", devStatus: "scoping" },
      { href: "/notification?context=fuel", label: "Fuel Getting Low", note: "notification → agent", designStatus: "design", devStatus: "scoping" },
      { href: "/notification?context=check-engine", label: "Check Engine Light", note: "notification → agent", designStatus: "design", devStatus: "scoping" },
      { href: "/notification?context=oil", label: "Maintenance Reminder", note: "notification → agent", designStatus: "scoping", devStatus: "scoping" },
      { href: "/notification?context=registration", label: "Registration Expiring", note: "notification → agent", designStatus: "design", devStatus: "scoping" },
      { href: "/notification?context=trip-detail", label: "Trip Complete", note: "notification → agent", designStatus: "scoping", devStatus: "scoping" },
    ],
  },
  {
    title: "Notification Scenarios",
    pages: [
      { href: "/dashboard?mode=complete", label: "Trip Complete", note: "Emma finished a trip" },
      { href: "/miles?context=coaching-braking", label: "Hard Braking Detected", note: "alert → agent" },
      { href: "/miles?context=fuel", label: "Fuel Getting Low", note: "reminder flow" },
      { href: "/miles?context=check-engine", label: "Check Engine Light", note: "OBD alert → agent" },
      { href: "/driver-score", label: "Score Updated", note: "+3 from last week" },
      { href: "/miles?context=oil", label: "Maintenance Reminder", note: "oil change · mileage options" },
      { href: "/miles?context=registration", label: "Registration Expiring", note: "Apr 15 deadline" },
      { href: "/weekly-recap", label: "Weekly Recap Ready", note: "7 trips · 38.6 mi" },
      { href: "/device-health", label: "Device Disconnected", note: "RAV4 IO6 offline" },
      { href: "/miles", label: "Miles Has a Suggestion", note: "cold start · badge tap" },
    ],
  },

  /* ── Onboarding ── */
  {
    title: "Auth & Onboarding",
    pages: [
      { href: "/", label: "Welcome", note: "landing / sign-up" },
      { href: "/signup", label: "Sign up" },
      { href: "/signup-name", label: "Sign up — name" },
    ],
  },
  {
    title: "Setup & Installation",
    pages: [
      { href: "/install?state=empty", label: "Install checklist", note: "empty" },
      { href: "/install?state=partial", label: "Install checklist", note: "partial" },
      { href: "/install?state=filled", label: "Install checklist", note: "filled" },
      { href: "/scan-device", label: "Scan device" },
      { href: "/billing", label: "Billing / start trial" },
      { href: "/permissions", label: "Permissions" },
      { href: "/find-port", label: "Find OBD-II port" },
      { href: "/help-port", label: "Help — find port" },
      { href: "/help-port/vin", label: "Help — enter VIN" },
      { href: "/help-port/vin/result", label: "Help — VIN result" },
      { href: "/help-port/vehicle", label: "Help — select vehicle" },
      { href: "/help-port/vehicle/result", label: "Help — vehicle result" },
      { href: "/plug-in-device", label: "Plug in device" },
      { href: "/pair-device", label: "Pair device" },
      { href: "/linking-device", label: "Linking device" },
      { href: "/getting-online", label: "Getting online" },
      { href: "/device-detected", label: "Device detected" },
      { href: "/whos-driving", label: "Who's driving" },
      { href: "/setup-progress", label: "Setup progress" },
    ],
  },

  /* ── Tab 1: Dashboard ── */
  {
    title: "Tab 1 — Dashboard",
    pages: [
      { href: "/dashboard", label: "Dashboard", note: "Civic · parked" },
      { href: "/dashboard?vehicle=rav4", label: "Dashboard", note: "RAV4 · parked" },
      { href: "/dashboard?vehicle=fleet", label: "Dashboard", note: "Fleet View" },
      { href: "/dashboard?mode=trip", label: "Dashboard", note: "trip in progress" },
      { href: "/dashboard?mode=complete", label: "Dashboard", note: "trip complete" },
      { href: "/ready-to-drive", label: "Ready to drive" },
    ],
  },

  /* ── Tab 2: Trips ── */
  {
    title: "Tab 2 — Trips",
    pages: [
      { href: "/trips", label: "Trips list", note: "driver filter" },
      { href: "/trip-receipt", label: "Trip receipt" },
      { href: "/trip-detail", label: "Trip detail", note: "from proto-1" },
      { href: "/trip-complete", label: "Trip complete", note: "from proto-1" },
      { href: "/trip-indicator", label: "Trip indicator", note: "from proto-1" },
      { href: "/trip-finalizing", label: "Trip finalizing", note: "from proto-1" },
      { href: "/first-trip-ready", label: "First trip — ready", note: "from proto-1" },
      { href: "/first-trip-summary", label: "First trip — summary", note: "from proto-1" },
      { href: "/post-drive-prompts", label: "Post-drive prompts", note: "from proto-1" },
      { href: "/live-trip", label: "Live trip", note: "standalone · from proto-1" },
      { href: "/live-trip-event", label: "Live trip — event", note: "from proto-1" },
      { href: "/live-trip-degraded", label: "Live trip — degraded", note: "from proto-1" },
    ],
  },

  /* ── Tab 3: Miles Agent ── */
  {
    title: "Tab 3 — Miles Agent",
    pages: [
      { href: "/miles", label: "Miles agent", note: "cold start · reminders" },
      { href: "/miles?context=fuel", label: "Miles agent", note: "fuel alert context" },
      { href: "/miles?context=oil", label: "Miles agent", note: "oil change context" },
      { href: "/miles?context=registration", label: "Miles agent", note: "registration renewal" },
      { href: "/miles?context=trip-detail", label: "Miles agent", note: "from trip detail" },
      { href: "/miles?context=kid-speeding", label: "Miles agent", note: "kid speeding — speed alert" },
      { href: "/miles?context=tire-pressure", label: "Miles agent", note: "tire pressure — 4-corner viz" },
      { href: "/miles?context=kid-trip", label: "Miles agent", note: "kid trip — live + completion" },
      { href: "/miles?context=vehicle-health", label: "Miles agent", note: "from vehicle health" },
      { href: "/miles?context=driver-score", label: "Miles agent", note: "from driver score" },
      { href: "/miles?context=check-engine", label: "Miles agent", note: "check engine alert" },
      { href: "/miles?context=coaching-braking", label: "Miles agent", note: "hard braking event" },
    ],
  },

  /* ── Tab 4: Account ── */
  {
    title: "Tab 4 — Account",
    pages: [
      { href: "/account", label: "Account hub" },
      { href: "/profile", label: "Profile" },
      { href: "/household", label: "Household members" },
      { href: "/add-drivers", label: "Add drivers" },
      { href: "/notifications", label: "Notification preferences" },
      { href: "/privacy", label: "Privacy & controls" },
      { href: "/settings", label: "Settings", note: "from proto-1" },
    ],
  },

  /* ── Detail Screens ── */
  {
    title: "Detail Screens",
    pages: [
      { href: "/driver-score", label: "Miles Score", note: "trend · categories · comparison" },
      { href: "/todos", label: "To-Do List", note: "full list · completable" },
      { href: "/device-health", label: "Device Health" },
      { href: "/insights", label: "Insights", note: "from proto-1" },
      { href: "/weekly-recap", label: "Weekly recap", note: "from proto-1" },
      { href: "/next-trip-headsup", label: "Next trip heads-up", note: "from proto-1" },
      { href: "/locations", label: "Locations & Geofences" },
    ],
  },

  /* ── Drivers (legacy / from proto-1) ── */
  {
    title: "Drivers (from proto-1)",
    pages: [
      { href: "/primary-driver", label: "Primary driver" },
      { href: "/secondary-drivers", label: "Secondary drivers" },
      { href: "/driver-reassignment", label: "Driver reassignment" },
      { href: "/teen-independence", label: "Teen independence" },
      { href: "/confirm-address", label: "Confirm address" },
    ],
  },
];

const totalPages = sections.reduce((sum, s) => sum + s.pages.length, 0);

function CopyIcon() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

function designStatusBadgeClass(status: DesignStatus) {
  const map: Record<DesignStatus, string> = {
    scoping:   "bg-stone-100 text-stone-700 border-stone-200",
    wireframe: "bg-blue-50 text-blue-700 border-blue-200",
    design:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return map[status];
}

function devStatusBadgeClass(status: DevStatus) {
  const map: Record<DevStatus, string> = {
    scoping:      "bg-stone-100 text-stone-700 border-stone-200",
    prototype:    "bg-blue-50 text-blue-700 border-blue-200",
    implementing: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return map[status];
}

function modeBadgeClass(mode: ScenarioMode) {
  const map: Record<ScenarioMode, string> = {
    agent: "bg-blue-50 text-blue-700 border-blue-200",
    hybrid: "bg-violet-50 text-violet-700 border-violet-200",
    screen: "bg-stone-100 text-stone-700 border-stone-200",
  };
  return map[mode];
}

function personaBadgeClass(p: Persona) {
  const map: Record<Persona, string> = {
    all:    "bg-neutral-100 text-neutral-600 border-neutral-200",
    admin:  "bg-blue-50 text-blue-700 border-blue-200",
    driver: "bg-emerald-50 text-emerald-700 border-emerald-200",
    teen:   "bg-amber-50 text-amber-700 border-amber-200",
    solo:   "bg-violet-50 text-violet-700 border-violet-200",
  };
  return map[p];
}

function surfaceBadgeClass(s: Surface) {
  const map: Record<Surface, string> = {
    push:        "bg-rose-50 text-rose-700 border-rose-200",
    "ask-miles": "bg-indigo-50 text-indigo-700 border-indigo-200",
    tab:         "bg-emerald-50 text-emerald-700 border-emerald-200",
    onboarding:  "bg-teal-50 text-teal-700 border-teal-200",
  };
  return map[s];
}

function widgetModeBadgeClass(mode: WidgetMode) {
  const map: Record<WidgetMode, string> = {
    "free-form":         "bg-emerald-50 text-emerald-700 border-emerald-200",
    "scope-routed":      "bg-blue-50 text-blue-700 border-blue-200",
    "FSM":               "bg-violet-50 text-violet-700 border-violet-200",
    "locally-injected":  "bg-amber-50 text-amber-700 border-amber-200",
    "fallback":          "bg-stone-100 text-stone-700 border-stone-200",
  };
  return map[mode];
}

function widgetStatusBadgeClass(status: WidgetStatus) {
  const map: Record<WidgetStatus, string> = {
    shipped: "bg-emerald-50 text-emerald-700 border-emerald-200",
    partial: "bg-amber-50 text-amber-700 border-amber-200",
    planned: "bg-blue-50 text-blue-700 border-blue-200",
    future:  "bg-stone-100 text-stone-600 border-stone-200",
  };
  return map[status];
}

const ALL_WIDGET_MODES: WidgetMode[] = ["free-form", "scope-routed", "FSM", "locally-injected", "fallback"];
const ALL_WIDGET_STATUSES: WidgetStatus[] = ["shipped", "partial", "planned", "future"];

function sprintBadgeClass(p: SprintPriority | undefined) {
  if (p === "p1") return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (p === "p2") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-neutral-100 text-neutral-400 border-neutral-200";
}

function SurfaceMultiSelect({
  value,
  onChange,
}: {
  value: Surface[];
  onChange: (next: Surface[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {SURFACE_OPTIONS.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() =>
              onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])
            }
            className={`rounded border px-1.5 py-0.5 text-xs font-medium leading-none transition-opacity hover:opacity-80 ${
              on ? surfaceBadgeClass(o.value) : "border-neutral-200 bg-white text-neutral-300"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function InlineSelect<T extends string>({
  value,
  options,
  onChange,
  badgeClass,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  badgeClass: string;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`cursor-pointer appearance-none rounded border py-0.5 pl-1.5 pr-5 text-xs font-medium leading-none transition-opacity hover:opacity-80 ${badgeClass}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-1 size-2.5 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}

const DESIGN_STATUS_OPTIONS: { value: DesignStatus; label: string }[] = [
  { value: "scoping", label: "scoping" },
  { value: "wireframe", label: "wireframe" },
  { value: "design", label: "design" },
];

const MODE_OPTIONS: { value: ScenarioMode; label: string }[] = [
  { value: "agent", label: "Agent only" },
  { value: "hybrid", label: "Hybrid" },
  { value: "screen", label: "Screen only" },
];

const PERSONA_OPTIONS: { value: Persona; label: string }[] = [
  { value: "all", label: "All" },
  { value: "admin", label: "Family admin" },
  { value: "driver", label: "Family driver" },
  { value: "teen", label: "Teen driver" },
  { value: "solo", label: "Solo household" },
];

const SURFACE_OPTIONS: { value: Surface; label: string }[] = [
  { value: "push", label: "Push" },
  { value: "ask-miles", label: "Ask Miles" },
  { value: "tab", label: "Miles tab" },
  { value: "onboarding", label: "Onboarding" },
];

const DEV_STATUS_OPTIONS: { value: DevStatus; label: string }[] = [
  { value: "scoping", label: "scoping" },
  { value: "prototype", label: "prototype" },
  { value: "implementing", label: "implementing" },
];


type SortKey = "id" | "name" | "mode" | "surface" | "persona" | "sprintPriority";

const SPRINT_PRIORITY_OPTIONS: { value: SprintPriority; label: string }[] = [
  { value: "p1", label: "P1 — this sprint" },
  { value: "p2", label: "P2 — next / soon" },
  { value: "p3", label: "P3 — later" },
];
type SortDir = "asc" | "desc";

function effectiveScenario(s: Scenario, override?: ScenarioOverride): Scenario {
  if (!override) return s;
  return { ...s, ...override };
}

function diffScenarioOverride(source: Scenario, draft: Scenario): ScenarioOverride {
  const patch: ScenarioOverride = {};
  if (draft.name !== source.name) patch.name = draft.name;
  if (draft.overview !== source.overview) patch.overview = draft.overview;
  if (draft.href !== source.href) patch.href = draft.href;
  if (draft.constraint !== source.constraint) patch.constraint = draft.constraint;
  if (draft.mode !== source.mode) patch.mode = draft.mode;
  if (draft.surfaces.join(" ") !== source.surfaces.join(" ")) patch.surfaces = draft.surfaces;
  if (draft.persona !== source.persona) patch.persona = draft.persona;
  if (draft.components.join(" ") !== source.components.join(" ")) patch.components = draft.components;
  if ((draft.sprintPriority ?? "p3") !== (source.sprintPriority ?? "p3")) patch.sprintPriority = draft.sprintPriority;
  if (draft.designStatus !== source.designStatus) patch.designStatus = draft.designStatus;
  if (draft.devStatus !== source.devStatus) patch.devStatus = draft.devStatus;
  return patch;
}

function effectiveWidget(w: Widget, override?: WidgetOverride): Widget {
  if (!override) return w;
  return { ...w, ...override };
}

function diffWidgetOverride(source: Widget, draft: Widget): WidgetOverride {
  const patch: WidgetOverride = {};
  if (draft.mode !== source.mode) patch.mode = draft.mode;
  if (draft.status !== source.status) patch.status = draft.status;
  if (draft.purpose !== source.purpose) patch.purpose = draft.purpose;
  return patch;
}

function ComponentTagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  const suggestions = trimmed
    ? COMPONENT_SUGGESTIONS.filter(
        (s) => s.toLowerCase().includes(lower) && !value.includes(s)
      ).slice(0, 6)
    : [];

  function add(name: string) {
    const v = name.trim();
    if (!v || value.includes(v)) {
      setInput("");
      return;
    }
    onChange([...value, v]);
    setInput("");
  }

  function remove(name: string) {
    onChange(value.filter((c) => c !== name));
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-neutral-200 bg-white p-1.5 focus-within:border-neutral-300 focus-within:ring-2 focus-within:ring-blue-500/20">
        {value.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-xs text-emerald-700"
          >
            {c}
            <button
              type="button"
              onClick={() => remove(c)}
              title="Remove"
              className="text-emerald-500 transition-colors hover:text-emerald-900"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (suggestions.length > 0) add(suggestions[0]);
              else if (trimmed) add(trimmed);
            } else if (e.key === "Backspace" && input === "" && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={value.length === 0 ? "e.g. quick_reply_group" : ""}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 font-mono text-xs text-neutral-900 placeholder-neutral-400 outline-none"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-xs text-neutral-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditWidgetModal({
  widget,
  hasOverride,
  onSave,
  onReset,
  onClose,
  onAttachmentsChanged,
}: {
  widget: Widget;
  hasOverride: boolean;
  onSave: (draft: Widget) => void;
  onReset: () => void;
  onClose: () => void;
  onAttachmentsChanged: () => void;
}) {
  const [draft, setDraft] = useState<Widget>(widget);
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSave(draft);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, onClose, onSave]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await listAllAttachments();
        if (cancelled) return;
        setAttachments(all.filter((a) => a.widgetName === widget.name));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [widget.name]);

  async function reloadAttachments() {
    const all = await listAllAttachments();
    setAttachments(all.filter((a) => a.widgetName === widget.name));
    onAttachmentsChanged();
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        await uploadAttachment(widget.name, file);
      }
      await reloadAttachments();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAttachment(id);
      await reloadAttachments();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function patch<K extends keyof Widget>(key: K, value: Widget[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  const inputCls =
    "w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-shadow focus:border-neutral-300 focus:ring-2 focus:ring-blue-500/20";
  const labelCls = "text-xs font-medium uppercase tracking-wider text-neutral-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-900/40 p-6 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="my-8 w-full max-w-xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900">Edit widget</h2>
            <span className="font-mono text-xs text-neutral-400">{widget.name}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="flex size-7 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="block space-y-1">
            <span className={labelCls}>Name</span>
            <div className={`${inputCls} cursor-not-allowed bg-neutral-50 font-mono text-neutral-600`}>{widget.name}</div>
            <span className="text-xs text-neutral-400">Read-only — name is the cross-reference key used by Scenarios.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className={labelCls}>Mode</span>
              <select value={draft.mode} onChange={(e) => patch("mode", e.target.value as WidgetMode)} className={inputCls}>
                {ALL_WIDGET_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className={labelCls}>Status</span>
              <select value={draft.status} onChange={(e) => patch("status", e.target.value as WidgetStatus)} className={inputCls}>
                {ALL_WIDGET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className={labelCls}>Purpose</span>
            <textarea
              value={draft.purpose}
              onChange={(e) => patch("purpose", e.target.value)}
              rows={4}
              className={`${inputCls} resize-y leading-snug`}
            />
          </label>

          <div className="block space-y-2">
            <div className="flex items-center justify-between">
              <span className={labelCls}>Attachments</span>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {uploading ? "Uploading…" : "Add image"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
                />
              </label>
            </div>

            {uploadError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {uploadError}
              </div>
            )}

            {attachments.length === 0 ? (
              <div className="rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-xs text-neutral-400">
                No screenshots yet. Add images for visual reference.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {attachments.map((a) => {
                  return (
                    <div key={a.id} className="group relative overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={a.fileUrl} alt={a.filename} className="h-24 w-full object-cover" />
                      </a>
                      <div className="flex items-center justify-between gap-1 px-1.5 py-1">
                        <span className="truncate text-[11px] text-neutral-500" title={a.filename}>{a.filename}</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(a.id)}
                          title="Delete attachment"
                          className="flex size-5 shrink-0 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-5 py-3">
          <div>
            {hasOverride && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-800"
              >
                Reset to source
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditScenarioModal({
  scenario,
  hasOverride,
  onSave,
  onReset,
  onClose,
}: {
  scenario: Scenario;
  hasOverride: boolean;
  onSave: (draft: Scenario) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Scenario>(scenario);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSave(draft);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, onClose, onSave]);

  function patch<K extends keyof Scenario>(key: K, value: Scenario[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  const inputCls =
    "w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-shadow focus:border-neutral-300 focus:ring-2 focus:ring-blue-500/20";
  const labelCls = "text-xs font-medium uppercase tracking-wider text-neutral-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-900/40 p-6 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="my-8 w-full max-w-xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900">Edit scenario</h2>
            <span className="text-xs text-neutral-400">#{scenario.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="flex size-7 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <label className="block space-y-1">
            <span className={labelCls}>Name</span>
            <input type="text" value={draft.name} onChange={(e) => patch("name", e.target.value)} className={inputCls} />
          </label>

          <label className="block space-y-1">
            <span className={labelCls}>Overview</span>
            <textarea
              value={draft.overview}
              onChange={(e) => patch("overview", e.target.value)}
              rows={4}
              className={`${inputCls} resize-y leading-snug`}
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <div className="block space-y-1">
              <span className={labelCls}>Priority</span>
              <div className="flex gap-2 pt-0.5">
                {SPRINT_PRIORITY_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => patch("sprintPriority", o.value)}
                    className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                      (draft.sprintPriority ?? "p3") === o.value
                        ? sprintBadgeClass(o.value)
                        : "border-neutral-200 bg-white text-neutral-400"
                    }`}
                  >
                    {o.value.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <label className="block space-y-1">
              <span className={labelCls}>Design status</span>
              <select value={draft.designStatus} onChange={(e) => patch("designStatus", e.target.value as DesignStatus)} className={inputCls}>
                {DESIGN_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className={labelCls}>Dev status</span>
              <select value={draft.devStatus} onChange={(e) => patch("devStatus", e.target.value as DevStatus)} className={inputCls}>
                {DEV_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className={labelCls}>Prototype path</span>
            <input
              type="text"
              value={draft.href ?? ""}
              onChange={(e) => patch("href", e.target.value || undefined)}
              placeholder="/notification?context=…"
              className={`${inputCls} font-mono`}
            />
            <span className="text-xs text-neutral-400">Sandbox-relative. Leave blank if not yet linked.</span>
          </label>

          <label className="block space-y-1">
            <span className={labelCls}>Constraint</span>
            <input
              type="text"
              value={draft.constraint ?? ""}
              onChange={(e) => patch("constraint", e.target.value || undefined)}
              placeholder="Optional note shown under the name in amber"
              className={inputCls}
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block space-y-1">
              <span className={labelCls}>UI split</span>
              <select value={draft.mode} onChange={(e) => patch("mode", e.target.value as ScenarioMode)} className={inputCls}>
                {MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <div className="block space-y-1">
              <span className={labelCls}>Entry Points</span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {SURFACE_OPTIONS.map((o) => {
                  const on = draft.surfaces.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => patch("surfaces", on ? draft.surfaces.filter((v) => v !== o.value) : [...draft.surfaces, o.value])}
                      className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors ${on ? surfaceBadgeClass(o.value) : "border-neutral-200 bg-white text-neutral-400"}`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="block space-y-1">
              <span className={labelCls}>Persona</span>
              <select value={draft.persona} onChange={(e) => patch("persona", e.target.value as Persona)} className={inputCls}>
                {PERSONA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>

          <div className="block space-y-1">
            <span className={labelCls}>Widgets</span>
            <ComponentTagInput
              value={draft.components}
              onChange={(next) => patch("components", next)}
            />
            <span className="text-xs text-neutral-400">Type to search the widget catalog. Enter to add, click ✕ to remove.</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-5 py-3">
          <div>
            {hasOverride && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-800"
              >
                Reset to source
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg className={`ml-0.5 inline size-3 ${active ? "text-neutral-700" : "text-neutral-300"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      {dir === "asc" || !active ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      )}
    </svg>
  );
}

export default function IndexPage() {
  const [query, setQuery] = useState("");
  const [copiedHref, setCopiedHref] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("scenarios");

  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [scenarioOrder, setScenarioOrder] = useState<number[]>([]);

  const [widgetModeFilter, setWidgetModeFilter] = useState<Set<WidgetMode>>(new Set());
  const [showModeSummaries, setShowModeSummaries] = useState(false);
  const [widgetStatusFilter, setWidgetStatusFilter] = useState<Set<WidgetStatus>>(new Set());
  const [widgetSortKey, setWidgetSortKey] = useState<"name" | "mode" | "status" | "usedIn">("status");
  const [widgetSortDir, setWidgetSortDir] = useState<SortDir>("asc");

  const [screenOverrides, setScreenOverrides] = useState<Record<string, ScreenOverride>>({});
  const [scenarioOverrides, setScenarioOverrides] = useState<Record<string, ScenarioOverride>>({});
  const [editingScenarioId, setEditingScenarioId] = useState<number | null>(null);
  const [widgetOverrides, setWidgetOverrides] = useState<Record<string, WidgetOverride>>({});
  const [editingWidgetName, setEditingWidgetName] = useState<string | null>(null);
  const [attachmentCounts, setAttachmentCounts] = useState<Map<string, number>>(new Map());
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const refreshAttachmentCounts = async () => {
    try {
      const list = await listAllAttachments();
      const map = new Map<string, number>();
      for (const a of list) map.set(a.widgetName, (map.get(a.widgetName) ?? 0) + 1);
      setAttachmentCounts(map);
    } catch {}
  };

  useEffect(() => {
    loadScenarioState().then(({ scenarioOverrides, scenarioOrder, screenOverrides, updatedAt }) => {
      if (Object.keys(scenarioOverrides).length > 0) setScenarioOverrides(scenarioOverrides);
      if (scenarioOrder.length > 0) setScenarioOrder(scenarioOrder);
      if (Object.keys(screenOverrides).length > 0) setScreenOverrides(screenOverrides);
      if (updatedAt) setLastSavedAt(updatedAt);
    });
    try {
      const raw = localStorage.getItem(WIDGET_STORAGE_KEY);
      if (raw) setWidgetOverrides(JSON.parse(raw));
    } catch {}
    refreshAttachmentCounts();
  }, []);

  function saveWidgetFromModal(name: string, draft: Widget) {
    const source = widgets.find((w) => w.name === name);
    if (!source) return;
    const patch = diffWidgetOverride(source, draft);
    setWidgetOverrides((prev) => {
      const next = { ...prev };
      if (Object.keys(patch).length === 0) delete next[name];
      else next[name] = patch;
      try { localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function resetWidgetOverride(name: string) {
    setWidgetOverrides((prev) => {
      const next = { ...prev };
      delete next[name];
      try { localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function updateScreenOverride(href: string, patch: Partial<ScreenOverride>) {
    setScreenOverrides((prev) => ({ ...prev, [href]: { ...prev[href], ...patch } }));
    setIsDirty(true);
  }

  function saveScenarioFromModal(id: number, draft: Scenario) {
    const source = scenarios.find((s) => s.id === id);
    if (!source) return;
    const patch = diffScenarioOverride(source, draft);
    setScenarioOverrides((prev) => {
      const next = { ...prev };
      if (Object.keys(patch).length === 0) delete next[id];
      else next[id] = patch;
      return next;
    });
    setIsDirty(true);
  }

  function resetScenarioOverride(id: number) {
    setScenarioOverrides((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setIsDirty(true);
  }

  function updateScenarioOverride(id: number, patch: Partial<ScenarioOverride>) {
    setScenarioOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    setIsDirty(true);
  }

  function moveScenario(id: number, dir: -1 | 1) {
    const currentIds = filteredScenarios.map((s) => s.id);
    const from = currentIds.indexOf(id);
    const to = from + dir;
    if (to < 0 || to >= currentIds.length) return;
    const next = [...currentIds];
    next.splice(from, 1);
    next.splice(to, 0, id);
    setScenarioOrder(next);
    setIsDirty(true);
  }


  async function handleSave() {
    setIsSaving(true);
    const ts = await saveScenarioState(scenarioOverrides, scenarioOrder, screenOverrides);
    setLastSavedAt(ts ?? new Date().toISOString());
    setIsDirty(false);
    setIsSaving(false);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        pages: s.pages.filter(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            p.href.toLowerCase().includes(q) ||
            (p.note?.toLowerCase().includes(q) ?? false) ||
            s.title.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.pages.length > 0);
  }, [query]);

  const filteredScenarios = useMemo(() => {
    let result = scenarios;

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((s) => {
        const eff = effectiveScenario(s, scenarioOverrides[s.id]);
        return (
          eff.name.toLowerCase().includes(q) ||
          eff.overview.toLowerCase().includes(q) ||
          eff.components.some((c) => c.toLowerCase().includes(q))
        );
      });
    }

    const sorted = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "id": {
          if (scenarioOrder.length > 0) {
            const pos = (id: number) => { const i = scenarioOrder.indexOf(id); return i === -1 ? 9999 : i; };
            cmp = pos(a.id) - pos(b.id);
          } else {
            cmp = a.id - b.id;
          }
          break;
        }
        case "name": {
          const an = scenarioOverrides[a.id]?.name ?? a.name;
          const bn = scenarioOverrides[b.id]?.name ?? b.name;
          cmp = an.localeCompare(bn);
          break;
        }
        case "mode": {
          const order: Record<ScenarioMode, number> = { agent: 0, hybrid: 1, screen: 2 };
          const am = scenarioOverrides[a.id]?.mode ?? a.mode;
          const bm = scenarioOverrides[b.id]?.mode ?? b.mode;
          cmp = order[am] - order[bm];
          break;
        }
        case "surface": {
          const order: Record<Surface, number> = {
            push: 0, "ask-miles": 1, tab: 2, onboarding: 3,
          };
          const as_ = (scenarioOverrides[a.id]?.surfaces ?? a.surfaces)[0] ?? "push";
          const bs_ = (scenarioOverrides[b.id]?.surfaces ?? b.surfaces)[0] ?? "push";
          cmp = order[as_] - order[bs_];
          break;
        }
        case "persona": {
          const order: Record<Persona, number> = { all: 0, admin: 1, driver: 2, teen: 3, solo: 4 };
          const ap = scenarioOverrides[a.id]?.persona ?? a.persona;
          const bp = scenarioOverrides[b.id]?.persona ?? b.persona;
          cmp = order[ap] - order[bp];
          break;
        }
        case "sprintPriority": {
          const order: Record<SprintPriority, number> = { p1: 0, p2: 1, p3: 2 };
          const ap = scenarioOverrides[a.id]?.sprintPriority ?? a.sprintPriority ?? "p3";
          const bp = scenarioOverrides[b.id]?.sprintPriority ?? b.sprintPriority ?? "p3";
          cmp = order[ap] - order[bp];
          break;
        }
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return sorted;
  }, [query, sortKey, sortDir, scenarioOverrides, scenarioOrder]);

  const filteredTotal = filtered.reduce((sum, s) => sum + s.pages.length, 0);

  const widgetUsage = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const s of scenarios) {
      const eff = effectiveScenario(s, scenarioOverrides[s.id]);
      for (const c of eff.components) {
        const arr = map.get(c) ?? [];
        arr.push(s.id);
        map.set(c, arr);
      }
    }
    return map;
  }, [scenarioOverrides]);

  const filteredWidgets = useMemo(() => {
    let result = widgets;

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((w) => {
        const eff = effectiveWidget(w, widgetOverrides[w.name]);
        return eff.name.toLowerCase().includes(q) || eff.purpose.toLowerCase().includes(q);
      });
    }

    if (widgetModeFilter.size > 0) {
      result = result.filter((w) => {
        const eff = effectiveWidget(w, widgetOverrides[w.name]);
        return widgetModeFilter.has(eff.mode);
      });
    }
    if (widgetStatusFilter.size > 0) {
      result = result.filter((w) => {
        const eff = effectiveWidget(w, widgetOverrides[w.name]);
        return widgetStatusFilter.has(eff.status);
      });
    }

    const statusOrder: Record<WidgetStatus, number> = { shipped: 0, partial: 1, planned: 2, future: 3 };
    const modeOrder: Record<WidgetMode, number> = {
      "free-form": 0, "scope-routed": 1, FSM: 2, "locally-injected": 3, fallback: 4,
    };

    const sorted = [...result].sort((a, b) => {
      const ae = effectiveWidget(a, widgetOverrides[a.name]);
      const be = effectiveWidget(b, widgetOverrides[b.name]);
      let cmp = 0;
      switch (widgetSortKey) {
        case "name":   cmp = ae.name.localeCompare(be.name); break;
        case "mode":   cmp = modeOrder[ae.mode] - modeOrder[be.mode]; break;
        case "status": cmp = statusOrder[ae.status] - statusOrder[be.status]; break;
        case "usedIn": cmp = (widgetUsage.get(a.name)?.length ?? 0) - (widgetUsage.get(b.name)?.length ?? 0); break;
      }
      return widgetSortDir === "desc" ? -cmp : cmp;
    });

    return sorted;
  }, [query, widgetModeFilter, widgetStatusFilter, widgetSortKey, widgetSortDir, widgetUsage, widgetOverrides]);

  function handleWidgetSort(key: typeof widgetSortKey) {
    if (widgetSortKey === key) {
      setWidgetSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setWidgetSortKey(key);
      setWidgetSortDir("asc");
    }
  }

  function toggleWidgetMode(m: WidgetMode) {
    setWidgetModeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  }

  function toggleWidgetStatus(s: WidgetStatus) {
    setWidgetStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function copyLink(href: string) {
    const url = window.location.origin + BASE + href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedHref(href);
      setTimeout(() => setCopiedHref(null), 1500);
    });
  }

  let rowIndex = 0;

  return (
    <div className="min-h-dvh bg-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-none items-center gap-4 px-6 py-3">
          <a
            href="/dashboard/sandboxes"
            className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Sandboxes
          </a>

          <div className="h-4 w-px shrink-0 bg-neutral-200" />

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <h1 className="truncate text-sm font-semibold text-neutral-900">
                Miles Proto 4
              </h1>
              <span className="shrink-0 text-xs text-neutral-400">
                {tab === "screens"
                  ? query
                    ? `${filteredTotal} of ${totalPages} screens`
                    : `${totalPages} screens · ${sections.length} sections`
                  : tab === "widgets"
                    ? query || widgetModeFilter.size > 0 || widgetStatusFilter.size > 0
                      ? `${filteredWidgets.length} of ${widgets.length} widgets`
                      : `${widgets.length} widgets`
                    : tab === "personas"
                      ? `${personaInfos.length} personas`
                      : query
                        ? `${filteredScenarios.length} of ${scenarios.length} scenarios`
                        : `${scenarios.length} scenarios`}
              </span>
            </div>
          </div>

          <div className="relative w-56 shrink-0">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
              fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="search"
              placeholder={tab === "screens" ? "Filter screens…" : tab === "widgets" ? "Filter widgets…" : tab === "personas" ? "Filter personas…" : "Filter scenarios…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 w-full rounded-md border border-neutral-200 bg-neutral-50 pl-8 pr-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-shadow focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <a
            href={`${BASE}/hub`}
            className="shrink-0 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            Design hub
          </a>

          <div className="flex shrink-0 items-center gap-2">
            {lastSavedAt && !isDirty && (
              <span className="text-xs text-neutral-400">
                Saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>

          <a
            href={BASE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Open prototype
            <ExternalLinkIcon />
          </a>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-none px-6">
          <div className="flex gap-0">
            <button
              type="button"
              onClick={() => { setTab("scenarios"); setQuery(""); }}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                tab === "scenarios"
                  ? "text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              Scenarios
              <span className="ml-1.5 text-xs text-neutral-400">{scenarios.length}</span>
              {tab === "scenarios" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-neutral-900" />
              )}
            </button>
            <button
              type="button"
              onClick={() => { setTab("widgets"); setQuery(""); setSortKey("id"); setSortDir("asc"); }}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                tab === "widgets"
                  ? "text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              Widgets
              <span className="ml-1.5 text-xs text-neutral-400">{widgets.length}</span>
              {tab === "widgets" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-neutral-900" />
              )}
            </button>
            <button
              type="button"
              onClick={() => { setTab("personas"); setQuery(""); setSortKey("id"); setSortDir("asc"); }}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                tab === "personas"
                  ? "text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              Personas
              <span className="ml-1.5 text-xs text-neutral-400">{personaInfos.length}</span>
              {tab === "personas" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-neutral-900" />
              )}
            </button>
            <button
              type="button"
              onClick={() => { setTab("screens"); setQuery(""); setSortKey("id"); setSortDir("asc"); }}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                tab === "screens"
                  ? "text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              Screens
              <span className="ml-1.5 text-xs text-neutral-400">{totalPages}</span>
              {tab === "screens" && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-neutral-900" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-none px-6 py-6">
        {tab === "screens" ? (
          /* ── Screens table ── */
          filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <p className="text-sm font-medium text-neutral-500">No screens match &ldquo;{query}&rdquo;</p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="w-10 pb-2 pr-4 text-left text-xs font-medium text-neutral-400">#</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Screen</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Path</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">State</th>
                  <th className="w-28 pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Design status</th>
                  <th className="w-28 pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Dev status</th>
                  <th className="w-16 pb-2 text-right text-xs font-medium text-neutral-400">Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((section) => (
                  <>
                    <tr key={`section-${section.title}`} className="border-b border-neutral-100">
                      <td colSpan={7} className="bg-neutral-50 px-0 py-2 pt-5 first:pt-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                          {section.title}
                        </span>
                      </td>
                    </tr>

                    {section.pages.map((page) => {
                      rowIndex += 1;
                      const idx = rowIndex;
                      const fullUrl = BASE + page.href;
                      const isCopied = copiedHref === page.href;
                      const [pathPart, queryPart] = page.href.split("?");

                      return (
                        <tr
                          key={`${page.href}-${idx}`}
                          className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                        >
                          <td className="py-2.5 pr-4 text-right text-xs tabular-nums text-neutral-300 group-hover:text-neutral-400">
                            {idx}
                          </td>
                          <td className="py-2.5 pr-4">
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-neutral-800 transition-colors hover:text-blue-600"
                            >
                              {page.label}
                            </a>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-neutral-400">
                              {pathPart}
                              {queryPart && (
                                <span className="text-neutral-300">?{queryPart}</span>
                              )}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {page.note && (
                              <span className="inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium leading-none text-neutral-500">
                                {page.note}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4">
                            {(() => {
                              const st = screenOverrides[page.href]?.designStatus ?? page.designStatus ?? "scoping";
                              return (
                                <InlineSelect
                                  value={st}
                                  options={DESIGN_STATUS_OPTIONS}
                                  onChange={(v) => updateScreenOverride(page.href, { designStatus: v })}
                                  badgeClass={designStatusBadgeClass(st)}
                                />
                              );
                            })()}
                          </td>
                          <td className="py-2.5 pr-4">
                            {(() => {
                              const st = screenOverrides[page.href]?.devStatus ?? page.devStatus ?? "scoping";
                              return (
                                <InlineSelect
                                  value={st}
                                  options={DEV_STATUS_OPTIONS}
                                  onChange={(v) => updateScreenOverride(page.href, { devStatus: v })}
                                  badgeClass={devStatusBadgeClass(st)}
                                />
                              );
                            })()}
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => copyLink(page.href)}
                                title="Copy link"
                                className={`flex size-7 items-center justify-center rounded transition-colors ${
                                  isCopied
                                    ? "bg-green-50 text-green-600"
                                    : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                                }`}
                              >
                                {isCopied ? (
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                ) : (
                                  <CopyIcon />
                                )}
                              </button>
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open screen"
                                className="flex size-7 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                              >
                                <ExternalLinkIcon />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                ))}
              </tbody>
            </table>
          )
        ) : tab === "widgets" ? (
          /* ── Widgets table ── */
          <>
            {/* Filter bar */}
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Status</span>
                {ALL_WIDGET_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleWidgetStatus(s)}
                    className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
                      widgetStatusFilter.size === 0 || widgetStatusFilter.has(s)
                        ? widgetStatusBadgeClass(s)
                        : "border-neutral-200 bg-white text-neutral-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-neutral-200" />

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">Mode</span>
                {ALL_WIDGET_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleWidgetMode(m)}
                    className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
                      widgetModeFilter.size === 0 || widgetModeFilter.has(m)
                        ? widgetModeBadgeClass(m)
                        : "border-neutral-200 bg-white text-neutral-300"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {(widgetModeFilter.size > 0 || widgetStatusFilter.size > 0) && (
                <>
                  <div className="h-4 w-px bg-neutral-200" />
                  <button
                    type="button"
                    onClick={() => { setWidgetModeFilter(new Set()); setWidgetStatusFilter(new Set()); }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>

            {/* Mode key */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowModeSummaries((v) => !v)}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                {showModeSummaries ? "Hide mode summaries" : "Show mode summaries"}
              </button>
              {showModeSummaries && (
                <div className="mt-2 space-y-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
                  {([
                    { mode: "free-form"        as WidgetMode, desc: "The AI decides when to show it — can appear in any conversation where it fits." },
                    { mode: "scope-routed"     as WidgetMode, desc: "Triggered when the user asks to do something specific, like \"update my name.\"" },
                    { mode: "FSM"              as WidgetMode, desc: "A guided multi-step flow the app walks through one question at a time." },
                    { mode: "locally-injected" as WidgetMode, desc: "The mobile app adds it directly, no server round-trip needed." },
                    { mode: "fallback"         as WidgetMode, desc: "A safety net shown automatically when the app doesn't know what else to display." },
                  ] as { mode: WidgetMode; desc: string }[]).map(({ mode, desc }) => (
                    <div key={mode} className="flex items-baseline gap-2">
                      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium leading-none ${widgetModeBadgeClass(mode)}`}>{mode}</span>
                      <span className="text-xs text-neutral-500">{desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {filteredWidgets.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-20 text-center">
                <p className="text-sm font-medium text-neutral-500">No widgets match your filters</p>
                <button
                  type="button"
                  onClick={() => { setQuery(""); setWidgetModeFilter(new Set()); setWidgetStatusFilter(new Set()); }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="w-10 pb-2 pr-4 text-left text-xs font-medium text-neutral-400">#</th>
                    <th className="pb-2 pr-4 text-left">
                      <button type="button" onClick={() => handleWidgetSort("name")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                        Widget
                        <SortIcon active={widgetSortKey === "name"} dir={widgetSortDir} />
                      </button>
                    </th>
                    <th className="w-36 pb-2 pr-4 text-left">
                      <button type="button" onClick={() => handleWidgetSort("mode")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                        Mode
                        <SortIcon active={widgetSortKey === "mode"} dir={widgetSortDir} />
                      </button>
                    </th>
                    <th className="w-24 pb-2 pr-4 text-left">
                      <button type="button" onClick={() => handleWidgetSort("status")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                        Status
                        <SortIcon active={widgetSortKey === "status"} dir={widgetSortDir} />
                      </button>
                    </th>
                    <th className="w-20 pb-2 pr-4 text-left">
                      <button type="button" onClick={() => handleWidgetSort("usedIn")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                        Used in
                        <SortIcon active={widgetSortKey === "usedIn"} dir={widgetSortDir} />
                      </button>
                    </th>
                    <th className="w-24 pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Attachments</th>
                    <th className="pb-2 text-left text-xs font-medium text-neutral-400">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWidgets.map((widget, idx) => {
                    const eff = effectiveWidget(widget, widgetOverrides[widget.name]);
                    const usingIds = widgetUsage.get(widget.name) ?? [];
                    return (
                      <tr key={widget.name} className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50">
                        <td className="py-3 pr-4 text-right text-xs tabular-nums text-neutral-300 group-hover:text-neutral-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 pr-4 align-top">
                          <button
                            type="button"
                            onClick={() => setEditingWidgetName(widget.name)}
                            title="Edit widget"
                            className="text-left font-mono text-sm font-medium text-neutral-800 transition-colors hover:text-blue-600"
                          >
                            {widget.name}
                          </button>
                        </td>
                        <td className="py-3 pr-4 align-top">
                          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium leading-none ${widgetModeBadgeClass(eff.mode)}`}>
                            {eff.mode}
                          </span>
                        </td>
                        <td className="py-3 pr-4 align-top">
                          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium leading-none ${widgetStatusBadgeClass(eff.status)}`}>
                            {eff.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 align-top">
                          {usingIds.length === 0 ? (
                            <span className="text-xs text-neutral-300">—</span>
                          ) : (
                            <span
                              className="inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600"
                              title={`Scenarios: ${usingIds.join(", ")}`}
                            >
                              {usingIds.length}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 align-top">
                          {(() => {
                            const count = attachmentCounts.get(widget.name) ?? 0;
                            if (count === 0) return <span className="text-xs text-neutral-300">—</span>;
                            return (
                              <button
                                type="button"
                                onClick={() => setEditingWidgetName(widget.name)}
                                className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                                title={`${count} attachment${count === 1 ? "" : "s"} — click to view`}
                              >
                                <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                </svg>
                                {count}
                              </button>
                            );
                          })()}
                        </td>
                        <td className="py-3 pr-4 align-top">
                          <span className="text-xs text-neutral-500">{eff.purpose}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        ) : tab === "personas" ? (
          /* ── Personas table ── */
          (() => {
            const q = query.trim().toLowerCase();
            const visible = q
              ? personaInfos.filter(
                  (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.id.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q) ||
                    p.copyNotes.toLowerCase().includes(q) ||
                    p.scopeRules.some((r) => r.toLowerCase().includes(q))
                )
              : personaInfos;

            const usageByPersona = new Map<Persona, number[]>();
            for (const s of scenarios) {
              const eff = effectiveScenario(s, scenarioOverrides[s.id]);
              const arr = usageByPersona.get(eff.persona) ?? [];
              arr.push(s.id);
              usageByPersona.set(eff.persona, arr);
            }

            if (visible.length === 0) {
              return (
                <div className="flex flex-col items-center gap-2 py-20 text-center">
                  <p className="text-sm font-medium text-neutral-500">No personas match &ldquo;{query}&rdquo;</p>
                  <button type="button" onClick={() => setQuery("")} className="text-sm text-blue-600 hover:text-blue-700">Clear filter</button>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <p className="text-xs text-neutral-500">
                  Static reference. Each persona shapes copy and scope across the agent. Scenario rows tag the persona they target — most apply to <span className="font-mono">all</span>; restricted operations target a single persona.
                </p>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="w-10 pb-2 pr-4 text-left text-xs font-medium text-neutral-400">#</th>
                      <th className="w-44 pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Persona</th>
                      <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Scope rules</th>
                      <th className="w-72 pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Copy notes</th>
                      <th className="w-24 pb-2 text-left text-xs font-medium text-neutral-400">Scenarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((p, idx) => {
                      const usingIds = usageByPersona.get(p.id) ?? [];
                      return (
                        <tr key={p.id} className="group border-b border-neutral-100 transition-colors hover:bg-neutral-50 align-top">
                          <td className="py-3 pr-4 text-right text-xs tabular-nums text-neutral-300 group-hover:text-neutral-400">{idx + 1}</td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-col gap-1.5">
                              <span className={`inline-flex w-fit items-center rounded border px-1.5 py-0.5 text-xs font-medium leading-none ${personaBadgeClass(p.id)}`}>
                                {p.id}
                              </span>
                              <span className="text-sm font-medium text-neutral-800">{p.name}</span>
                              <span className="text-xs text-neutral-500">{p.description}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <ul className="space-y-1 text-xs text-neutral-600">
                              {p.scopeRules.map((r, i) => (
                                <li key={i} className="flex gap-1.5">
                                  <span className="text-neutral-300">·</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-xs text-neutral-600">{p.copyNotes}</span>
                          </td>
                          <td className="py-3">
                            {usingIds.length === 0 ? (
                              <span className="text-xs text-neutral-300">—</span>
                            ) : (
                              <span
                                className="inline-flex items-center rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600"
                                title={`Scenarios scoped to this persona: ${usingIds.join(", ")}`}
                              >
                                {usingIds.length}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()
        ) : (
          /* ── Scenarios table ── */
          <>
            {filteredScenarios.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <p className="text-sm font-medium text-neutral-500">No scenarios match &ldquo;{query}&rdquo;</p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th style={{ width: "2rem", minWidth: "2rem", maxWidth: "2rem" }} className="pb-2" />
                  <th className="w-10 pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("id")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      #
                      <SortIcon active={sortKey === "id"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="w-52 pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("name")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      Scenario
                      <SortIcon active={sortKey === "name"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Overview</th>
                  <th className="w-28 pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("mode")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      UI split
                      <SortIcon active={sortKey === "mode"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="w-40 pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("surface")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      Entry Points
                      <SortIcon active={sortKey === "surface"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="w-32 pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("persona")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      Persona
                      <SortIcon active={sortKey === "persona"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="w-28 pb-2 pr-4 text-left">
                    <button type="button" onClick={() => handleSort("sprintPriority")} className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-600">
                      Priority
                      <SortIcon active={sortKey === "sprintPriority"} dir={sortDir} />
                    </button>
                  </th>
                  <th className="w-[200px] pb-2 pr-4 text-left text-xs font-medium text-neutral-400">Widgets</th>
                  <th className="w-28 pb-2 text-left text-xs font-medium text-neutral-400">Prototype</th>
                </tr>
              </thead>
              <tbody>
                {filteredScenarios.map((scenario, rowIdx) => {
                  const eff = effectiveScenario(scenario, scenarioOverrides[scenario.id]);
                  const isFirst = rowIdx === 0;
                  const isLast = rowIdx === filteredScenarios.length - 1;
                  return (
                  <tr
                    key={scenario.id}
                    className={`group border-b border-neutral-100 transition-colors ${
                      (scenarioOverrides[scenario.id]?.sprintPriority ?? scenario.sprintPriority ?? "p3") === "p1"
                        ? "bg-yellow-50 hover:bg-yellow-100"
                        : "hover:bg-neutral-50"
                    }`}
                  >
                    <td style={{ width: "2rem", minWidth: "2rem", maxWidth: "2rem" }} className="py-3">
                      <div className={`flex w-5 flex-col gap-0.5 transition-opacity ${sortKey === "id" ? "opacity-0 group-hover:opacity-100" : "invisible"}`}>
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => moveScenario(scenario.id, -1)}
                            className="flex size-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-20 disabled:cursor-not-allowed"
                            aria-label="Move up"
                          >
                            <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => moveScenario(scenario.id, 1)}
                            className="flex size-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-20 disabled:cursor-not-allowed"
                            aria-label="Move down"
                          >
                            <svg className="size-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                        </div>
                    </td>
                    <td className="py-3 pr-4 text-right text-xs tabular-nums text-neutral-300 group-hover:text-neutral-400">
                      {rowIdx + 1}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingScenarioId(scenario.id)}
                              title="Edit scenario"
                              className="text-left text-sm font-medium text-neutral-800 transition-colors hover:text-blue-600"
                            >
                              {eff.name}
                            </button>
                          </div>
                          {eff.constraint && (
                            <p className="mt-0.5 text-xs leading-tight text-amber-600">
                              {eff.constraint}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <span className="text-xs text-neutral-500">{eff.overview}</span>
                    </td>
                    <td className="py-3 pr-4 align-top">
                      {(() => {
                        const m = scenarioOverrides[scenario.id]?.mode ?? scenario.mode;
                        return (
                          <InlineSelect
                            value={m}
                            options={MODE_OPTIONS}
                            onChange={(v) => updateScenarioOverride(scenario.id, { mode: v })}
                            badgeClass={modeBadgeClass(m)}
                          />
                        );
                      })()}
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <SurfaceMultiSelect
                        value={scenarioOverrides[scenario.id]?.surfaces ?? scenario.surfaces}
                        onChange={(v) => updateScenarioOverride(scenario.id, { surfaces: v })}
                      />
                    </td>
                    <td className="py-3 pr-4 align-top">
                      {(() => {
                        const pe = scenarioOverrides[scenario.id]?.persona ?? scenario.persona;
                        return (
                          <InlineSelect
                            value={pe}
                            options={PERSONA_OPTIONS}
                            onChange={(v) => updateScenarioOverride(scenario.id, { persona: v })}
                            badgeClass={personaBadgeClass(pe)}
                          />
                        );
                      })()}
                    </td>
                    <td className="py-3 pr-4 align-top">
                      {(() => {
                        const sp = scenarioOverrides[scenario.id]?.sprintPriority ?? scenario.sprintPriority ?? "p3";
                        return (
                          <InlineSelect
                            value={sp}
                            options={SPRINT_PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: o.value.toUpperCase() }))}
                            onChange={(v) => updateScenarioOverride(scenario.id, { sprintPriority: v })}
                            badgeClass={sprintBadgeClass(sp)}
                          />
                        );
                      })()}
                    </td>
                    <td className="py-3 pr-4 align-top">
                      {eff.components.length === 0 ? (
                        <span className="text-xs text-neutral-300">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {eff.components.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-xs text-emerald-700"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 align-top">
                      {eff.href ? (
                        <a
                          href={BASE + eff.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          View
                          <ExternalLinkIcon />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-neutral-50 px-1.5 py-0.5 text-xs font-medium text-neutral-400 border border-dashed border-neutral-200">
                          Not yet linked
                        </span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          </>
        )}
      </div>

      {editingScenarioId !== null && (() => {
        const source = scenarios.find((s) => s.id === editingScenarioId);
        if (!source) return null;
        const merged = effectiveScenario(source, scenarioOverrides[source.id]);
        return (
          <EditScenarioModal
            scenario={merged}
            hasOverride={!!scenarioOverrides[source.id] && Object.keys(scenarioOverrides[source.id]!).length > 0}
            onSave={(draft) => {
              saveScenarioFromModal(source.id, draft);
              setEditingScenarioId(null);
            }}
            onReset={() => {
              resetScenarioOverride(source.id);
              setEditingScenarioId(null);
            }}
            onClose={() => setEditingScenarioId(null)}
          />
        );
      })()}

      {editingWidgetName !== null && (() => {
        const source = widgets.find((w) => w.name === editingWidgetName);
        if (!source) return null;
        const merged = effectiveWidget(source, widgetOverrides[source.name]);
        return (
          <EditWidgetModal
            widget={merged}
            hasOverride={!!widgetOverrides[source.name] && Object.keys(widgetOverrides[source.name]!).length > 0}
            onSave={(draft) => {
              saveWidgetFromModal(source.name, draft);
              setEditingWidgetName(null);
            }}
            onReset={() => {
              resetWidgetOverride(source.name);
              setEditingWidgetName(null);
            }}
            onClose={() => setEditingWidgetName(null)}
            onAttachmentsChanged={refreshAttachmentCounts}
          />
        );
      })()}
    </div>
  );
}

// Single source of truth for the agent bundle version. The agent reports this
// on every heartbeat so the dashboard can tell which agents are out of date.
// Bump this whenever printer-agent/ changes in a way worth re-downloading for.
export const AGENT_VERSION = "1.0.0";

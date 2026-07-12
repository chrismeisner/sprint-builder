# Studio Print Agent

The always-on companion that runs on the Mac next to the studio receipt printer.
It only makes **outbound** calls to the Life OS server — poll for print jobs, print
them on the local CUPS queue, report status. No inbound ports, no port-forwarding.

You normally **download this bundle pre-configured** from the Life OS admin
(Dashboard → Printers → Download agent). The download already contains a `.env`
with your server URL, this agent's key, and the printer's CUPS name.

## Requirements
- macOS with the receipt printer added in *System Settings → Printers & Scanners*
- Node.js 18+ (`node -v`)

## Setup (2 minutes)
1. Unzip this folder somewhere permanent (e.g. `~/studio-print-agent`).
2. Double-click **`test-connection.command`** — it lists CUPS printers, checks
   health, and prints a test receipt. Fix any issues it reports.
3. Double-click **`install-service.command`** — installs an always-on launchd
   service that starts on login and relaunches on crash. That's it.

To run it in the foreground instead (closes when you close the window), double-click
`start-agent.command`. To remove the always-on service, `uninstall-service.command`.

> Set the Mac to **never sleep** (System Settings → Displays/Battery) so it can
> print 24/7. If the Mac is off, jobs queue on the server and print when it returns.

## Configuration (`.env`)
The downloaded bundle already fills these in. Editable if the CUPS queue name changes:

```
SERVER_URL=https://your-life-os-host
AGENT_KEY=pa_…                # this agent's bearer key (issued at download)
PRINTERS=EPSON_TM_T88V        # comma-separated CUPS queue name(s)
POLL_INTERVAL_MS=5000
MAX_CLAIM=5
# DRY_RUN=1                   # log receipts instead of printing (for testing)
```

## What it talks to
- `POST /api/print/agents/heartbeat` — liveness + printer health
- `POST /api/print/agents/claim` — atomically claim pending jobs
- `PATCH /api/print/jobs/:id` — report printing / printed / failed

If the key is ever lost or leaked, download the agent again from the dashboard — that
mints a fresh key and invalidates this one.

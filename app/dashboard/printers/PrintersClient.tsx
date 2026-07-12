"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Studio Printer admin. Manage agents (the always-on studio Macs), the printers
// bound to them, and the live print queue. See docs/studio-printer-plan.md §7.
// ─────────────────────────────────────────────────────────────────────────────

type Agent = {
  id: string;
  name: string;
  last_seen_at: string | null;
  agent_version: string | null;
  printer_count: number;
  created_at: string;
};

type Printer = {
  id: string;
  agent_id: string;
  cups_name: string;
  label: string;
  status: string | null;
  status_at: string | null;
  agent_name: string;
  agent_last_seen_at: string | null;
};

type Job = {
  id: string;
  printer_id: string;
  printer_label: string;
  cups_name: string;
  payload: { type?: string; [k: string]: unknown };
  status: string;
  attempts: number;
  error: string | null;
  source: string | null;
  created_at: string;
  printed_at: string | null;
};

async function api(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json().catch(() => ({}));
}

function relTime(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Agent is "online" if it heartbeat within the last 30s.
function agentOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 30_000;
}

// Combine agent liveness + reported printer state into one dot color.
function printerDot(p: Printer): { color: string; title: string } {
  if (!agentOnline(p.agent_last_seen_at)) {
    return { color: "bg-neutral-300 dark:bg-neutral-600", title: "Agent offline — the studio Mac isn't checking in" };
  }
  switch (p.status) {
    case "idle":
    case "printing":
      return { color: "bg-emerald-500", title: `Connected (${p.status})` };
    case "paused":
    case "out-of-paper":
      return { color: "bg-amber-500", title: `Needs attention (${p.status})` };
    case "offline":
    case "disabled":
      return { color: "bg-red-500", title: `Printer ${p.status}` };
    default:
      return { color: "bg-neutral-400", title: `Status ${p.status ?? "unknown"}` };
  }
}

const JOB_STATUS_STYLE: Record<string, string> = {
  pending: "text-amber-600 dark:text-amber-400",
  claimed: "text-blue-600 dark:text-blue-400",
  printing: "text-blue-600 dark:text-blue-400",
  printed: "text-emerald-600 dark:text-emerald-400",
  failed: "text-red-600 dark:text-red-400",
  canceled: "text-neutral-400",
};

export default function PrintersClient() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<{ name: string; token: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, p, j] = await Promise.all([
        api("/api/print/agents"),
        api("/api/print/printers"),
        api("/api/print/jobs?limit=50"),
      ]);
      setAgents(a.agents ?? []);
      setPrinters(p.printers ?? []);
      setJobs(j.jobs ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  // Light live poll for printer status + queue every 8s.
  const poll = useCallback(async () => {
    try {
      const [p, j] = await Promise.all([
        api("/api/print/printers"),
        api("/api/print/jobs?limit=50"),
      ]);
      setPrinters(p.printers ?? []);
      setJobs(j.jobs ?? []);
    } catch {
      /* transient; keep last good state */
    }
  }, []);

  useEffect(() => {
    load();
    pollRef.current = setInterval(poll, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load, poll]);

  async function addAgent() {
    const name = window.prompt("Name this studio machine (e.g. studio-mac-mini):");
    if (!name?.trim()) return;
    try {
      const { agent, token } = await api("/api/print/agents", "POST", { name: name.trim() });
      setNewToken({ name: agent.name, token });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add agent");
    }
  }

  function downloadAgent(agent: Agent) {
    // POST to the installer streams a .zip and mints a fresh key. One request only
    // — each POST re-mints the key, so a duplicate call would invalidate this
    // download's embedded key. fetch → blob so it's an authenticated download.
    fetch(`/api/print/agents/${agent.id}/installer`, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `studio-print-agent-${agent.name.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        load();
      })
      .catch((e) => alert(e instanceof Error ? e.message : "Download failed"));
  }

  async function addPrinter(agent: Agent) {
    const cupsName = window.prompt("CUPS queue name on that Mac (e.g. EPSON_TM_T88V):", "EPSON_TM_T88V");
    if (!cupsName?.trim()) return;
    const label = window.prompt("Friendly label (e.g. Studio front desk):", "Studio printer");
    if (!label?.trim()) return;
    try {
      await api("/api/print/printers", "POST", {
        agentId: agent.id,
        cupsName: cupsName.trim(),
        label: label.trim(),
      });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add printer");
    }
  }

  async function deletePrinter(p: Printer) {
    if (!window.confirm(`Remove printer "${p.label}"? Its queued jobs are deleted too.`)) return;
    try {
      await api(`/api/print/printers/${p.id}`, "DELETE");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete printer");
    }
  }

  async function printTest(p: Printer) {
    try {
      await api("/api/print/jobs", "POST", {
        printerId: p.id,
        source: "admin-test",
        payload: {
          type: "note",
          text: `Test receipt from Life OS\n${p.label} · ${new Date().toLocaleString()}`,
          cut: "partial",
        },
      });
      await poll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to enqueue test");
    }
  }

  async function cancelJob(job: Job) {
    try {
      await api(`/api/print/jobs/${job.id}/cancel`, "POST");
      await poll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to cancel");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">🖨️ Printers</h1>
        <button
          onClick={addAgent}
          className="rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 px-3 py-1.5 text-sm font-medium hover:opacity-90"
        >
          + Add machine
        </button>
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        Enqueue receipts from anywhere; an always-on Mac in the studio prints them. A
        machine (agent) polls outbound-only — no ports to open.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {newToken && (
        <div className="mb-6 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4">
          <div className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
            Agent key for “{newToken.name}” — shown once
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
            Downloading the agent embeds this key automatically. Copy it only if you’re
            configuring the agent by hand. Re-downloading later mints a new key.
          </p>
          <code className="block break-all rounded bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800 px-2 py-1 text-[11px] font-mono">
            {newToken.token}
          </code>
          <button
            onClick={() => setNewToken(null)}
            className="mt-2 text-xs text-amber-700 dark:text-amber-300 underline"
          >
            Done
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-neutral-400">Loading…</div>
      ) : (
        <div className="space-y-8">
          {/* Agents + their printers */}
          <section>
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Machines</h2>
            {agents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-6 text-center text-sm text-neutral-500">
                No machines yet. Add one, download its agent, and run it on the Mac by the printer.
              </div>
            ) : (
              <div className="space-y-4">
                {agents.map((agent) => {
                  const online = agentOnline(agent.last_seen_at);
                  const agentPrinters = printers.filter((p) => p.agent_id === agent.id);
                  return (
                    <div key={agent.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full ${online ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"}`} title={online ? "Online" : "Offline"} />
                          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{agent.name}</h3>
                          <span className="text-[11px] text-neutral-400">
                            seen {relTime(agent.last_seen_at)}
                            {agent.agent_version ? ` · v${agent.agent_version}` : ""}
                          </span>
                        </div>
                        <div className="flex gap-1.5 flex-none">
                          <button onClick={() => addPrinter(agent)} className="rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800">
                            + Printer
                          </button>
                          <button onClick={() => downloadAgent(agent)} className="rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800">
                            ⬇ Download agent
                          </button>
                        </div>
                      </div>

                      {agentPrinters.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {agentPrinters.map((p) => {
                            const dot = printerDot(p);
                            return (
                              <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 px-3 py-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-2 h-2 rounded-full ${dot.color}`} title={dot.title} />
                                  <span className="text-sm text-neutral-800 dark:text-neutral-200 truncate">{p.label}</span>
                                  <span className="text-[11px] font-mono text-neutral-400 truncate">{p.cups_name}</span>
                                </div>
                                <div className="flex gap-1.5 flex-none">
                                  <button onClick={() => printTest(p)} className="rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-0.5 text-xs hover:bg-white dark:hover:bg-neutral-900">
                                    Test print
                                  </button>
                                  <button onClick={() => deletePrinter(p)} className="rounded-md px-2 py-0.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40">
                                    Remove
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Queue + history */}
          <section>
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Print queue</h2>
            {jobs.length === 0 ? (
              <div className="text-sm text-neutral-400">No jobs yet.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Printer</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Source</th>
                      <th className="px-3 py-2 font-medium">When</th>
                      <th className="px-3 py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-neutral-100 dark:border-neutral-800/60 last:border-0">
                        <td className={`px-3 py-2 font-medium ${JOB_STATUS_STYLE[job.status] ?? ""}`}>
                          {job.status}
                          {job.attempts > 1 && <span className="text-neutral-400"> ·{job.attempts}×</span>}
                          {job.error && <span className="block text-[11px] text-red-400 max-w-[200px] truncate" title={job.error}>{job.error}</span>}
                        </td>
                        <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{job.printer_label}</td>
                        <td className="px-3 py-2 text-neutral-500">{job.payload?.type ?? "?"}</td>
                        <td className="px-3 py-2 text-neutral-500">{job.source ?? "—"}</td>
                        <td className="px-3 py-2 text-neutral-500" title={new Date(job.created_at).toLocaleString()}>{relTime(job.created_at)}</td>
                        <td className="px-3 py-2 text-right">
                          {job.status === "pending" && (
                            <button onClick={() => cancelJob(job)} className="text-xs text-neutral-400 hover:text-red-500">
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

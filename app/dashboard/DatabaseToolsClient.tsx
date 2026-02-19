"use client";

import { useEffect, useState } from "react";

type Status = {
  ok?: boolean;
  db?: { urlPreview?: string | null; nodeEnv?: string };
  counts?: {
    documents: number;
    sprint_drafts: number;
    deliverables_total: number;
    deliverables_active: number;
    accounts_total: number;
    accounts_admins: number;
  };
  error?: string;
};

export default function DatabaseToolsClient() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "ensure">(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/db/status");
      const data = (await res.json()) as Status;
      if (!res.ok) throw new Error(data?.error || "Failed to load status");
      setStatus(data);
    } catch (e) {
      setError((e as Error).message || "Failed to load status");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function runEnsure() {
    try {
      setBusy("ensure");
      setError(null);
      const res = await fetch("/api/admin/db/ensure", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to run ensureSchema");
      await refresh();
    } catch (e) {
      setError((e as Error).message || "Failed to run ensureSchema");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold mb-3">Database Utilities</h2>
      <p className="text-sm opacity-70 mb-4">
        Check connectivity and run schema creation.
      </p>

      {loading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : (
        <>
          {error && (
            <div className="mb-3 rounded-md border border-red-600/20 dark:border-red-400/20 bg-red-600/10 dark:bg-red-400/10 p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          {status?.ok && (
            <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
              <div className="bg-black/5 dark:bg-white/5 px-4 py-2 text-sm font-medium">
                Status
              </div>
              <div className="p-4 text-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="opacity-70">Database URL</div>
                  <div className="font-mono break-all">{status.db?.urlPreview || "-"}</div>
                </div>
                <div>
                  <div className="opacity-70">Node Env</div>
                  <div>{status.db?.nodeEnv || "-"}</div>
                </div>
                <div>
                  <div className="opacity-70">Documents</div>
                  <div>{status.counts?.documents ?? 0}</div>
                </div>
                <div>
                  <div className="opacity-70">Sprint Drafts</div>
                  <div>{status.counts?.sprint_drafts ?? 0}</div>
                </div>
                <div>
                  <div className="opacity-70">Deliverables (Active / Total)</div>
                  <div>
                    {(status.counts?.deliverables_active ?? 0)}/{status.counts?.deliverables_total ?? 0}
                  </div>
                </div>
                <div>
                  <div className="opacity-70">Accounts (Admins / Total)</div>
                  <div>
                    {(status.counts?.accounts_admins ?? 0)}/{status.counts?.accounts_total ?? 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runEnsure}
              disabled={busy !== null}
              className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60 transition"
            >
              {busy === "ensure" ? "Running…" : "Run ensureSchema"}
            </button>
            <button
              type="button"
              onClick={refresh}
              disabled={busy !== null}
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-60"
            >
              Refresh status
            </button>
          </div>
        </>
      )}
    </section>
  );
}



"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type StripeKey = {
  hasSecretKey: boolean;
  hasPublishableKey: boolean;
  hasWebhookSecret: boolean;
};

type StripeAccount = {
  id: string;
  email: string | null;
  business_name: string | null;
  country: string | null;
  default_currency: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
};

type BalanceEntry = { amount: number; currency: string };

type StripeBalance = {
  available: BalanceEntry[];
  pending: BalanceEntry[];
};

type StatusResponse = {
  connected: boolean;
  mode: "live" | "test" | null;
  account: StripeAccount | null;
  balance: StripeBalance | null;
  keys: StripeKey;
  error: string | null;
};

type WebhookEndpoint = {
  id: string;
  url: string;
  status: string;
  enabledEvents: string[];
  created: number;
};

type WebhooksResponse = {
  appWebhookUrl: string;
  hasWebhookSecret: boolean;
  endpoints: WebhookEndpoint[];
  error: string | null;
};

type SimulateResult = {
  success: boolean;
  eventType: string;
  fakeStripeId: string;
  matchedInvoices: number;
  logs: string[];
  error?: string;
};

const SUPPORTED_EVENTS = [
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
] as const;

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        ok
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
          : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
      }`}
    >
      <span>{ok ? "✓" : "✕"}</span>
      {label}
    </span>
  );
}

function ModePill({ mode }: { mode: "live" | "test" | null }) {
  if (!mode) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
        mode === "live"
          ? "bg-green-500 text-white"
          : "bg-amber-400 text-amber-900"
      }`}
    >
      {mode === "live" ? "● LIVE" : "● TEST"}
    </span>
  );
}

function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<WebhooksResponse | null>(null);
  const [webhooksLoading, setWebhooksLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>(SUPPORTED_EVENTS[0]);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    setWebhooksLoading(true);
    try {
      const res = await fetch("/api/admin/stripe/webhooks");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: WebhooksResponse = await res.json();
      setWebhooks(data);
    } catch {
      setWebhooks(null);
    } finally {
      setWebhooksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const simulate = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch("/api/admin/stripe/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: selectedEvent }),
      });
      const data: SimulateResult = await res.json();
      setSimResult(data);
    } catch (err) {
      setSimResult({
        success: false,
        eventType: selectedEvent,
        fakeStripeId: "",
        matchedInvoices: 0,
        logs: [],
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setSimulating(false);
    }
  };

  const copyUrl = () => {
    if (!webhooks?.appWebhookUrl) return;
    navigator.clipboard.writeText(webhooks.appWebhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-black divide-y divide-black/10 dark:divide-white/10">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <h2 className="font-semibold text-sm uppercase tracking-wide opacity-60">Webhooks</h2>
        <button
          onClick={fetchWebhooks}
          disabled={webhooksLoading}
          className="text-xs opacity-50 hover:opacity-100 transition disabled:opacity-30"
        >
          {webhooksLoading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* App webhook URL */}
      {webhooks && (
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs uppercase tracking-wide opacity-50 mb-2">App Webhook Endpoint</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-black/5 dark:bg-white/5 px-3 py-2 text-xs font-mono break-all">
              {webhooks.appWebhookUrl}
            </code>
            <button
              onClick={copyUrl}
              className="shrink-0 rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs opacity-50 pt-1">
            Register this URL in the{" "}
            <a
              href="https://dashboard.stripe.com/webhooks"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:opacity-80"
            >
              Stripe dashboard → Webhooks
            </a>
            {" "}to receive live events.
          </p>
        </div>
      )}

      {/* Registered Stripe endpoints */}
      <div className="px-5 py-4 space-y-3">
        <p className="text-xs uppercase tracking-wide opacity-50">Registered in Stripe</p>
        {webhooksLoading ? (
          <p className="text-sm opacity-50">Loading…</p>
        ) : !webhooks || webhooks.error ? (
          <p className="text-sm text-red-500">{webhooks?.error ?? "Failed to load"}</p>
        ) : webhooks.endpoints.length === 0 ? (
          <p className="text-sm opacity-50">No webhook endpoints registered in Stripe yet.</p>
        ) : (
          <ul className="space-y-2">
            {webhooks.endpoints.map((ep) => (
              <li
                key={ep.id}
                className="rounded-lg border border-black/10 dark:border-white/10 px-4 py-3 space-y-1 text-sm"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      ep.status === "enabled"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    }`}
                  >
                    {ep.status}
                  </span>
                  <code className="font-mono text-xs opacity-70 break-all">{ep.url}</code>
                </div>
                <p className="text-xs opacity-50">
                  {ep.enabledEvents.includes("*")
                    ? "Listening to all events"
                    : `${ep.enabledEvents.length} event${ep.enabledEvents.length !== 1 ? "s" : ""}: ${ep.enabledEvents.slice(0, 4).join(", ")}${ep.enabledEvents.length > 4 ? ` +${ep.enabledEvents.length - 4} more` : ""}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Simulate an event */}
      <div className="px-5 py-4 space-y-3">
        <div className="space-y-0.5">
          <p className="text-xs uppercase tracking-wide opacity-50">Simulate an Event</p>
          <p className="text-xs opacity-40">
            Runs the webhook handler logic directly (admin only, no signature required). Safe to run anytime — uses a fake Stripe ID so no real invoice will be modified.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="flex-1 min-w-48 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
          >
            {SUPPORTED_EVENTS.map((evt) => (
              <option key={evt} value={evt}>
                {evt}
              </option>
            ))}
          </select>
          <button
            onClick={simulate}
            disabled={simulating}
            className="rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 text-sm font-medium hover:opacity-80 disabled:opacity-50 transition"
          >
            {simulating ? "Running…" : "Fire test event"}
          </button>
        </div>

        {/* Simulation result */}
        {simResult && (
          <div
            className={`rounded-lg border px-4 py-3 space-y-2 text-sm ${
              simResult.success
                ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <span>{simResult.success ? "✓" : "✕"}</span>
              <span>{simResult.success ? "Handler ran successfully" : "Handler error"}</span>
              {simResult.matchedInvoices > 0 && (
                <span className="ml-auto text-xs font-normal opacity-60">
                  {simResult.matchedInvoices} invoice(s) updated
                </span>
              )}
            </div>
            {simResult.error && (
              <p className="text-red-600 dark:text-red-400 text-xs">{simResult.error}</p>
            )}
            {simResult.logs.length > 0 && (
              <pre className="rounded bg-black/5 dark:bg-white/5 p-2 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {simResult.logs.join("\n")}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Stripe CLI hint */}
      <div className="px-5 py-4 rounded-b-xl bg-black/2 dark:bg-white/2">
        <p className="text-xs opacity-50">
          For end-to-end local testing with real Stripe events, use the{" "}
          <a
            href="https://stripe.com/docs/stripe-cli"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
          >
            Stripe CLI
          </a>
          :{" "}
          <code className="font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
            stripe listen --forward-to localhost:3000/api/webhooks/stripe
          </code>
        </p>
      </div>
    </section>
  );
}

export default function StripeConnectionClient() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stripe/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StatusResponse = await res.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="container max-w-3xl py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Stripe Connection</h1>
            {status && <ModePill mode={status.mode} />}
          </div>
          <p className="text-sm opacity-60">
            Manage the connected Stripe account used for sprint invoices and deposits.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && !status && (
        <div className="rounded-xl border border-black/10 dark:border-white/10 p-8 text-center text-sm opacity-60">
          Loading Stripe status…
        </div>
      )}

      {status && (
        <>
          {/* Connection status banner */}
          <div
            className={`rounded-xl border p-5 space-y-2 ${
              status.connected
                ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{status.connected ? "✅" : "❌"}</span>
              <div>
                <p className="font-semibold text-base">
                  {status.connected ? "Stripe is connected" : "Stripe is not connected"}
                </p>
                <p className="text-sm opacity-70">
                  {status.connected
                    ? status.error
                      ? `Warning: ${status.error}`
                      : "API keys are valid and the account is reachable."
                    : status.error
                    ? `Error: ${status.error}`
                    : "No Stripe secret key found in environment variables."}
                </p>
              </div>
            </div>
          </div>

          {/* Account details */}
          {status.account && (
            <section className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-black divide-y divide-black/10 dark:divide-white/10">
              <div className="px-5 py-4">
                <h2 className="font-semibold text-sm uppercase tracking-wide opacity-60">
                  Account Details
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-black/10 dark:divide-white/10">
                <dl className="px-5 py-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide opacity-50 mb-0.5">Business Name</dt>
                    <dd className="font-medium">{status.account.business_name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide opacity-50 mb-0.5">Account Email</dt>
                    <dd className="font-medium">{status.account.email ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide opacity-50 mb-0.5">Account ID</dt>
                    <dd className="font-mono text-xs opacity-70">{status.account.id}</dd>
                  </div>
                </dl>
                <dl className="px-5 py-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide opacity-50 mb-0.5">Country</dt>
                    <dd className="font-medium">{status.account.country?.toUpperCase() ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide opacity-50 mb-0.5">Default Currency</dt>
                    <dd className="font-medium">{status.account.default_currency?.toUpperCase() ?? "—"}</dd>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <StatusPill ok={status.account.charges_enabled} label="Charges enabled" />
                    <StatusPill ok={status.account.payouts_enabled} label="Payouts enabled" />
                    <StatusPill ok={status.account.details_submitted} label="Details submitted" />
                  </div>
                </dl>
              </div>
            </section>
          )}

          {/* Balance */}
          {status.balance && (
            <section className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-black divide-y divide-black/10 dark:divide-white/10">
              <div className="px-5 py-4">
                <h2 className="font-semibold text-sm uppercase tracking-wide opacity-60">Balance</h2>
              </div>
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-black/10 dark:divide-white/10">
                <div className="px-5 py-4 space-y-1">
                  <p className="text-xs uppercase tracking-wide opacity-50">Available</p>
                  {status.balance.available.length === 0 ? (
                    <p className="text-sm opacity-60">—</p>
                  ) : (
                    status.balance.available.map((b) => (
                      <p key={b.currency} className="text-xl font-bold">
                        {formatAmount(b.amount, b.currency)}
                      </p>
                    ))
                  )}
                </div>
                <div className="px-5 py-4 space-y-1">
                  <p className="text-xs uppercase tracking-wide opacity-50">Pending</p>
                  {status.balance.pending.length === 0 ? (
                    <p className="text-sm opacity-60">—</p>
                  ) : (
                    status.balance.pending.map((b) => (
                      <p key={b.currency} className="text-xl font-bold opacity-60">
                        {formatAmount(b.amount, b.currency)}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Environment keys checklist */}
          <section className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-black divide-y divide-black/10 dark:divide-white/10">
            <div className="px-5 py-4">
              <h2 className="font-semibold text-sm uppercase tracking-wide opacity-60">
                Environment Variables
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                {
                  key: "STRIPE_SECRET_KEY",
                  set: status.keys.hasSecretKey,
                  desc: "Required. Server-side API key (sk_test_… or sk_live_…).",
                },
                {
                  key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
                  set: status.keys.hasPublishableKey,
                  desc: "Required for client-side payment elements (pk_test_… or pk_live_…).",
                },
                {
                  key: "STRIPE_WEBHOOK_SECRET",
                  set: status.keys.hasWebhookSecret,
                  desc: "Required for verifying webhook events from Stripe (whsec_…).",
                },
              ].map(({ key, set, desc }) => (
                <div key={key} className="flex items-start gap-3">
                  <span className={`mt-0.5 text-sm font-bold ${set ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {set ? "✓" : "✕"}
                  </span>
                  <div>
                    <p className="font-mono text-sm font-medium">{key}</p>
                    <p className="text-xs opacity-60 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ACH recommendation */}
          <section className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-5 space-y-2">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Use ACH to reduce fees on large invoices
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 opacity-90">
                  Stripe card processing costs 2.9% + $0.30 per transaction — roughly $290 on a $10,000 invoice.
                  Enabling <strong>ACH Direct Debit</strong> drops fees to 0.8%, capped at <strong>$5 per transaction</strong>.
                  For B2B invoicing at sprint prices ($8k–$20k), ACH should be the default payment method offered to clients.
                </p>
                <a
                  href="https://stripe.com/docs/payments/ach-debit"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm font-medium text-blue-700 dark:text-blue-300 underline underline-offset-2 hover:opacity-80"
                >
                  Stripe ACH docs →
                </a>
              </div>
            </div>
          </section>

          {/* Setup instructions (only when not connected) */}
          {!status.connected && (
            <section className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-black divide-y divide-black/10 dark:divide-white/10">
              <div className="px-5 py-4">
                <h2 className="font-semibold text-sm uppercase tracking-wide opacity-60">
                  Setup Instructions
                </h2>
              </div>
              <div className="px-5 py-5 space-y-4 text-sm">
                <ol className="space-y-3 list-decimal pl-5 opacity-80">
                  <li>
                    Go to{" "}
                    <a
                      href="https://dashboard.stripe.com/apikeys"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:opacity-80"
                    >
                      stripe.com/dashboard → API Keys
                    </a>{" "}
                    and copy your Secret Key and Publishable Key.
                  </li>
                  <li>
                    Add them to your <code className="font-mono text-xs bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">.env.local</code> file:
                    <pre className="mt-2 rounded-lg bg-black/5 dark:bg-white/5 p-3 text-xs font-mono overflow-x-auto">{`STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...`}</pre>
                  </li>
                  <li>
                    For the webhook secret, create a webhook in the Stripe dashboard pointing to{" "}
                    <code className="font-mono text-xs bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
                      https://yourdomain.com/api/webhooks/stripe
                    </code>
                    , then copy the signing secret.
                  </li>
                  <li>Restart your dev server and refresh this page.</li>
                </ol>
                <p className="text-xs opacity-50 pt-2">
                  Use test keys (sk_test_…) during development. Switch to live keys (sk_live_…) only in production.
                </p>
              </div>
            </section>
          )}

          {/* Webhooks */}
          <WebhooksSection />

          {/* External links */}
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Open Stripe Dashboard →
            </a>
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              API Keys →
            </a>
            <a
              href="https://dashboard.stripe.com/webhooks"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Webhooks →
            </a>
          </div>
        </>
      )}

      <div className="pt-2">
        <Link
          href="/dashboard"
          className="text-sm opacity-60 hover:opacity-100 transition"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}

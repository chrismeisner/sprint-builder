"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      setError(null);
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to request magic link");
      }
      setMessage(
        "If this email is associated with a submission, a login link has been generated. In development, check the server logs for the magic link URL."
      );
    } catch (e) {
      setError((e as Error).message || "Failed to request magic link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen max-w-md mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-sans)]">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Sign in</h1>
        <p className="text-sm text-gray-600">
          Enter the email you used in the intake form and we&apos;ll send you a one-time magic link to view your sprints.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm bg-white text-black"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send magic link"}
        </button>
      </form>

      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
    </main>
  );
}



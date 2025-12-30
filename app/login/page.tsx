"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { typography } from "@/app/components/typography";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      setError(null);
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email,
          redirectUrl: redirectUrl || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to request magic link");
      }
      setMessage(
        "Check your email! We've sent you a magic link to sign in. The link will expire in 15 minutes."
      );
    } catch (e) {
      setError((e as Error).message || "Failed to request magic link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          <h2 className={`${typography.headingCard} text-text-primary`}>Sign in / Sign up</h2>
          <p className={`${typography.bodyBase} text-text-secondary`}>
            Enter your email address and we&apos;ll send you a secure magic link to access your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={`${typography.bodySm} text-text-primary block mb-2`}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${typography.bodyBase} w-full rounded-md border border-black/10 dark:border-white/15 px-4 py-3 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition`}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`${typography.buttonSm} w-full inline-flex items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-3 hover:bg-black/90 dark:hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending magic link...
              </>
            ) : (
              "Send magic link"
            )}
          </button>
        </form>

        {message && (
          <div className={`${typography.bodySm} rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-green-700 dark:text-green-300`}>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>{message}</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className={`${typography.bodySm} rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-red-700 dark:text-red-300`}>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center p-6 bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-black border border-black/10 dark:border-white/15 rounded-lg p-8 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4"></div>
              <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}



"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { typography } from "@/app/components/typography";

type Step = "email" | "code" | "magic-link-sent";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, [searchParams]);

  // Handle email submission - checks if verified or needs code
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      setError(null);
      
      // First, try to send verification code (handles new + unverified emails)
      const codeRes = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const codeData = await codeRes.json().catch(() => ({}));
      
      if (codeRes.status === 429) {
        setError(codeData?.error || "Too many attempts. Please try again later.");
        return;
      }
      
      if (codeData.verified) {
        // Email is already verified - send magic link
        const magicRes = await fetch("/api/auth/magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email,
            redirectUrl: redirectUrl || undefined,
          }),
        });
        const magicData = await magicRes.json().catch(() => ({}));
        
        if (!magicRes.ok) {
          throw new Error(magicData?.error || "Failed to send magic link");
        }
        
        setStep("magic-link-sent");
        setMessage("Check your email! We've sent you a magic link to sign in. The link will expire in 15 minutes.");
      } else {
        // Email needs verification - show code input
        setStep("code");
        setMessage("We've sent a 6-digit verification code to your email.");
        // Focus first code input
        setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
      }
    } catch (e) {
      setError((e as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Handle code input changes
  function handleCodeChange(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    
    // Auto-advance to next input
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all 6 digits entered
    if (digit && index === 5 && newCode.every(d => d)) {
      handleCodeSubmit(newCode.join(""));
    }
  }

  // Handle backspace in code inputs
  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  }

  // Handle paste in code inputs
  function handleCodePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      handleCodeSubmit(pasted);
    }
  }

  // Submit verification code
  async function handleCodeSubmit(codeString?: string) {
    const finalCode = codeString || code.join("");
    if (finalCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: finalCode }),
      });
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        setError(data?.error || "Invalid code");
        // Clear code on error
        setCode(["", "", "", "", "", ""]);
        codeInputRefs.current[0]?.focus();
        return;
      }
      
      // Success! Redirect to projects or specified URL
      // Use router.push with window.location.href to ensure full page refresh and session reload
      const targetUrl = redirectUrl || "/projects";
      window.location.href = targetUrl;
    } catch (e) {
      setError((e as Error).message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  }

  // Resend code
  async function handleResendCode() {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        setError(data?.error || "Failed to resend code");
        return;
      }
      
      setMessage("New code sent! Check your email.");
      setCode(["", "", "", "", "", ""]);
      codeInputRefs.current[0]?.focus();
    } catch (e) {
      setError((e as Error).message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  }

  // Go back to email step
  function handleBack() {
    setStep("email");
    setCode(["", "", "", "", "", ""]);
    setError(null);
    setMessage(null);
  }

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-8 shadow-sm space-y-6">
        
        {/* Email Step */}
        {step === "email" && (
          <>
            <div className="space-y-2">
              <h2 className={`${typography.headingCard} text-text-primary`}>Sign in / Sign up</h2>
              <p className={`${typography.bodyBase} text-text-secondary`}>
                Enter your email address to get started.
              </p>
            </div>

            {/* How it works */}
            <div className={`${typography.bodySm} text-text-secondary`}>
              New users receive a verification code. Returning users get a magic link.
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                    Processing...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          </>
        )}

        {/* Code Verification Step */}
        {step === "code" && (
          <>
            <div className="space-y-2">
              <button 
                onClick={handleBack}
                className={`${typography.bodySm} text-text-secondary hover:text-text-primary flex items-center gap-1 transition`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h2 className={`${typography.headingCard} text-text-primary`}>Enter verification code</h2>
              <p className={`${typography.bodyBase} text-text-secondary`}>
                We sent a 6-digit code to <span className="font-medium text-text-primary">{email}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { codeInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    onPaste={handleCodePaste}
                    className={`${typography.headingCard} w-12 h-14 text-center rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition`}
                    disabled={loading}
                  />
                ))}
              </div>
              
              <button
                onClick={() => handleCodeSubmit()}
                disabled={loading || code.some(d => !d)}
                className={`${typography.buttonSm} w-full inline-flex items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-3 hover:bg-black/90 dark:hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className={`${typography.bodySm} text-text-secondary hover:text-text-primary disabled:opacity-60 transition`}
                >
                  Didn&apos;t receive a code? <span className="underline">Resend</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Magic Link Sent Step */}
        {step === "magic-link-sent" && (
          <>
            <div className="space-y-2">
              <h2 className={`${typography.headingCard} text-text-primary`}>Check your email</h2>
              <p className={`${typography.bodyBase} text-text-secondary`}>
                We sent a magic link to <span className="font-medium text-text-primary">{email}</span>
              </p>
            </div>
            
            <div className={`${typography.bodySm} rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-green-700 dark:text-green-300`}>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p>Click the link in your email to sign in. The link expires in 15 minutes.</p>
              </div>
            </div>

            <button
              onClick={handleBack}
              className={`${typography.buttonSm} w-full inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/15 bg-transparent text-text-primary px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition`}
            >
              Use a different email
            </button>
          </>
        )}

        {/* Success/Error Messages */}
        {message && step === "code" && (
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
      <main className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-6 bg-black/[0.02] dark:bg-white/[0.02]">
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



"use client";

import { useState, useEffect } from "react";

type EmailStatus = {
  configured: boolean;
  apiKeyPresent: boolean;
  domainPresent: boolean;
  fromEmailPresent: boolean;
  apiKey: string | null;
  domain: string | null;
  fromEmail: string | null;
};

type SendResult = {
  success: boolean;
  message?: string;
  messageId?: string;
  error?: string;
  details?: string;
};

export default function EmailTestClient() {
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  
  const [formData, setFormData] = useState({
    to: "",
    subject: "Test Email from Sprint Builder",
    text: "This is a test email sent from the Email Testing page.\n\nIf you're receiving this, Mailgun is configured correctly!",
    html: "",
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-test");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        configured: false,
        apiKeyPresent: false,
        domainPresent: false,
        fromEmailPresent: false,
        apiKey: null,
        domain: null,
        fromEmail: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/admin/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setSendResult(data);
    } catch (error) {
      setSendResult({
        success: false,
        error: `Request failed: ${error}`,
      });
    } finally {
      setSending(false);
    }
  };

  const StatusIndicator = ({ checked, label }: { checked: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full ${checked ? "bg-green-500" : "bg-red-500"}`} />
      <span className={checked ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Email Testing (Mailgun)</h1>
        <p className="text-sm opacity-70">
          Check your Mailgun configuration and send test emails.
        </p>
      </div>

      {/* Configuration Status */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Configuration Status</h2>
          <button
            onClick={checkStatus}
            disabled={loading}
            className="text-sm px-3 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Refresh"}
          </button>
        </div>

        {loading && (
          <div className="text-sm opacity-70">Checking configuration...</div>
        )}

        {!loading && status && (
          <div className="space-y-4">
            {/* Status Indicators */}
            <div className="space-y-2">
              <StatusIndicator
                checked={status.apiKeyPresent}
                label={status.apiKeyPresent ? "API Key configured" : "API Key missing"}
              />
              <StatusIndicator
                checked={status.domainPresent}
                label={status.domainPresent ? "Domain configured" : "Domain missing"}
              />
              <StatusIndicator
                checked={status.fromEmailPresent}
                label={status.fromEmailPresent ? "From email configured" : "From email not set (will use default)"}
              />
              <StatusIndicator
                checked={status.configured}
                label={status.configured ? "Ready to send emails" : "Not configured"}
              />
            </div>

            {/* Configuration Details */}
            <div className="pt-4 border-t border-black/10 dark:border-white/15 space-y-2 text-sm">
              <div>
                <span className="opacity-70">API Key:</span>{" "}
                <code className="bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                  {status.apiKey || "Not set"}
                </code>
              </div>
              <div>
                <span className="opacity-70">Domain:</span>{" "}
                <code className="bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                  {status.domain || "Not set"}
                </code>
              </div>
              <div>
                <span className="opacity-70">From Email:</span>{" "}
                <code className="bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                  {status.fromEmail || "Not set"}
                </code>
              </div>
            </div>

            {!status.configured && (
              <div className="p-3 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm">
                <strong>Configuration incomplete.</strong> Set MAILGUN_API_KEY and MAILGUN_DOMAIN in your environment variables.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send Test Email Form */}
      {status?.configured && (
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-6">
          <h2 className="text-lg font-semibold mb-4">Send Test Email</h2>
          
          <form onSubmit={handleSendTest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                To Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject"
                className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Text Content <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Plain text email content"
                rows={6}
                className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs opacity-60 mt-1">This is the plain text version of the email.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                HTML Content <span className="opacity-60">(Optional)</span>
              </label>
              <textarea
                value={formData.html}
                onChange={(e) => setFormData({ ...formData, html: e.target.value })}
                placeholder="<h1>HTML email content</h1>"
                rows={6}
                className="w-full px-3 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs opacity-60 mt-1">Optional HTML version for rich formatting.</p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Sending..." : "Send Test Email"}
            </button>
          </form>

          {/* Send Result */}
          {sendResult && (
            <div
              className={`mt-4 p-3 rounded-md text-sm ${
                sendResult.success
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
              }`}
            >
              {sendResult.success ? (
                <div className="space-y-1">
                  <div><strong>✓ {sendResult.message}</strong></div>
                  {sendResult.messageId && (
                    <div className="text-xs opacity-80">
                      Message ID: <code className="bg-white/20 px-1 rounded">{sendResult.messageId}</code>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div><strong>✗ Failed to send email</strong></div>
                  {sendResult.error && <div>{sendResult.error}</div>}
                  {sendResult.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs">View details</summary>
                      <pre className="mt-2 text-xs overflow-auto bg-white/20 p-2 rounded">
                        {sendResult.details}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-6">
        <h2 className="text-lg font-semibold mb-3">Setup Instructions</h2>
        <div className="space-y-3 text-sm">
          <div>
            <strong className="block mb-1">Required environment variables:</strong>
            <ul className="list-disc pl-5 mt-1 opacity-80 space-y-1 font-mono text-xs">
              <li><code>MAILGUN_API_KEY</code> - Your Mailgun API key</li>
              <li><code>MAILGUN_DOMAIN</code> - Your Mailgun sending domain (e.g. mg.yourdomain.com)</li>
              <li><code>MAILGUN_FROM_EMAIL</code> - From email address (optional, defaults to no-reply@MAILGUN_DOMAIN)</li>
            </ul>
          </div>

          <div>
            <strong className="block mb-1">Get Mailgun credentials:</strong>
            <p className="opacity-80">
              Sign up at{" "}
              <a
                href="https://mailgun.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                mailgun.com
              </a>
              {" "}and get your API key and domain from the dashboard.
            </p>
          </div>

          <div>
            <strong className="block mb-1">Currently used for:</strong>
            <ul className="list-disc pl-5 mt-1 opacity-80 space-y-1">
              <li>Magic link authentication emails</li>
              <li>User notifications (future)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


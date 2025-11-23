"use client";

import { useState } from "react";

export default function AiTestPage() {
  const [loading, setLoading] = useState(false);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    requestId?: string;
    startedAt?: string;
    nodeEnv?: string;
    hasApiKey?: boolean;
    apiKeyPreview?: string | null;
    apiKeyLength?: number;
    openaiProjectPreview?: string | null;
    openaiProjectLength?: number;
  } | null>(null);

  async function handleSend() {
    console.groupCollapsed("[AI Test] Send test click");
    console.time("[AI Test] total");
    console.log("Preparing request...");
    setLoading(true);
    setError(null);
    setResponseText(null);
    setMeta(null);
    try {
      const payload = {};
      console.log("POST /api/ai/test", { payload });
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("Response", { ok: res.ok, status: res.status });
      const data = await res.json();
      console.log("JSON body", data);
      if (!res.ok || data?.error) {
        setError(data?.error || "Request failed");
        console.warn("Error from API", data?.error);
        return;
      }
      if (data?.meta) {
        setMeta(data.meta);
        console.log("Meta", data.meta);
      }
      setResponseText(typeof data?.content === "string" ? data.content : JSON.stringify(data));
    } catch (e) {
      setError((e as Error).message || "Unknown error");
      console.error("Unhandled error", e);
    } finally {
      setLoading(false);
      console.timeEnd("[AI Test] total");
      console.groupEnd();
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">OpenAI Connection Test</h1>
      <p className="text-sm text-gray-600 mb-6">
        Press the button to send a simple test request to OpenAI and display the response.
      </p>
      <button
        type="button"
        onClick={handleSend}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
      >
        <span className="text-xs font-bold">AI</span>
        {loading ? "Sending..." : "Send test"}
      </button>

      <div className="mt-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {responseText && !error && (
          <div className="rounded-md border border-gray-200 bg-white p-4 text-sm whitespace-pre-wrap">
            {responseText}
          </div>
        )}
        {meta && (
          <div className="mt-4 rounded-md border border-gray-200 bg-white p-4 text-sm">
            <div className="font-medium mb-2">Connection Details (redacted)</div>
            <dl className="space-y-1">
              <div className="flex gap-2">
                <dt className="text-gray-500 w-40">Request ID</dt>
                <dd className="text-gray-900">{meta.requestId || "-"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-40">Started</dt>
                <dd className="text-gray-900">{meta.startedAt || "-"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-40">Node Env</dt>
                <dd className="text-gray-900">{meta.nodeEnv || "-"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-40">Has API Key</dt>
                <dd className="text-gray-900">{String(meta.hasApiKey)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-40">API Key Preview</dt>
                <dd className="text-gray-900">
                  {meta.apiKeyPreview || "-"}{" "}
                  <span className="text-gray-500">(len {meta.apiKeyLength ?? 0})</span>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-40">Project Preview</dt>
                <dd className="text-gray-900">
                  {meta.openaiProjectPreview || "-"}{" "}
                  <span className="text-gray-500">(len {meta.openaiProjectLength ?? 0})</span>
                </dd>
              </div>
            </dl>
            <p className="text-xs text-gray-500 mt-2">
              Values are redacted on the server. Only previews are returned to the client.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}



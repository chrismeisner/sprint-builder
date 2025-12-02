"use client";

import { useState } from "react";
import Link from "next/link";

type Document = {
  id: string;
  filename: string | null;
  email: string | null;
  created_at: string;
  has_sprint: boolean;
};

type Props = {
  documents: Document[];
};

export default function AdminAiToolsClient({ documents }: Props) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<"gpt-4o-mini" | "gpt-4o">("gpt-4o-mini");
  const [results, setResults] = useState<Record<string, { success: boolean; sprintId?: string; error?: string }>>({});
  const [showOnlyWithoutSprints, setShowOnlyWithoutSprints] = useState(true);

  async function handleGenerateSprint(documentId: string) {
    setGeneratingId(documentId);
    setResults((prev) => ({ ...prev, [documentId]: undefined as any }));

    try {
      const res = await fetch(`/api/documents/${documentId}/sprint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResults((prev) => ({
          ...prev,
          [documentId]: { success: false, error: data.error || "Generation failed" },
        }));
      } else {
        setResults((prev) => ({
          ...prev,
          [documentId]: { success: true, sprintId: data.sprintDraftId },
        }));
        
        // Refresh the page to update sprint status
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [documentId]: { success: false, error: (error as Error).message },
      }));
    } finally {
      setGeneratingId(null);
    }
  }

  const filteredDocuments = showOnlyWithoutSprints
    ? documents.filter((doc) => !doc.has_sprint)
    : documents;

  return (
    <div className="container min-h-screen max-w-6xl py-10">
      {/* Admin Banner */}
      <div className="mb-6 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
          </svg>
          <div>
            <div className="font-semibold">Admin AI Sprint Generation Tool</div>
            <div className="text-sm opacity-90">Internal use only - Manually generate AI sprint drafts from intake documents</div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Sprint Generation</h1>
            <p className="text-sm opacity-70 mt-1">
              Generate sprint drafts from intake documents using OpenAI
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Model Selector */}
        <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] p-4">
          <div className="flex items-center gap-6">
            <label className="text-sm font-medium">OpenAI Model:</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="model"
                  value="gpt-4o-mini"
                  checked={selectedModel === "gpt-4o-mini"}
                  onChange={(e) => setSelectedModel(e.target.value as "gpt-4o-mini")}
                  className="w-4 h-4"
                />
                <span className="text-sm">gpt-4o-mini (faster, cheaper)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="model"
                  value="gpt-4o"
                  checked={selectedModel === "gpt-4o"}
                  onChange={(e) => setSelectedModel(e.target.value as "gpt-4o")}
                  className="w-4 h-4"
                />
                <span className="text-sm">gpt-4o (more accurate)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="filter-toggle"
            checked={showOnlyWithoutSprints}
            onChange={(e) => setShowOnlyWithoutSprints(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="filter-toggle" className="text-sm cursor-pointer">
            Show only documents without sprint drafts ({documents.filter((d) => !d.has_sprint).length})
          </label>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Documents ({filteredDocuments.length})
          </h2>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] p-8 text-center">
            <p className="text-sm opacity-70">
              {showOnlyWithoutSprints
                ? "All documents have sprint drafts! Toggle the filter to see all documents."
                : "No documents found."}
            </p>
          </div>
        )}

        {filteredDocuments.map((doc) => {
          const result = results[doc.id];
          const isGenerating = generatingId === doc.id;

          return (
            <div
              key={doc.id}
              className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="font-medium hover:underline"
                    >
                      {doc.filename || "Untitled Document"}
                    </Link>
                    {doc.has_sprint && (
                      <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 text-xs font-medium">
                        ✓ Has Sprint
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-60">
                    {doc.email && <span className="mr-3">📧 {doc.email}</span>}
                    <span>🕐 {new Date(doc.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-xs font-mono opacity-50">ID: {doc.id}</div>
                </div>

                <div className="flex items-center gap-2">
                  {doc.has_sprint ? (
                    <Link
                      href={`/documents/${doc.id}`}
                      className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/10 transition"
                    >
                      View Sprint
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleGenerateSprint(doc.id)}
                      disabled={isGenerating}
                      className="inline-flex items-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <span className="mr-1.5">✨</span>
                          Generate Sprint Draft
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Result Display */}
              {result && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    result.success
                      ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                      : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                  }`}
                >
                  {result.success ? (
                    <div className="flex items-center justify-between">
                      <span>✓ Sprint draft generated successfully!</span>
                      {result.sprintId && (
                        <Link
                          href={`/sprints/${result.sprintId}`}
                          className="underline font-medium hover:opacity-80"
                        >
                          View Sprint →
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div>✗ Error: {result.error}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="mt-8 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
        <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">ℹ️ How This Works</h3>
        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1.5">
          <li>• This tool manually generates AI sprint drafts from intake documents</li>
          <li>• OpenAI analyzes the Typeform submission and recommends sprint packages or deliverables</li>
          <li>• The AI uses the deliverables catalog and sprint packages from your database</li>
          <li>• An email notification is automatically sent to the client with their sprint draft link</li>
          <li>• This is for internal testing and manual sprint generation only</li>
        </ul>
      </div>
    </div>
  );
}


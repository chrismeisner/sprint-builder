"use client";

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
  // AI generation disabled; show status only
  const filteredDocuments = documents;

  return (
    <div className="container min-h-screen max-w-6xl py-10">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 012 0v5a1 1 0 01-.293.707l-2 2a1 1 0 01-1.414-1.414L9 10.586V5z" clipRule="evenodd" />
          </svg>
          <div>
            <h1 className="text-3xl font-bold">AI Sprint Generation</h1>
            <p className="text-sm opacity-70">AI generation is disabled. Status only.</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition w-fit"
        >
          ← Back to Dashboard
        </Link>
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
            <p className="text-sm opacity-70">No documents found.</p>
          </div>
        )}

        {filteredDocuments.map((doc) => (
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

              <div className="flex items-center gap-2 text-sm text-text-muted">AI disabled</div>
            </div>

            {/* Result Display intentionally removed while AI is disabled */}
          </div>
        ))}
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


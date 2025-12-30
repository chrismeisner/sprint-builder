"use client";

import Link from "next/link";
import { useState } from "react";

type DocumentRow = {
  id: string;
  content: unknown;
  filename: string | null;
  created_at: string | Date;
  typeformUrl: string | null;
};

type Props = {
  rows: DocumentRow[];
};

const MODEL_OPTIONS = [
  { value: "gpt-4o-mini", label: "gpt-4o-mini" },
  { value: "gpt-4o", label: "gpt-4o" },
];

export default function DocumentsClient({ rows }: Props) {
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0].value);

  return (
    <main className="min-h-screen max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Stored Typeform submissions</h1>
        <div className="text-sm opacity-70">AI generation disabled</div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm opacity-70">No documents yet.</p>
      ) : (
        <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/5 dark:bg-white/5 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">File</th>
                  <th className="px-4 py-3 font-semibold">Typeform</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-black/10 dark:border-white/10">
                    <td className="px-4 py-3 font-mono">
                      <span className="hidden sm:inline">{row.id}</span>
                      <span className="sm:hidden">{row.id.slice(0, 8)}…</span>
                    </td>
                    <td className="px-4 py-3">{new Date(row.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{row.filename ?? <span className="opacity-50">—</span>}</td>
                    <td className="px-4 py-3">
                      {row.typeformUrl ? (
                        <Link
                          href={row.typeformUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          View
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      ) : (
                        <span className="opacity-50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hoverbg-white/10 transition"
                          href={`/documents/${row.id}`}
                        >
                          View
                        </Link>
                        <span className="text-xs text-text-muted">AI disabled</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}



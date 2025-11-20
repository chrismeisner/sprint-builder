"use client";

import Link from "next/link";
import { useState } from "react";
import CreateSprintButton from "./CreateSprintButton";

type DocumentRow = {
  id: string;
  content: unknown;
  filename: string | null;
  created_at: string | Date;
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
        <div className="flex items-center gap-2">
          <label htmlFor="model" className="text-sm opacity-80">
            Model
          </label>
          <select
            id="model"
            className="text-sm rounded-md border border-black/10 dark:border-white/15 px-2 py-1 bg-transparent"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
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
                      <div className="flex items-center gap-2">
                        <Link
                          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition"
                          href={`/documents/${row.id}`}
                        >
                          View
                        </Link>
                        <CreateSprintButton documentId={row.id} model={model} />
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



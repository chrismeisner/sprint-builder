"use client";

import { useState } from "react";
import Link from "next/link";

type IntakeForm = {
  id: string;
  filename: string | null;
  email: string | null;
  accountName: string | null;
  createdAt: string;
  preview: string | null;
};

type Props = {
  intakeForms: IntakeForm[];
};

export default function IntakeFormsClient({ intakeForms }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredForms = intakeForms.filter((form) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      form.email?.toLowerCase().includes(search) ||
      form.accountName?.toLowerCase().includes(search) ||
      form.preview?.toLowerCase().includes(search) ||
      form.id.toLowerCase().includes(search)
    );
  });

  // Separate manual sprint placeholders from real intake forms
  const realIntakeForms = filteredForms.filter(
    (f) => !f.preview?.startsWith("Manual")
  );

  return (
    <main className="min-h-screen max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Intake Forms</h1>
          <p className="text-sm opacity-70 mt-1">
            View submissions from Typeform and other intake sources
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
          <div className="text-2xl font-bold">{realIntakeForms.length}</div>
          <div className="text-xs opacity-70">Intake Forms</div>
        </div>
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
          <div className="text-2xl font-bold">
            {realIntakeForms.filter((f) => f.email).length}
          </div>
          <div className="text-xs opacity-70">With Email</div>
        </div>
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
          <div className="text-2xl font-bold">{intakeForms.length}</div>
          <div className="text-xs opacity-70">Total Documents</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by email, name, or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black text-sm"
        />
      </div>

      {/* Results count */}
      <div className="text-sm opacity-70">
        Showing {realIntakeForms.length} intake forms
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Preview</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Account</th>
                <th className="px-4 py-3 text-left font-semibold">Received</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {realIntakeForms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center opacity-70">
                    No intake forms found.
                  </td>
                </tr>
              ) : (
                realIntakeForms.map((form) => (
                  <tr
                    key={form.id}
                    className="border-t border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {form.preview || (
                          <span className="opacity-50 italic">No preview</span>
                        )}
                      </div>
                      <div className="text-xs font-mono opacity-50 mt-0.5">
                        {form.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {form.email ? (
                        <a
                          href={`mailto:${form.email}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {form.email}
                        </a>
                      ) : (
                        <span className="opacity-50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {form.accountName || <span className="opacity-50">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div>{new Date(form.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs opacity-60">
                        {new Date(form.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/intake-forms/${form.id}`}
                        className="inline-flex items-center px-3 py-1 rounded bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition text-xs"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] p-4">
        <h3 className="font-semibold mb-2">How Intake Forms Work</h3>
        <ul className="text-sm opacity-70 space-y-1">
          <li>
            • Typeform webhooks post to <code className="bg-black/10 dark:bg-white/10 px-1 rounded">/api/documents</code>
          </li>
          <li>• Submissions are saved and a confirmation email is sent to the submitter</li>
          <li>• Review submissions here, then reach out to discuss their project</li>
          <li>• Use the Sprint Builder to create sprints after your discovery call</li>
        </ul>
      </div>
    </main>
  );
}

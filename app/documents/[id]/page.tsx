import { ensureSchema, getPool } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function DocumentDetailPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, content, filename, created_at FROM documents WHERE id = $1`,
    [params.id]
  );
  if (result.rowCount === 0) {
    notFound();
  }
  const row = result.rows[0] as {
    id: string;
    content: unknown;
    filename: string | null;
    created_at: string | Date;
  };

  const sprintsRes = await pool.query(
    `SELECT id, created_at FROM sprint_drafts WHERE document_id = $1 ORDER BY created_at DESC`,
    [params.id]
  );
  const sprintDrafts = sprintsRes.rows as Array<{ id: string; created_at: string | Date }>;

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-sans)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Submission details</h1>
        <Link
          href="/documents"
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
        >
          Back to list
        </Link>
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-2 text-sm">
        <div>
          <span className="font-mono opacity-70">id:</span> {row.id}
        </div>
        <div>
          <span className="font-mono opacity-70">created:</span>{" "}
          {new Date(row.created_at).toLocaleString()}
        </div>
        <div>
          <span className="font-mono opacity-70">file:</span>{" "}
          {row.filename ?? <span className="opacity-50">—</span>}
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-2">Sprint drafts</h2>
        {sprintDrafts.length === 0 ? (
          <p className="text-sm opacity-70">No sprint drafts yet. Use &quot;Create Sprint&quot; from the documents list.</p>
        ) : (
          <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-black/5 dark:bg-white/5 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sprintDrafts.map((s) => (
                    <tr key={s.id} className="border-t border-black/10 dark:border-white/10">
                      <td className="px-4 py-3 font-mono">
                        <span className="hidden sm:inline">{s.id}</span>
                        <span className="sm:hidden">{s.id.slice(0, 8)}…</span>
                      </td>
                      <td className="px-4 py-3">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Link
                          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition"
                          href={`/sprints/${s.id}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Raw content</h2>
        <pre className="text-xs overflow-x-auto bg-black/5 dark:bg-white/5 rounded p-3">
{JSON.stringify(row.content, null, 2)}
        </pre>
      </section>
    </main>
  );
}



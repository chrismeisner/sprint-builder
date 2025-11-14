import { ensureSchema, getPool } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function SprintDetailPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `SELECT sd.id, sd.document_id, sd.ai_response_id, sd.draft, sd.created_at
     FROM sprint_drafts sd
     WHERE sd.id = $1`,
    [params.id]
  );
  if (result.rowCount === 0) {
    notFound();
  }
  const row = result.rows[0] as {
    id: string;
    document_id: string;
    ai_response_id: string | null;
    draft: unknown;
    created_at: string | Date;
  };

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-sans)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Sprint draft</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/documents/${row.document_id}`}
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
          >
            Back to document
          </Link>
          <Link
            href="/documents"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
          >
            Documents
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-2 text-sm">
        <div>
          <span className="font-mono opacity-70">id:</span> {row.id}
        </div>
        <div>
          <span className="font-mono opacity-70">document:</span> {row.document_id}
        </div>
        <div>
          <span className="font-mono opacity-70">ai response:</span>{" "}
          {row.ai_response_id ?? <span className="opacity-50">—</span>}
        </div>
        <div>
          <span className="font-mono opacity-70">created:</span>{" "}
          {new Date(row.created_at).toLocaleString()}
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-2">Draft JSON</h2>
        <pre className="text-xs overflow-x-auto bg-black/5 dark:bg-white/5 rounded p-3">
{JSON.stringify(row.draft, null, 2)}
        </pre>
      </section>
    </main>
  );
}



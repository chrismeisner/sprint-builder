import { ensureSchema, getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, content, filename, created_at FROM documents ORDER BY created_at DESC LIMIT 50`
  );

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-2xl sm:text-3xl font-bold">Stored Typeform submissions</h1>
      {result.rows.length === 0 ? (
        <p className="text-sm opacity-70">No documents yet.</p>
      ) : (
        <ul className="space-y-4">
          {result.rows.map((row: any) => (
            <li key={row.id} className="rounded-lg border border-black/10 dark:border-white/15 p-4">
              <div className="mb-2 text-sm opacity-70">
                <span className="font-mono">id:</span> {row.id} •{" "}
                <span className="font-mono">created:</span>{" "}
                {new Date(row.created_at).toLocaleString()}{" "}
                {row.filename ? <>• <span className="font-mono">file:</span> {row.filename}</> : null}
              </div>
              <pre className="text-xs overflow-x-auto bg-black/5 dark:bg-white/5 rounded p-3">
                {JSON.stringify(row.content, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}



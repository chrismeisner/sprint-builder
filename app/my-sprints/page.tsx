import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureSchema, getPool } from "@/lib/db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Row = {
  sprint_id: string;
  sprint_created_at: string | Date;
  document_id: string;
  document_created_at: string | Date;
  email: string | null;
};

export default async function MySprintsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session) {
    redirect("/login");
  }

  await ensureSchema();
  const pool = getPool();
  const res = await pool.query(
    `
      SELECT
        sd.id AS sprint_id,
        sd.created_at AS sprint_created_at,
        d.id AS document_id,
        d.created_at AS document_created_at,
        d.email AS email
      FROM sprint_drafts sd
      JOIN documents d ON sd.document_id = d.id
      WHERE d.account_id = $1
      ORDER BY sd.created_at DESC
    `,
    [session.accountId]
  );
  const rows = res.rows as Row[];

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-6 font-[family-name:var(--font-geist-sans)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">My sprints</h1>
        <Link
          href="/profile"
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
        >
          Go to Profile
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm opacity-70">
          You don&apos;t have any sprint drafts yet. Once a sprint is created, it will appear here.
        </p>
      ) : (
        <section className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-black/5 dark:bg-white/5 text-left">
                <tr>
                  <th className="px-4 py-2 font-semibold">Sprint</th>
                  <th className="px-4 py-2 font-semibold">Created</th>
                  <th className="px-4 py-2 font-semibold">Email</th>
                  <th className="px-4 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.sprint_id} className="border-t border-black/10 dark:border-white/10">
                    <td className="px-4 py-2 font-mono">
                      <span className="hidden sm:inline">{row.sprint_id}</span>
                      <span className="sm:hidden">{row.sprint_id.slice(0, 8)}…</span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(row.sprint_created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {row.email ?? <span className="opacity-50">—</span>}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/sprints/${row.sprint_id}`}
                        className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        View sprint
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}



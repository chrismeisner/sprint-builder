import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema, getPool } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function IntakeFormDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  await ensureSchema();
  const pool = getPool();

  const result = await pool.query(
    `SELECT 
      d.id,
      d.filename,
      d.email,
      d.content,
      d.created_at,
      d.account_id,
      a.name as account_name
     FROM documents d
     LEFT JOIN accounts a ON d.account_id = a.id
     WHERE d.id = $1`,
    [params.id]
  );

  if (result.rowCount === 0) {
    notFound();
  }

  const row = result.rows[0] as {
    id: string;
    filename: string | null;
    email: string | null;
    content: unknown;
    created_at: string;
    account_id: string | null;
    account_name: string | null;
  };

  // Extract useful data from Typeform content
  const extractedData = extractTypeformData(row.content);

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Intake Form Details</h1>
        <Link
          href="/dashboard/intake-forms"
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
        >
          ← Back to list
        </Link>
      </div>

      {/* Basic Info */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3">
        <h2 className="text-lg font-semibold">Submission Info</h2>
        <div className="grid gap-2 text-sm">
          <div>
            <span className="font-mono opacity-70">id:</span> {row.id}
          </div>
          <div>
            <span className="font-mono opacity-70">received:</span>{" "}
            {new Date(row.created_at).toLocaleString()}
          </div>
          {row.email && (
            <div>
              <span className="font-mono opacity-70">email:</span>{" "}
              <a
                href={`mailto:${row.email}`}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {row.email}
              </a>
            </div>
          )}
          {row.account_name && (
            <div>
              <span className="font-mono opacity-70">account:</span>{" "}
              {row.account_name}
            </div>
          )}
          {row.filename && (
            <div>
              <span className="font-mono opacity-70">filename:</span>{" "}
              {row.filename}
            </div>
          )}
        </div>
      </div>

      {/* Extracted Answers */}
      {extractedData.answers.length > 0 && (
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3">
          <h2 className="text-lg font-semibold">Form Responses</h2>
          <div className="space-y-4">
            {extractedData.answers.map((answer, i) => (
              <div key={i} className="border-b border-black/5 dark:border-white/5 pb-3 last:border-0 last:pb-0">
                <div className="text-sm font-medium text-text-muted mb-1">
                  {answer.question}
                </div>
                <div className="text-sm">
                  {answer.value || <span className="opacity-50 italic">No response</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3">
        <h2 className="text-lg font-semibold">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {row.email && (
            <a
              href={`mailto:${row.email}?subject=Re: Your project inquiry`}
              className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 hover:opacity-90 transition text-sm"
            >
              Email {row.email.split("@")[0]}
            </a>
          )}
          <Link
            href="/dashboard/sprint-builder"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition text-sm"
          >
            Open Sprint Builder
          </Link>
        </div>
      </div>

      {/* Raw JSON */}
      <details className="rounded-lg border border-black/10 dark:border-white/15 p-4">
        <summary className="text-lg font-semibold cursor-pointer">
          Raw JSON Content
        </summary>
        <pre className="text-xs overflow-x-auto bg-black/5 dark:bg-white/5 rounded p-3 mt-3">
          {JSON.stringify(row.content, null, 2)}
        </pre>
      </details>
    </main>
  );
}

/**
 * Extract human-readable data from Typeform content
 */
function extractTypeformData(content: unknown): {
  answers: Array<{ question: string; value: string }>;
} {
  const answers: Array<{ question: string; value: string }> = [];

  if (!content || typeof content !== "object") {
    return { answers };
  }

  const root = content as Record<string, unknown>;

  // Typeform format
  const formResponse = root.form_response as unknown;
  if (formResponse && typeof formResponse === "object") {
    const fr = formResponse as {
      answers?: unknown[];
      definition?: { fields?: unknown[] };
    };

    // Build field ID to title map
    const fieldTitles = new Map<string, string>();
    if (fr.definition?.fields && Array.isArray(fr.definition.fields)) {
      for (const field of fr.definition.fields) {
        if (field && typeof field === "object") {
          const f = field as { id?: string; title?: string };
          if (f.id && f.title) {
            fieldTitles.set(f.id, f.title);
          }
        }
      }
    }

    // Extract answers
    if (Array.isArray(fr.answers)) {
      for (const ans of fr.answers) {
        if (!ans || typeof ans !== "object") continue;

        const answer = ans as {
          type?: string;
          text?: string;
          email?: string;
          number?: number;
          boolean?: boolean;
          choice?: { label?: string };
          choices?: { labels?: string[] };
          field?: { id?: string };
        };

        const fieldId = answer.field?.id;
        const question = fieldId
          ? fieldTitles.get(fieldId) || `Question ${fieldId}`
          : "Unknown Question";

        let value = "";

        switch (answer.type) {
          case "text":
          case "long_text":
            value = answer.text || "";
            break;
          case "email":
            value = answer.email || "";
            break;
          case "number":
            value = answer.number?.toString() || "";
            break;
          case "boolean":
            value = answer.boolean ? "Yes" : "No";
            break;
          case "choice":
            value = answer.choice?.label || "";
            break;
          case "choices":
            value = answer.choices?.labels?.join(", ") || "";
            break;
          default:
            value = JSON.stringify(answer);
        }

        if (value) {
          answers.push({ question, value });
        }
      }
    }
  }

  return { answers };
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema, getPool } from "@/lib/db";
import IntakeFormsClient from "./IntakeFormsClient";

export const dynamic = "force-dynamic";

export default async function IntakeFormsPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  await ensureSchema();
  const pool = getPool();

  // Fetch recent intake forms (documents)
  const result = await pool.query(
    `SELECT 
      d.id,
      d.filename,
      d.email,
      d.content,
      d.created_at,
      a.name as account_name
     FROM documents d
     LEFT JOIN accounts a ON d.account_id = a.id
     ORDER BY d.created_at DESC
     LIMIT 100`
  );

  const intakeForms = result.rows.map((row) => ({
    id: row.id as string,
    filename: row.filename as string | null,
    email: row.email as string | null,
    accountName: row.account_name as string | null,
    createdAt: new Date(row.created_at as string).toISOString(),
    // Extract some useful info from the content
    preview: extractPreview(row.content),
  }));

  return <IntakeFormsClient intakeForms={intakeForms} />;
}

/**
 * Extract a preview/summary from Typeform content
 */
function extractPreview(content: unknown): string | null {
  if (!content || typeof content !== "object") return null;
  const root = content as Record<string, unknown>;

  // Typeform: try to extract project name or first text answer
  const formResponse = root.form_response as unknown;
  if (formResponse && typeof formResponse === "object") {
    const fr = formResponse as { answers?: unknown[] };
    if (Array.isArray(fr.answers)) {
      for (const ans of fr.answers) {
        if (ans && typeof ans === "object") {
          const a = ans as { type?: string; text?: string };
          if (a.type === "text" && a.text) {
            return a.text.slice(0, 100) + (a.text.length > 100 ? "..." : "");
          }
        }
      }
    }
  }

  return "Intake form submission";
}

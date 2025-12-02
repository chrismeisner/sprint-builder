import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema, getPool } from "@/lib/db";
import AdminAiToolsClient from "./AdminAiToolsClient";

export const dynamic = "force-dynamic";

type Document = {
  id: string;
  filename: string | null;
  email: string | null;
  created_at: string;
  has_sprint: boolean;
};

export default async function AdminAiToolsPage() {
  // Admin-only protection
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  await ensureSchema();
  const pool = getPool();

  // Fetch documents with sprint draft status
  const result = await pool.query<Document>(`
    SELECT 
      d.id,
      d.filename,
      d.email,
      d.created_at,
      EXISTS(SELECT 1 FROM sprint_drafts sd WHERE sd.document_id = d.id) as has_sprint
    FROM documents d
    ORDER BY d.created_at DESC
    LIMIT 50
  `);

  const documents = result.rows;

  return <AdminAiToolsClient documents={documents} />;
}



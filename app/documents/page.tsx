import { ensureSchema, getPool } from "@/lib/db";
import DocumentsClient from "./DocumentsClient";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, content, filename, created_at FROM documents ORDER BY created_at DESC LIMIT 50`
  );
  type DocumentRow = {
    id: string;
    content: unknown;
    filename: string | null;
    created_at: string | Date;
  };
  const rows = result.rows as DocumentRow[];

  return (
    <DocumentsClient rows={rows} />
  );
}



import DeferredCompensationClient from "./DeferredCompensationClient";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type SprintOption = {
  id: string;
  label: string;
};

async function loadSprintOptions(accountId: string): Promise<SprintOption[]> {
  await ensureSchema();
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT 
        sd.id,
        COALESCE(NULLIF(sd.title, ''), 'Sprint ' || LEFT(sd.id, 8)) AS label
      FROM sprint_drafts sd
      JOIN documents d ON sd.document_id = d.id
      WHERE d.account_id = $1
      ORDER BY sd.created_at DESC
    `,
    [accountId]
  );

  return result.rows.map((row) => ({
    id: row.id as string,
    label: row.label as string,
  }));
}

export default async function DeferredCompensationPage({ searchParams }: { searchParams?: { sprintId?: string; amount?: string } }) {
  const user = await getCurrentUser();
  const sprintOptions = user ? await loadSprintOptions(user.accountId) : [];
  const sprintIdFromQuery = searchParams?.sprintId || null;
  const amountFromQuery = searchParams?.amount || null;

  return (
    <DeferredCompensationClient
      sprintOptions={sprintOptions}
      isLoggedIn={Boolean(user)}
      defaultSprintId={sprintIdFromQuery || undefined}
      defaultAmount={amountFromQuery ? Number(amountFromQuery) : undefined}
    />
  );
}


import DeferredCompensationClient from "./DeferredCompensationClient";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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

type DeferredCompSearchParams = {
  sprintId?: string;
  amount?: string;
  projectValue?: string;
  amountCents?: string;
  projectValueCents?: string;
};

function parseAmount(searchParams?: DeferredCompSearchParams): number | null {
  if (!searchParams) return null;

  // Highest priority: explicit cents params
  const centsParam = searchParams.projectValueCents ?? searchParams.amountCents;
  if (typeof centsParam === "string") {
    const cents = Number(centsParam);
    if (Number.isFinite(cents)) {
      return cents / 100;
    }
  }

  // Next: dollar params (projectValue preferred over amount)
  const dollarParam = searchParams.projectValue ?? searchParams.amount;
  if (typeof dollarParam === "string") {
    const isCentsLike = /^\d+$/.test(dollarParam);
    const num = Number(dollarParam);
    if (Number.isFinite(num)) {
      // If it's an integer with no decimal point, interpret as cents for backwards-compatible support of ?amount=848750 -> $8,487.50
      return isCentsLike ? num / 100 : num;
    }
  }

  return null;
}

export default async function DeferredCompensationPage({ searchParams }: { searchParams?: DeferredCompSearchParams }) {
  const user = await getCurrentUser();
  const sprintOptions = user ? await loadSprintOptions(user.accountId) : [];
  const sprintIdFromQuery = searchParams?.sprintId || null;
  const amountFromQuery = parseAmount(searchParams);

  return (
    <DeferredCompensationClient
      sprintOptions={sprintOptions}
      isLoggedIn={Boolean(user)}
      defaultSprintId={sprintIdFromQuery || undefined}
      defaultAmount={amountFromQuery ?? undefined}
    />
  );
}


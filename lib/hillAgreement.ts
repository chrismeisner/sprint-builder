import type { Pool } from "pg";

// Hill-native agreement generator (Path A). Produces a fixed-scope services
// agreement in Markdown from a client hill and its priced deliverables. This is
// the simplified successor to the sprint generate-agreement template — no
// deferred-comp / points-scoring variants (those are retired), just a clean
// fixed-fee engagement derived from the hill's deliverables + total.

type AgreementDeliverable = {
  name: string | null;
  deliverable_scope: string | null;
  description: string | null;
  price: string | number | null;
  quantity: number | null;
};

export type AgreementInputs = {
  hillTitle: string | null;
  projectName: string | null;
  clientName: string;
  clientTitle: string;
  deliverables: AgreementDeliverable[];
  startDate: Date | string | null;
  targetDate: Date | string | null;
};

const STUDIO_LEGAL_NAME = "Chris Meisner LLC";

function fmtMoney(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtDate(d: Date | string | null): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function buildAgreementMarkdown(input: AgreementInputs): string {
  const num = (v: unknown) => (v == null ? 0 : Number(v));
  const lines = input.deliverables.map((d) => {
    const qty = Number(d.quantity) || 1;
    const lineTotal = num(d.price) * qty;
    const scope = (d.deliverable_scope || d.description || "").replace(/\n/g, " <br> ").trim() || "—";
    const name = (d.name || "Untitled").trim();
    const label = qty > 1 ? `${name} (×${qty})` : name;
    return { label, scope, lineTotal };
  });
  const total = lines.reduce((s, l) => s + l.lineTotal, 0);

  const tableRows = lines
    .map((l) => `| ${l.label} | ${l.scope} | ${fmtMoney(l.lineTotal)} |`)
    .join("\n");
  const deliverablesTable = lines.length
    ? `| Deliverable | Scope | Fee |\n| --- | --- | ---: |\n${tableRows}\n| **Total** | | **${fmtMoney(total)}** |`
    : "_No deliverables scoped yet._";

  const engagementName = input.hillTitle || input.projectName || "Design Engagement";
  const client = input.clientName || input.projectName || "Client";
  const startStr = fmtDate(input.startDate);
  const targetStr = fmtDate(input.targetDate);
  const timeline =
    startStr && targetStr
      ? `Work is scheduled to begin on **${startStr}** and target completion on **${targetStr}**.`
      : targetStr
        ? `Target completion: **${targetStr}**.`
        : "Timeline to be confirmed by both parties at kickoff.";

  return `# Services Agreement — ${engagementName}

This Services Agreement (the "Agreement") is entered into between **${STUDIO_LEGAL_NAME}** ("Studio") and **${client}** ("Client").

## 1. Scope of Work

The Studio will deliver the following deliverables for the fixed fees shown:

${deliverablesTable}

## 2. Fees & Payment

The total fixed fee for this engagement is **${fmtMoney(total)}**. Fees are invoiced through the Studio's billing system and payable via the invoice links provided. Work commences upon acceptance of this Agreement; invoices are due per the terms stated on each invoice.

## 3. Timeline

${timeline} Timelines assume timely Client feedback and asset delivery; delays in either may extend the schedule accordingly.

## 4. Intellectual Property

Upon full payment, the Studio assigns to the Client all right, title, and interest in the final delivered work product. The Studio retains the right to display the work in its portfolio unless otherwise agreed in writing.

## 5. Confidentiality

Each party will keep confidential any non-public information disclosed by the other in connection with this engagement.

## 6. Warranties & Liability

The Studio will perform the services in a professional and workmanlike manner. Except as expressly stated, the services are provided "as is." Neither party is liable for indirect or consequential damages.

## 7. Termination

Either party may terminate this Agreement with written notice. Upon termination, the Client will pay for all work performed and invoiced through the termination date.

## 8. Acceptance

By accepting this Agreement (electronically or in writing), the parties agree to its terms.

**${STUDIO_LEGAL_NAME}**

Signature: ______________________  Date: ____________

**${client}**${input.clientTitle ? `  —  ${input.clientTitle}` : ""}

Signature: ______________________  Date: ____________
`;
}

// Load the hill + client + priced deliverables needed to generate an agreement.
export async function loadAgreementInputs(
  pool: Pool,
  hillId: string
): Promise<AgreementInputs | null> {
  const hillRes = await pool.query(
    `SELECT h.id, h.title, h.start_date, h.target_date, h.project_id, p.name AS project_name
       FROM hills h LEFT JOIN projects p ON p.id = h.project_id
      WHERE h.id = $1`,
    [hillId]
  );
  if (hillRes.rowCount === 0) return null;
  const hill = hillRes.rows[0];

  const delRes = await pool.query(
    `SELECT name, deliverable_scope, description, price, quantity
       FROM hill_deliverables
      WHERE hill_id = $1 AND dismissed_at IS NULL
      ORDER BY sort_order, created_at`,
    [hillId]
  );

  let clientName = "";
  let clientTitle = "";
  if (hill.project_id) {
    const memberRes = await pool.query(
      `SELECT pm.email, pm.title, a.name, a.first_name, a.last_name
         FROM project_members pm
         LEFT JOIN accounts a ON lower(pm.email) = lower(a.email)
        WHERE pm.project_id = $1
        ORDER BY pm.created_at ASC LIMIT 1`,
      [hill.project_id]
    );
    if (memberRes.rowCount) {
      const m = memberRes.rows[0];
      clientName =
        m.first_name && m.last_name
          ? `${m.first_name} ${m.last_name}`
          : m.name || (m.email ? String(m.email).split("@")[0] : "");
      clientTitle = m.title || "Authorized Representative";
    }
  }

  return {
    hillTitle: hill.title ?? null,
    projectName: hill.project_name ?? null,
    clientName,
    clientTitle,
    deliverables: delRes.rows,
    startDate: hill.start_date ?? null,
    targetDate: hill.target_date ?? null,
  };
}

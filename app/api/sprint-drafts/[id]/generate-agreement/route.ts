import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { POINT_PRICE_PER_POINT } from "@/lib/pricing";

type Params = { params: { id: string } };

// Budget plan types
type BudgetInputs = {
  isDeferred?: boolean;
  totalProjectValue?: number;
  upfrontPayment?: number;
  upfrontPaymentTiming?: string;
  equitySplit?: number;
  milestones?: Array<{ id: number; summary: string; multiplier: number; date: string }>;
  milestoneMissOutcome?: string;
};

// Payment timing display text
const PAYMENT_TIMING_TEXT: Record<string, string> = {
  "on_start": "Due upon signing of this agreement",
  "net7": "Within 7 calendar days of final deliverable delivery (Net 7)",
  "net14": "Within 14 calendar days of final deliverable delivery (Net 14)",
  "net30": "Within 30 calendar days of final deliverable delivery (Net 30)",
};

type BudgetOutputs = {
  upfrontAmount?: number;
  equityAmount?: number;
  deferredAmount?: number;
  milestoneBonusAmount?: number;
  remainingOnCompletion?: number;
  totalProjectValue?: number;
};

// Agreement template structure based on the provided example
const AGREEMENT_TEMPLATE = `# {sprintTitle} Agreement

This Agreement is entered into as of the Effective Date below between:

**Chris Meisner LLC** ("Designer"), a limited liability company providing design services, and

**{clientCompany}** ("Client"){clientDescription}.

---

## 1. Overview of Engagement

Chris Meisner LLC will deliver a defined set of brand and design deliverables as part of a structured sprint, scoped collaboratively with the Client. Deliverables, pricing, and terms are set forth below.

**Sprint Start Date:** {startDate}
**Sprint Due Date:** {dueDate}

---

## 2. Deliverables & Scope

The following deliverables are included in this sprint, calculated using a point-based pricing system at \$${POINT_PRICE_PER_POINT.toLocaleString()} per point:

{deliverablesTable}

**Total Points:** {totalPoints}
**Per Point Rate:** \$${POINT_PRICE_PER_POINT.toLocaleString()}
**Total Sprint Fee:** {totalPriceFormatted}

---

## 3. Payment Terms

**Total Amount Due:** {totalPriceFormatted}
**Payment Due Date:** {paymentDueDate}

All payments are to be made in USD via bank transfer, ACH, or other mutually agreed method.

Note: The final amount includes any applicable fees, rounding, or adjustments.

{compensationStructureSection}

---

## 4. Intellectual Property (IP) & Licensing

All deliverables are custom-created and, upon full payment, the Client will receive full ownership and rights to use, modify, and distribute them as they see fit.

Until full payment is received:
- The Client is granted a limited, non-exclusive license to use the deliverables internally or for exploration purposes for up to 30 days after delivery.
- Ownership remains with Chris Meisner LLC during this period.
- If payment is not made within the 30-day window, the license is revoked and further use constitutes infringement.

---

## 5. Scope Changes

This Agreement covers only the deliverables listed above. Any additional features, revisions, or new deliverables will be scoped and billed separately, either via a new sprint or an addendum to this agreement.

---

## 6. Termination

Either party may terminate this agreement with written notice. In the event of termination:
- The Get Started Fee is retained by Chris Meisner LLC (if applicable).
- Any work completed up to the point of termination will be invoiced proportionally based on the point system.
- If no deliverables are delivered, no IP rights transfer occurs.

---

## 7. Miscellaneous

**Independent Contractor:** Chris Meisner LLC is an independent contractor, not an employee.

**Confidentiality:** Both parties agree to keep all project information confidential.

**Portfolio Use:** Client grants Designer permission to display deliverables and a brief case study for portfolio/marketing purposes after Client's public launch (or 30 days after final delivery), provided Designer does not share confidential information and will remove content upon reasonable written request.

**Jurisdiction:** This agreement is governed by the laws of the Commonwealth of Pennsylvania.

---

## 8. Signatures

By signing below, both parties agree to the terms of this agreement.

**Chris Meisner LLC**
Name: Chris Meisner
Title: Principal

**{clientCompany}**
Name: {clientName}
Company: {clientCompanyFull}
Title: {clientTitle}
`;

// Compensation section is now built dynamically in buildCompensationSection()

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "TBD";
  const date = typeof dateStr === "string" ? new Date(dateStr + "T00:00:00") : dateStr;
  return date.toLocaleDateString("en-US", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMilestoneDate(dateStr: string): string {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });
}

// Map milestone miss outcome to human-readable text
const MILESTONE_MISS_OUTCOMES: Record<string, string> = {
  "forgiven": "If no milestones are achieved, the deferred payment obligation will be **forgiven entirely**. The Designer accepts the risk that Client may not meet growth targets.",
  "reduced-50": "If no milestones are achieved, the deferred payment will be **reduced to 50%** of the base amount ({reducedAmount}).",
  "reduced-20": "If no milestones are achieved, the deferred payment will be **reduced to 20%** of the base amount ({reducedAmount}).",
  "still-owed": "If no milestones are achieved, the **full deferred payment (100%)** of {deferredAmount} remains owed to the Designer.",
  "renegotiate": "If no milestones are achieved, the parties agree to **renegotiate the deferred payment terms in good faith** within 30 days of the final milestone target date.",
};

// Short upfront payment timing text for compensation section
const UPFRONT_TIMING_SHORT: Record<string, string> = {
  "on_start": "is due upon signing of this agreement",
  "net7": "is due within 7 days of final deliverable delivery",
  "net14": "is due within 14 days of final deliverable delivery",
  "net30": "is due within 30 days of final deliverable delivery",
};

function buildCompensationSection(
  inputs: BudgetInputs,
  outputs: BudgetOutputs
): string {
  const upfrontPayment = inputs.upfrontPayment ?? 0.4;
  const upfrontTiming = inputs.upfrontPaymentTiming ?? "net30";
  const upfrontTimingText = UPFRONT_TIMING_SHORT[upfrontTiming] ?? UPFRONT_TIMING_SHORT["net30"];
  const isDeferred = inputs.isDeferred !== false; // default true for backwards compat
  const remainingPercent = 1 - upfrontPayment;

  const upfrontAmount = outputs.upfrontAmount ?? 0;

  // ── NOT DEFERRED: simple kickoff + completion structure ──
  if (!isDeferred) {
    const remainingAmount = outputs.remainingOnCompletion ?? (remainingPercent * (outputs.totalProjectValue ?? upfrontAmount));
    const kickoffPercent = `${Math.round(upfrontPayment * 100)}%`;
    const completionPercent = `${Math.round(remainingPercent * 100)}%`;

    if (remainingPercent < 0.01) {
      // 100% kickoff
      return `
---

## 3a. Compensation Structure

**Full Payment on Kickoff:** The total sprint fee of ${formatCurrency(upfrontAmount)} ${upfrontTimingText}.`;
    }

    return `
---

## 3a. Compensation Structure

This engagement uses a standard payment structure with no deferred compensation component:

### Payment Breakdown

| Component | Percentage | Amount |
|-----------|------------|--------|
| Kickoff Payment | ${kickoffPercent} | ${formatCurrency(upfrontAmount)} |
| Due on Completion | ${completionPercent} | ${formatCurrency(remainingAmount)} |

**Kickoff Payment** of ${formatCurrency(upfrontAmount)} ${upfrontTimingText}.

**Completion Payment** of ${formatCurrency(remainingAmount)} is due upon delivery and acceptance of all deliverables listed in Section 2.`;
  }

  // ── DEFERRED: full deferred compensation structure ──
  const equitySplit = inputs.equitySplit ?? 0;
  const equityAmount = outputs.equityAmount ?? 0;
  const deferredAmount = outputs.deferredAmount ?? 0;

  // If all payment is upfront (no deferred component), return a simplified section
  const hasDeferred = deferredAmount > 0.01; // Use small threshold to handle floating point
  const hasEquity = equityAmount > 0.01;
  
  if (!hasDeferred && !hasEquity) {
    // 100% upfront - return simplified section
    return `
---

## 3a. Compensation Structure

**Full Payment Upfront:** The total sprint fee of ${formatCurrency(upfrontAmount)} ${upfrontTimingText}.`;
  }
  
  // Calculate percentages
  const upfrontPercent = `${Math.round(upfrontPayment * 100)}%`;
  const equityPercent = `${Math.round(remainingPercent * equitySplit * 100)}%`;
  const deferredPercent = `${Math.round(remainingPercent * (1 - equitySplit) * 100)}%`;
  
  // Build payment breakdown table rows
  let paymentRows = `| Upfront Payment | ${upfrontPercent} | ${formatCurrency(upfrontAmount)} |`;
  
  if (hasEquity) {
    paymentRows += `\n| Equity Component | ${equityPercent} | ${formatCurrency(equityAmount)} |`;
  }
  
  if (hasDeferred) {
    paymentRows += `\n| Deferred Payment (Base) | ${deferredPercent} | ${formatCurrency(deferredAmount)} |`;
  }
  
  // Build equity terms section (only if equity > 0)
  const equityTerms = hasEquity
    ? `\n**Equity Component** of ${formatCurrency(equityAmount)} represents a stake in the Client's company, subject to separate equity documentation.\n`
    : "";
  
  // Build milestones section (only if there's deferred payment)
  let milestonesSection = "";
  if (hasDeferred) {
    const milestones = inputs.milestones ?? [];
    
    if (milestones.length > 0) {
      const tableHeader = "| Milestone | Target Date | Multiplier | Potential Payout |\n| --- | --- | ---: | ---: |";
      const tableRows = milestones.map(m => {
        const payout = deferredAmount * m.multiplier;
        return `| ${m.summary || "TBD"} | ${formatMilestoneDate(m.date)} | ${m.multiplier}x | ${formatCurrency(payout)} |`;
      }).join("\n");
      
      const maxMultiplier = Math.max(...milestones.map(m => m.multiplier));
      const maxDeferredPayout = formatCurrency(deferredAmount * maxMultiplier);
      
      // Build milestone miss outcome text
      const missOutcome = inputs.milestoneMissOutcome ?? "renegotiate";
      let milestoneMissText = MILESTONE_MISS_OUTCOMES[missOutcome] ?? MILESTONE_MISS_OUTCOMES["renegotiate"];
      
      if (missOutcome === "reduced-50") {
        milestoneMissText = milestoneMissText.replace("{reducedAmount}", formatCurrency(deferredAmount * 0.5));
      } else if (missOutcome === "reduced-20") {
        milestoneMissText = milestoneMissText.replace("{reducedAmount}", formatCurrency(deferredAmount * 0.2));
      }
      milestoneMissText = milestoneMissText.replace("{deferredAmount}", formatCurrency(deferredAmount));
      
      milestonesSection = `

### Deferred Payment & Performance Milestones

The deferred component (${formatCurrency(deferredAmount)} base) may be multiplied based on achievement of the following milestones:

${tableHeader}
${tableRows}

**Total Potential Payout Range:** ${formatCurrency(deferredAmount)} (base) to ${maxDeferredPayout} (if all milestones achieved)

### If No Milestones Are Achieved

${milestoneMissText}`;
    } else {
      milestonesSection = `

### Deferred Payment

The deferred payment of ${formatCurrency(deferredAmount)} will be due according to terms negotiated separately.`;
    }
  }
  
  // Build the full section
  return `
---

## 3a. Compensation Structure

This engagement includes a structured compensation model as outlined below:

### Payment Breakdown

| Component | Percentage | Amount |
|-----------|------------|--------|
${paymentRows}

**Upfront Payment** of ${formatCurrency(upfrontAmount)} ${upfrontTimingText}.
${equityTerms}${milestonesSection}`;
}

export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Fetch sprint details with project info
    const sprintRes = await pool.query(
      `SELECT 
        sd.id, sd.title, sd.start_date, sd.due_date, sd.weeks,
        sd.total_estimate_points, sd.total_fixed_price, sd.total_fixed_hours,
        sd.project_id, sd.draft,
        sd.has_deferred_comp, sd.upfront_payment_percent,
        p.name as project_name,
        p.account_id as project_account_id
       FROM sprint_drafts sd
       LEFT JOIN projects p ON sd.project_id = p.id
       WHERE sd.id = $1`,
      [params.id]
    );

    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const sprint = sprintRes.rows[0] as {
      id: string;
      title: string | null;
      start_date: string | Date | null;
      due_date: string | Date | null;
      weeks: number | null;
      total_estimate_points: number | null;
      total_fixed_price: number | null;
      total_fixed_hours: number | null;
      project_id: string | null;
      draft: unknown;
      project_name: string | null;
      project_account_id: string | null;
      has_deferred_comp: boolean | null;
      upfront_payment_percent: number | null;
    };

    // Fetch deliverables
    const delRes = await pool.query(
      `SELECT 
        sd.deliverable_name,
        sd.deliverable_category,
        sd.custom_estimate_points,
        sd.base_points,
        sd.custom_scope,
        sd.deliverable_scope,
        sd.notes,
        d.name as base_name,
        d.scope as base_scope,
        d.points as base_points_fallback
       FROM sprint_deliverables sd
       LEFT JOIN deliverables d ON sd.deliverable_id = d.id
       WHERE sd.sprint_draft_id = $1
       ORDER BY sd.created_at`,
      [params.id]
    );

    const deliverables = delRes.rows.map((row) => ({
      name: (row.deliverable_name as string | null) ?? (row.base_name as string | null) ?? "Untitled",
      points: Number(row.custom_estimate_points ?? row.base_points ?? row.base_points_fallback ?? 0),
      scope: (row.custom_scope as string | null) ?? 
             (row.deliverable_scope as string | null) ?? 
             (row.base_scope as string | null) ?? 
             "",
      notes: row.notes as string | null,
    }));

    // Fetch project members for client info
    let clientName = "";
    let clientTitle = "";
    const clientCompany = sprint.project_name || "Client";
    const clientCompanyFull = sprint.project_name || "Client Company";

    if (sprint.project_id) {
      // Get first project member (typically the client)
      const memberRes = await pool.query(
        `SELECT 
          pm.email,
          pm.title,
          a.name,
          a.first_name,
          a.last_name
         FROM project_members pm
         LEFT JOIN accounts a ON lower(pm.email) = lower(a.email)
         WHERE pm.project_id = $1
         ORDER BY pm.created_at ASC
         LIMIT 1`,
        [sprint.project_id]
      );

      if (memberRes.rowCount && memberRes.rowCount > 0) {
        const member = memberRes.rows[0] as {
          email: string;
          title: string | null;
          name: string | null;
          first_name: string | null;
          last_name: string | null;
        };
        
        if (member.first_name && member.last_name) {
          clientName = `${member.first_name} ${member.last_name}`;
        } else if (member.name) {
          clientName = member.name;
        } else {
          clientName = member.email.split("@")[0];
        }
        
        clientTitle = member.title || "Authorized Representative";
      }
    }

    // Extract title from draft if not set
    const draftObj = sprint.draft as Record<string, unknown> | null;
    const sprintTitle = sprint.title || 
                       (draftObj && typeof draftObj.sprintTitle === "string" ? draftObj.sprintTitle : null) ||
                       "Design Sprint";

    // Build deliverables table
    // Combine scope and notes - prefer notes if they exist, fall back to scope
    const tableHeader = "| Deliverable | PTS | Scope |\n| --- | ---: | --- |";
    const tableRows = deliverables.map((d) => {
      // Use notes if available (these are the detailed bullet points), 
      // otherwise use scope, otherwise show dash
      let scopeText = (d.notes && d.notes.trim()) 
        ? d.notes.trim() 
        : (d.scope && d.scope.trim()) 
          ? d.scope.trim() 
          : "—";
      // Replace newlines with <br> for markdown table compatibility
      scopeText = scopeText.replace(/\n/g, " <br> ");
      return `| ${d.name} | ${d.points.toFixed(1)} | ${scopeText} |`;
    }).join("\n");
    const deliverablesTable = `${tableHeader}\n${tableRows}`;

    // Calculate totals
    const totalPoints = Number(sprint.total_estimate_points ?? 0);
    const totalPrice = Number(sprint.total_fixed_price ?? 0);

    // Fetch budget plan if exists
    const budgetRes = await pool.query(
      `SELECT inputs, outputs, label, created_at
       FROM deferred_comp_plans
       WHERE sprint_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [params.id]
    );
    
    let compensationStructureSection = "";
    let hasBudgetPlan = false;
    let budgetRow: {
      inputs: BudgetInputs;
      outputs: BudgetOutputs;
      label: string | null;
      created_at: string | Date;
    } | null = null;
    
    if (budgetRes.rowCount && budgetRes.rowCount > 0) {
      budgetRow = budgetRes.rows[0] as {
        inputs: BudgetInputs;
        outputs: BudgetOutputs;
        label: string | null;
        created_at: string | Date;
      };
      
      hasBudgetPlan = true;
      compensationStructureSection = buildCompensationSection(
        budgetRow.inputs,
        budgetRow.outputs
      );
    } else if (sprint.has_deferred_comp === false && sprint.upfront_payment_percent != null) {
      // No saved budget plan, but the sprint has non-deferred settings from the sprint record
      const upfrontPct = Number(sprint.upfront_payment_percent) / 100; // stored as e.g. 40.00 → 0.40
      const sprintTotal = totalPrice;
      const upfrontAmt = sprintTotal * upfrontPct;
      const remainingAmt = sprintTotal * (1 - upfrontPct);
      
      compensationStructureSection = buildCompensationSection(
        { isDeferred: false, upfrontPayment: upfrontPct, upfrontPaymentTiming: "net30" },
        { upfrontAmount: upfrontAmt, remainingOnCompletion: remainingAmt, totalProjectValue: sprintTotal }
      );
    }

    // Build client description
    const clientDescription = clientCompany !== "Client" 
      ? ", an organization" 
      : "";

    // Get payment timing from budget plan or default to net30
    const paymentTiming = budgetRow?.inputs?.upfrontPaymentTiming ?? "net30";
    const paymentDueDate = PAYMENT_TIMING_TEXT[paymentTiming] ?? PAYMENT_TIMING_TEXT["net30"];

    // Generate the agreement by filling in the template
    const agreement = AGREEMENT_TEMPLATE
      .replace(/{sprintTitle}/g, `${clientCompany} ${sprintTitle}`)
      .replace(/{clientCompany}/g, clientCompany)
      .replace(/{clientCompanyFull}/g, clientCompanyFull)
      .replace(/{clientDescription}/g, clientDescription)
      .replace(/{clientName}/g, clientName || "[Client Name]")
      .replace(/{clientTitle}/g, clientTitle || "[Title]")
      .replace(/{startDate}/g, formatDate(sprint.start_date))
      .replace(/{dueDate}/g, formatDate(sprint.due_date))
      .replace(/{deliverablesTable}/g, deliverablesTable)
      .replace(/{totalPoints}/g, totalPoints.toFixed(1))
      .replace(/{totalPriceFormatted}/g, formatCurrency(totalPrice))
      .replace(/{paymentDueDate}/g, paymentDueDate)
      .replace(/{compensationStructureSection}/g, compensationStructureSection);

    // Store the generated agreement in the database
    // First, add the column if it doesn't exist
    await pool.query(`
      ALTER TABLE sprint_drafts
      ADD COLUMN IF NOT EXISTS agreement_markdown text,
      ADD COLUMN IF NOT EXISTS agreement_generated_at timestamptz
    `);

    // Save the agreement
    await pool.query(
      `UPDATE sprint_drafts 
       SET agreement_markdown = $1, 
           agreement_generated_at = now(),
           updated_at = now() 
       WHERE id = $2`,
      [agreement, params.id]
    );

    return NextResponse.json({
      success: true,
      agreement,
      meta: {
        sprintTitle,
        clientCompany,
        clientName,
        totalPoints,
        totalPrice,
        deliverableCount: deliverables.length,
        hasBudgetPlan,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[GenerateAgreement POST]", err);
    return NextResponse.json(
      { error: "Failed to generate agreement", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve a previously generated agreement
export async function GET(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if agreement_markdown column exists and fetch it
    const res = await pool.query(
      `SELECT 
        agreement_markdown,
        agreement_generated_at,
        title
       FROM sprint_drafts 
       WHERE id = $1`,
      [params.id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const row = res.rows[0] as {
      agreement_markdown: string | null;
      agreement_generated_at: string | Date | null;
      title: string | null;
    };

    if (!row.agreement_markdown) {
      return NextResponse.json({ 
        agreement: null,
        generatedAt: null,
        message: "No agreement has been generated yet" 
      });
    }

    return NextResponse.json({
      agreement: row.agreement_markdown,
      generatedAt: row.agreement_generated_at,
      title: row.title,
    });
  } catch (err) {
    console.error("[GenerateAgreement GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch agreement" },
      { status: 500 }
    );
  }
}

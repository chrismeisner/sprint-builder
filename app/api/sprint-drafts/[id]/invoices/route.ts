import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

type Params = { params: { id: string } };

type BudgetInputs = {
  isDeferred?: boolean;
  totalProjectValue?: number;
  upfrontPayment?: number;
  upfrontPaymentTiming?: string;
  completionPaymentTiming?: string;
  equitySplit?: number;
  milestones?: Array<{ id: number; summary: string; multiplier: number; date: string }>;
  milestoneMissOutcome?: string;
};

type BudgetOutputs = {
  upfrontAmount?: number;
  equityAmount?: number;
  deferredAmount?: number;
  milestoneBonusAmount?: number;
  remainingOnCompletion?: number;
  totalProjectValue?: number;
};

/**
 * GET /api/sprint-drafts/[id]/invoices
 * Lists all invoices for a sprint, ordered by sort_order.
 */
export async function GET(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const res = await pool.query(
      `SELECT id, sprint_id, label, invoice_url, invoice_status, invoice_pdf_url, amount, sort_order, created_at, updated_at
       FROM sprint_invoices
       WHERE sprint_id = $1
       ORDER BY sort_order, created_at`,
      [params.id]
    );

    return NextResponse.json({ invoices: res.rows });
  } catch (err) {
    console.error("[Invoices GET]", err);
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}

/**
 * POST /api/sprint-drafts/[id]/invoices
 * Auto-generates invoice records based on the sprint's budget plan.
 * Called when budget status transitions to "agreed".
 * Admin only.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    // Fetch the latest budget plan for this sprint
    const budgetRes = await pool.query(
      `SELECT id, inputs, outputs FROM deferred_comp_plans WHERE sprint_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [params.id]
    );

    if ((budgetRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "No budget plan found for this sprint" }, { status: 400 });
    }

    const budget = budgetRes.rows[0] as {
      id: string;
      inputs: BudgetInputs;
      outputs: BudgetOutputs;
    };

    const { inputs, outputs } = budget;
    const isDeferred = inputs.isDeferred !== false;

    // Check if invoices already exist for this sprint
    const existingRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM sprint_invoices WHERE sprint_id = $1`,
      [params.id]
    );
    const existingCount = (existingRes.rows[0] as { count: number }).count;

    if (existingCount > 0) {
      // Invoices already exist, return them
      const invoicesRes = await pool.query(
        `SELECT id, sprint_id, label, invoice_url, invoice_status, invoice_pdf_url, amount, sort_order, created_at, updated_at
         FROM sprint_invoices WHERE sprint_id = $1 ORDER BY sort_order, created_at`,
        [params.id]
      );
      return NextResponse.json({ invoices: invoicesRes.rows, created: false });
    }

    // Generate invoice records based on budget type
    const invoicesToCreate: Array<{ label: string; amount: number; sort_order: number }> = [];

    const upfrontAmount = outputs.upfrontAmount ?? 0;

    if (isDeferred) {
      // Deferred budget: Deposit + Deferred Payment
      if (upfrontAmount > 0) {
        invoicesToCreate.push({
          label: "Deposit",
          amount: upfrontAmount,
          sort_order: 0,
        });
      }

      const deferredAmount = outputs.deferredAmount ?? 0;
      if (deferredAmount > 0) {
        invoicesToCreate.push({
          label: "Deferred Payment",
          amount: deferredAmount,
          sort_order: 1,
        });
      }
    } else {
      // Standard budget: Deposit + Final Payment
      if (upfrontAmount > 0) {
        invoicesToCreate.push({
          label: "Deposit",
          amount: upfrontAmount,
          sort_order: 0,
        });
      }

      const remainingOnCompletion = outputs.remainingOnCompletion ?? 0;
      if (remainingOnCompletion > 0) {
        invoicesToCreate.push({
          label: "Final Payment",
          amount: remainingOnCompletion,
          sort_order: 1,
        });
      }
    }

    // If no amounts, create a single generic invoice
    if (invoicesToCreate.length === 0) {
      invoicesToCreate.push({
        label: "Invoice",
        amount: outputs.totalProjectValue ?? 0,
        sort_order: 0,
      });
    }

    // Insert invoices
    for (const inv of invoicesToCreate) {
      await pool.query(
        `INSERT INTO sprint_invoices (id, sprint_id, label, amount, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), params.id, inv.label, inv.amount, inv.sort_order]
      );
    }

    // Return the newly created invoices
    const invoicesRes = await pool.query(
      `SELECT id, sprint_id, label, invoice_url, invoice_status, invoice_pdf_url, amount, sort_order, created_at, updated_at
       FROM sprint_invoices WHERE sprint_id = $1 ORDER BY sort_order, created_at`,
      [params.id]
    );

    return NextResponse.json({ invoices: invoicesRes.rows, created: true }, { status: 201 });
  } catch (err) {
    console.error("[Invoices POST]", err);
    return NextResponse.json({ error: "Failed to generate invoices" }, { status: 500 });
  }
}

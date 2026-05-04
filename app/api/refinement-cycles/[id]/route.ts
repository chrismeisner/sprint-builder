import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { onCycleRevoked } from "@/lib/refinementCycleBilling";

type Params = { params: { id: string } };

const MAX_TEXT = 5000;

function clipText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_TEXT) : null;
}

// PATCH /api/refinement-cycles/[id]
//
// Submitter (or admin) edits the cycle's free-text scope fields while the
// status is still `submitted`. Stamps last_edited_at + last_edited_by so the
// studio can see the scope shifted before they accept/decline.
export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const pool = getPool();
    const cycleRes = await pool.query(
      `SELECT status, submitter_email
       FROM refinement_cycles WHERE id = $1 LIMIT 1`,
      [params.id]
    );
    if (cycleRes.rowCount === 0) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }
    const row = cycleRes.rows[0] as {
      status: string;
      submitter_email: string | null;
    };
    const isAdmin = Boolean(user.isAdmin);
    const isSubmitter =
      row.submitter_email != null &&
      row.submitter_email.toLowerCase() === user.email.toLowerCase();
    if (!isAdmin && !isSubmitter) {
      return NextResponse.json(
        { error: "Only the studio or the original submitter can edit scope" },
        { status: 403 }
      );
    }
    const body = (await request.json().catch(() => ({}))) as {
      whatsWorking?: unknown;
      whatsNotWorking?: unknown;
      successLooksLike?: unknown;
      totalPrice?: unknown;
      depositAmount?: unknown;
      finalAmount?: unknown;
      requiresDeposit?: unknown;
      deliveryDate?: unknown;
    };

    // Most fields lock once the cycle leaves `submitted`. The deposit-required
    // flag is the exception: admins can flip it while the cycle is still in
    // `submitted` (controls the upcoming acceptance email) or `in_progress`
    // (record-keeping; runtime billing is keyed off `deposit_paid_at`, which
    // protects against accidental double/under-billing). Delivery date is
    // also editable by admins at any pre-delivery status (no automatic email).
    const wantsLockedFieldUpdate =
      "whatsWorking" in body ||
      "whatsNotWorking" in body ||
      "successLooksLike" in body ||
      "totalPrice" in body ||
      "depositAmount" in body ||
      "finalAmount" in body;
    const wantsRequiresDepositUpdate = "requiresDeposit" in body;
    const wantsDeliveryDateUpdate = "deliveryDate" in body;

    if (wantsLockedFieldUpdate && row.status !== "submitted") {
      return NextResponse.json(
        { error: "Scope is locked once the cycle is accepted or declined" },
        { status: 409 }
      );
    }
    if (
      wantsRequiresDepositUpdate &&
      row.status !== "submitted" &&
      row.status !== "in_progress"
    ) {
      return NextResponse.json(
        {
          error:
            "Deposit setting can only be changed while the cycle is submitted or in progress",
        },
        { status: 409 }
      );
    }
    if (
      wantsDeliveryDateUpdate &&
      (row.status === "delivered" ||
        row.status === "declined" ||
        row.status === "expired")
    ) {
      return NextResponse.json(
        {
          error:
            "Delivery date can only be changed before the cycle is delivered, declined, or expired",
        },
        { status: 409 }
      );
    }

    const sets: string[] = [];
    const vals: unknown[] = [];
    let pidx = 1;
    if ("whatsWorking" in body) {
      sets.push(`whats_working = $${pidx++}`);
      vals.push(clipText(body.whatsWorking));
    }
    if ("whatsNotWorking" in body) {
      sets.push(`whats_not_working = $${pidx++}`);
      vals.push(clipText(body.whatsNotWorking));
    }
    if ("successLooksLike" in body) {
      sets.push(`success_looks_like = $${pidx++}`);
      vals.push(clipText(body.successLooksLike));
    }

    // Pricing override: admin-only. Must update all three together so the
    // total/deposit/final invariant (deposit + final == total) holds.
    const wantsPriceUpdate =
      "totalPrice" in body ||
      "depositAmount" in body ||
      "finalAmount" in body;
    if (wantsPriceUpdate) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Only admins can adjust pricing" },
          { status: 403 }
        );
      }
      const total = Number(body.totalPrice);
      const deposit = Number(body.depositAmount);
      const final = Number(body.finalAmount);
      if (
        !Number.isFinite(total) ||
        !Number.isFinite(deposit) ||
        !Number.isFinite(final) ||
        total < 0 ||
        deposit < 0 ||
        final < 0
      ) {
        return NextResponse.json(
          { error: "Pricing fields must be non-negative numbers" },
          { status: 400 }
        );
      }
      // Allow a 1-cent rounding fudge to absorb floating-point input.
      if (Math.abs(deposit + final - total) > 0.01) {
        return NextResponse.json(
          {
            error: `Deposit ($${deposit.toFixed(2)}) + final ($${final.toFixed(
              2
            )}) must equal total ($${total.toFixed(2)})`,
          },
          { status: 400 }
        );
      }
      sets.push(`total_price = $${pidx++}`);
      vals.push(total);
      sets.push(`deposit_amount = $${pidx++}`);
      vals.push(deposit);
      sets.push(`final_amount = $${pidx++}`);
      vals.push(final);
    }

    // Admin-only delivery-date override. Accepts a YYYY-MM-DD string or null
    // to clear. No emails are sent — admin handles client comms manually.
    if ("deliveryDate" in body) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Only admins can change the delivery date" },
          { status: 403 }
        );
      }
      const raw = body.deliveryDate;
      if (raw === null || raw === "") {
        sets.push(`delivery_date = $${pidx++}`);
        vals.push(null);
      } else if (
        typeof raw === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ) {
        sets.push(`delivery_date = $${pidx++}`);
        vals.push(raw);
      } else {
        return NextResponse.json(
          { error: "deliveryDate must be a YYYY-MM-DD string or null" },
          { status: 400 }
        );
      }
    }

    // Admin-only deposit-required toggle. Determines whether acceptance
    // generates a Stripe deposit invoice (legacy flow) or moves straight to
    // in-progress pay-on-delivery (default).
    if ("requiresDeposit" in body) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Only admins can change the deposit setting" },
          { status: 403 }
        );
      }
      sets.push(`requires_deposit = $${pidx++}`);
      vals.push(Boolean(body.requiresDeposit));
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    sets.push(`last_edited_at = now()`);
    sets.push(`last_edited_by = $${pidx++}`);
    vals.push(user.accountId);
    sets.push(`updated_at = now()`);
    vals.push(params.id);

    await pool.query(
      `UPDATE refinement_cycles SET ${sets.join(", ")} WHERE id = $${pidx}`,
      vals
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[RefinementCycle PATCH]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Save failed" },
      { status: 500 }
    );
  }
}

// DELETE /api/refinement-cycles/[id]
//
// Revoke / withdraw a cycle. Allowed when:
//   - status is `submitted` — the submitter or an admin can pull it back
//   - status is `accepted` / `awaiting_deposit` — admin only; voids the
//     Stripe deposit invoice if one was issued
// Once the deposit has been paid (status `in_progress` or later), this
// route 409s — refunds + reconciliation belong in a separate flow.
export async function DELETE(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const pool = getPool();
    const cycleRes = await pool.query(
      `SELECT rc.id, rc.status, rc.title, rc.submitter_email, rc.project_id,
              rc.stripe_deposit_invoice_id, rc.cc_emails,
              p.name AS project_name, p.emoji AS project_emoji
       FROM refinement_cycles rc
       LEFT JOIN projects p ON p.id = rc.project_id
       WHERE rc.id = $1
       LIMIT 1`,
      [params.id]
    );
    if (cycleRes.rowCount === 0) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }
    const cycle = cycleRes.rows[0] as {
      id: string;
      status: string;
      title: string | null;
      submitter_email: string | null;
      project_id: string;
      stripe_deposit_invoice_id: string | null;
      cc_emails: string[] | null;
      project_name: string | null;
      project_emoji: string | null;
    };

    const isAdmin = Boolean(user.isAdmin);
    const isSubmitter =
      cycle.submitter_email != null &&
      cycle.submitter_email.toLowerCase() === user.email.toLowerCase();

    if (!isAdmin && !isSubmitter) {
      return NextResponse.json(
        { error: "You can only revoke cycles you submitted" },
        { status: 403 }
      );
    }

    // Submitter can revoke only while still pending review. Admin can revoke
    // through the awaiting-deposit window.
    const revocableForSubmitter = cycle.status === "submitted";
    const revocableForAdmin =
      cycle.status === "submitted" ||
      cycle.status === "accepted" ||
      cycle.status === "awaiting_deposit";

    const allowed = isAdmin ? revocableForAdmin : revocableForSubmitter;
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            cycle.status === "in_progress" ||
            cycle.status === "awaiting_payment" ||
            cycle.status === "delivered"
              ? "Cycle is past acceptance — contact the studio to handle this case."
              : `Cycle is ${cycle.status}; nothing to revoke.`,
        },
        { status: 409 }
      );
    }

    // Best-effort: void any unpaid Stripe deposit invoice before deleting the
    // row, so the hosted payment URL stops working.
    if (cycle.stripe_deposit_invoice_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = getStripe();
        await stripe.invoices.voidInvoice(cycle.stripe_deposit_invoice_id);
      } catch (err) {
        console.error(
          `[RefinementCycle DELETE] Failed to void Stripe invoice ${cycle.stripe_deposit_invoice_id}:`,
          (err as Error).message
        );
      }
    }

    // FK cascade handles refinement_cycle_screens.
    await pool.query(`DELETE FROM refinement_cycles WHERE id = $1`, [
      params.id,
    ]);

    // Notify all parties: submitter (with their CC list) + admins. Best-effort.
    await onCycleRevoked(
      {
        cycleId: cycle.id,
        title: cycle.title,
        submitterEmail: cycle.submitter_email,
        ccEmails: Array.isArray(cycle.cc_emails) ? cycle.cc_emails : [],
        projectId: cycle.project_id,
        projectName: cycle.project_name,
        projectEmoji: cycle.project_emoji,
      },
      {
        email: user.email,
        // The studio (admin) revoked it unless the submitter pulled it back
        // themselves.
        isStudio: isAdmin && !isSubmitter,
      }
    );

    return NextResponse.json({ ok: true, projectId: cycle.project_id });
  } catch (err) {
    console.error("[RefinementCycle DELETE]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Revoke failed" },
      { status: 500 }
    );
  }
}

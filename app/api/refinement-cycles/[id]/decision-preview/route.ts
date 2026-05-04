import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCalBookingUrlForDeliveryDate } from "@/lib/refinementCycleBilling";
import {
  generateRefinementCycleAcceptedClientEmail,
  generateRefinementCycleDeclinedClientEmail,
} from "@/lib/email";

type Params = { params: { id: string } };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getBaseUrl(): string {
  return (
    (process.env.BASE_URL || "").replace(/\/$/, "") || "https://meisner.design"
  );
}

// POST /api/refinement-cycles/[id]/decision-preview
//
// Pure preview — runs the same email-template + side-effect logic the
// accept/decline routes will run, but doesn't touch the cycle. Returns
// what the client would see if they pressed Submit decision right now.
export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      decision?: unknown;
      deliveryDate?: unknown;
      studioReviewNote?: unknown;
      studioReviewAttachmentUrl?: unknown;
    };

    const decision =
      body.decision === "accept" || body.decision === "decline"
        ? body.decision
        : null;
    if (!decision) {
      return NextResponse.json(
        { error: "decision must be 'accept' or 'decline'" },
        { status: 400 }
      );
    }

    const deliveryDate =
      typeof body.deliveryDate === "string" &&
      DATE_PATTERN.test(body.deliveryDate)
        ? body.deliveryDate
        : null;
    const studioReviewNote =
      typeof body.studioReviewNote === "string" && body.studioReviewNote.trim()
        ? body.studioReviewNote.trim().slice(0, 5000)
        : null;
    const studioReviewAttachmentUrl =
      typeof body.studioReviewAttachmentUrl === "string" &&
      body.studioReviewAttachmentUrl.trim()
        ? body.studioReviewAttachmentUrl.trim().slice(0, 1000)
        : null;

    const pool = getPool();
    const cycleRes = await pool.query(
      `SELECT rc.id, rc.title, rc.status, rc.submitter_email, rc.cc_emails,
              rc.requires_deposit,
              rc.total_price, rc.deposit_amount, rc.final_amount,
              rc.project_id,
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
    const row = cycleRes.rows[0] as {
      id: string;
      title: string | null;
      status: string;
      submitter_email: string | null;
      cc_emails: string[] | null;
      requires_deposit: boolean;
      total_price: string | number;
      deposit_amount: string | number;
      final_amount: string | number;
      project_id: string;
      project_name: string | null;
      project_emoji: string | null;
    };

    const to = row.submitter_email ?? null;
    const cc = Array.isArray(row.cc_emails) ? row.cc_emails : [];
    const totalPrice = Number(row.total_price ?? 0);
    const depositAmount = Number(row.deposit_amount ?? 0);
    const finalAmount = Number(row.final_amount ?? 0);

    const sideEffects: string[] = [];
    let preview: { subject: string; text: string } | null = null;

    if (decision === "accept") {
      const calBookingUrl = getCalBookingUrlForDeliveryDate(deliveryDate);
      // Email is generated with whichever delivery date the admin has
      // currently picked — preview matches what the accept route will use.
      const content = generateRefinementCycleAcceptedClientEmail({
        title: row.title,
        projectName: row.project_name,
        projectEmoji: row.project_emoji,
        studioNote: studioReviewNote,
        studioAttachmentUrl: studioReviewAttachmentUrl,
        deliveryDate,
        totalPrice,
        calBookingUrl,
        requiresDeposit: row.requires_deposit,
        depositAmount,
        finalAmount,
        // The real flow generates the deposit invoice URL post-accept; the
        // preview can't show the URL but the email template handles the null
        // case (says invoice is on the way).
        stripeDepositInvoiceUrl: null,
      });
      preview = { subject: content.subject, text: content.text };

      if (row.requires_deposit) {
        sideEffects.push(
          `Status moves: ${row.status} → awaiting_deposit.`
        );
        sideEffects.push(
          `Generates a Stripe deposit invoice for ${formatUsd(depositAmount)}; the URL is included in the acceptance email.`
        );
        sideEffects.push(
          `Remaining ${formatUsd(finalAmount)} is invoiced when the cycle is delivered.`
        );
      } else {
        sideEffects.push(`Status moves: ${row.status} → in_progress.`);
        sideEffects.push(
          `No invoice now — the full ${formatUsd(totalPrice)} is invoiced when the cycle is delivered.`
        );
      }
      if (calBookingUrl) {
        sideEffects.push(
          `Email includes a Cal.com booking link for the delivery-day check-in.`
        );
      }
    } else {
      const newSubmissionUrl = `${getBaseUrl()}/dashboard/refinement-cycles/new?projectId=${row.project_id}`;
      const content = generateRefinementCycleDeclinedClientEmail({
        projectName: row.project_name,
        projectEmoji: row.project_emoji,
        studioNote: studioReviewNote,
        studioAttachmentUrl: studioReviewAttachmentUrl,
        newSubmissionUrl,
      });
      preview = { subject: content.subject, text: content.text };

      sideEffects.push(`Status moves: ${row.status} → declined.`);
      sideEffects.push(
        `No invoice is generated. Submitter sees a resubmit link in the email.`
      );
    }

    return NextResponse.json({
      decision,
      to,
      cc,
      subject: preview.subject,
      text: preview.text,
      sideEffects,
    });
  } catch (err) {
    console.error("[RefinementCycle decision-preview]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Preview failed" },
      { status: 500 }
    );
  }
}

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ensureSchema, getPool } from "@/lib/db";
import { defaultDeliveryDateEt } from "@/lib/refinementCycle";
import RefinementCycleReviewClient from "./RefinementCycleReviewClient";
import type { RefinementCycleStatus } from "@/lib/refinementCycle";

export const dynamic = "force-dynamic";

export type CycleScreen = {
  id: string;
  name: string | null;
  notes: string | null;
  screenshotUrl: string | null;
  addedBy: "client" | "admin";
  adminNote: string | null;
  sortOrder: number;
  createdAt: string;
};

export type CycleDetail = {
  id: string;
  title: string | null;
  status: RefinementCycleStatus;
  projectId: string;
  projectName: string | null;
  projectEmoji: string | null;
  submitterEmail: string | null;
  screenRecordingUrl: string | null;
  whatsWorking: string | null;
  whatsNotWorking: string | null;
  successLooksLike: string | null;
  ccEmails: string[];
  studioReviewNote: string | null;
  totalPrice: number;
  depositAmount: number;
  finalAmount: number;
  preferredDeliveryDate: string | null;
  deliveryDate: string | null;
  submittedAt: string;
  acceptedAt: string | null;
  declinedAt: string | null;
  depositPaidAt: string | null;
  deliveredAt: string | null;
  expiredAt: string | null;
  stripeDepositInvoiceUrl: string | null;
  stripeFinalInvoiceUrl: string | null;
  calBookingUrl: string | null;
  checkinScheduledAt: string | null;
  checkinAttended: boolean;
  checkinNotes: string | null;
  figmaFileUrl: string | null;
  loomWalkthroughUrl: string | null;
  engineeringNotes: string | null;
  screens: CycleScreen[];
};

export default async function RefinementCycleReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  await ensureSchema();
  const pool = getPool();

  const cycleRes = await pool.query(
    `
    SELECT rc.*, p.name AS project_name, p.emoji AS project_emoji,
           p.account_id AS project_account_id
    FROM refinement_cycles rc
    LEFT JOIN projects p ON p.id = rc.project_id
    WHERE rc.id = $1
    LIMIT 1
    `,
    [params.id]
  );
  if (cycleRes.rowCount === 0) {
    notFound();
  }
  const row = cycleRes.rows[0];

  // Allow admins, project owners, or explicit project members to view.
  const isAdmin = Boolean(user.isAdmin);
  const isOwner = row.project_account_id === user.accountId;
  let isMember = isOwner;
  if (!isAdmin && !isOwner) {
    const memberRes = await pool.query(
      `SELECT 1 FROM project_members
       WHERE project_id = $1 AND lower(email) = lower($2)
       LIMIT 1`,
      [row.project_id, user.email]
    );
    isMember = (memberRes.rowCount ?? 0) > 0;
  }
  if (!isAdmin && !isMember) {
    notFound();
  }

  const screensRes = await pool.query(
    `
    SELECT id, name, notes, screenshot_url, added_by, admin_note,
           sort_order, created_at
    FROM refinement_cycle_screens
    WHERE refinement_cycle_id = $1
    ORDER BY sort_order ASC, created_at ASC
    `,
    [params.id]
  );

  const screens: CycleScreen[] = screensRes.rows.map((s) => ({
    id: s.id as string,
    name: (s.name as string | null) ?? null,
    notes: (s.notes as string | null) ?? null,
    screenshotUrl: (s.screenshot_url as string | null) ?? null,
    addedBy: (s.added_by as "client" | "admin") ?? "client",
    adminNote: (s.admin_note as string | null) ?? null,
    sortOrder: Number(s.sort_order ?? 0),
    createdAt:
      s.created_at instanceof Date
        ? s.created_at.toISOString()
        : (s.created_at as string),
  }));

  const cycle: CycleDetail = {
    id: row.id as string,
    title: (row.title as string | null) ?? null,
    status: row.status as RefinementCycleStatus,
    projectId: row.project_id as string,
    projectName: (row.project_name as string | null) ?? null,
    projectEmoji: (row.project_emoji as string | null) ?? null,
    submitterEmail: (row.submitter_email as string | null) ?? null,
    screenRecordingUrl: (row.screen_recording_url as string | null) ?? null,
    whatsWorking: (row.whats_working as string | null) ?? null,
    whatsNotWorking: (row.whats_not_working as string | null) ?? null,
    successLooksLike: (row.success_looks_like as string | null) ?? null,
    ccEmails: Array.isArray(row.cc_emails) ? (row.cc_emails as string[]) : [],
    studioReviewNote: (row.studio_review_note as string | null) ?? null,
    totalPrice: Number(row.total_price ?? 1200),
    depositAmount: Number(row.deposit_amount ?? 600),
    finalAmount: Number(row.final_amount ?? 600),
    preferredDeliveryDate:
      row.preferred_delivery_date instanceof Date
        ? row.preferred_delivery_date.toISOString().slice(0, 10)
        : ((row.preferred_delivery_date as string | null) ?? null),
    deliveryDate:
      row.delivery_date instanceof Date
        ? row.delivery_date.toISOString().slice(0, 10)
        : ((row.delivery_date as string | null) ?? null),
    submittedAt:
      row.submitted_at instanceof Date
        ? row.submitted_at.toISOString()
        : (row.submitted_at as string),
    acceptedAt: row.accepted_at
      ? row.accepted_at instanceof Date
        ? row.accepted_at.toISOString()
        : (row.accepted_at as string)
      : null,
    declinedAt: row.declined_at
      ? row.declined_at instanceof Date
        ? row.declined_at.toISOString()
        : (row.declined_at as string)
      : null,
    depositPaidAt: row.deposit_paid_at
      ? row.deposit_paid_at instanceof Date
        ? row.deposit_paid_at.toISOString()
        : (row.deposit_paid_at as string)
      : null,
    deliveredAt: row.delivered_at
      ? row.delivered_at instanceof Date
        ? row.delivered_at.toISOString()
        : (row.delivered_at as string)
      : null,
    expiredAt: row.expired_at
      ? row.expired_at instanceof Date
        ? row.expired_at.toISOString()
        : (row.expired_at as string)
      : null,
    stripeDepositInvoiceUrl:
      (row.stripe_deposit_invoice_url as string | null) ?? null,
    stripeFinalInvoiceUrl:
      (row.stripe_final_invoice_url as string | null) ?? null,
    calBookingUrl: (row.cal_booking_url as string | null) ?? null,
    checkinScheduledAt: row.checkin_scheduled_at
      ? row.checkin_scheduled_at instanceof Date
        ? row.checkin_scheduled_at.toISOString()
        : (row.checkin_scheduled_at as string)
      : null,
    checkinAttended: Boolean(row.checkin_attended),
    checkinNotes: (row.checkin_notes as string | null) ?? null,
    figmaFileUrl: (row.figma_file_url as string | null) ?? null,
    loomWalkthroughUrl: (row.loom_walkthrough_url as string | null) ?? null,
    engineeringNotes: (row.engineering_notes as string | null) ?? null,
    screens,
  };

  return (
    <RefinementCycleReviewClient
      cycle={cycle}
      defaultDeliveryDate={defaultDeliveryDateEt()}
      viewerRole={isAdmin ? "admin" : "member"}
    />
  );
}

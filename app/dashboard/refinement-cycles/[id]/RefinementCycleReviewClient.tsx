"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Typography from "@/components/ui/Typography";
import { useToast } from "@/lib/toast-context";
import { statusVisuals } from "@/lib/refinementCycle";
import type {
  CycleDetail,
  CycleScreen,
  CycleDeliverableScreenshot,
} from "./page";

type Props = {
  cycle: CycleDetail;
  defaultDeliveryDate: string;
  viewerRole: "admin" | "member";
  viewerIsSubmitter: boolean;
};

const TONE_CLASSES: Record<
  ReturnType<typeof statusVisuals>["tone"],
  string
> = {
  neutral: "bg-surface-subtle text-text-secondary border-stroke-muted",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  danger: "bg-red-100 text-red-800 border-red-200",
};

function StatusBadge({ status }: { status: CycleDetail["status"] }) {
  const v = statusVisuals(status);
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 ${TONE_CLASSES[v.tone]}`}
    >
      <Typography scale="body-sm" as="span">
        {v.label}
      </Typography>
    </span>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function formatDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map((n) => Number(n));
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function RefinementCycleReviewClient({
  cycle,
  defaultDeliveryDate,
  viewerRole,
  viewerIsSubmitter,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const isAdmin = viewerRole === "admin";

  // A cycle can be revoked while it hasn't progressed past awaiting_deposit
  // for admins, or while still pending review for the submitter themselves.
  const canRevoke =
    (isAdmin &&
      (cycle.status === "submitted" ||
        cycle.status === "accepted" ||
        cycle.status === "awaiting_deposit")) ||
    (viewerIsSubmitter && cycle.status === "submitted");

  const [screens, setScreens] = useState<CycleScreen[]>(cycle.screens);
  const [reviewNote, setReviewNote] = useState(cycle.studioReviewNote ?? "");
  const [deliveryDate, setDeliveryDate] = useState(
    cycle.deliveryDate ?? cycle.preferredDeliveryDate ?? defaultDeliveryDate
  );
  const [decision, setDecision] = useState<"accept" | "decline" | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(
    cycle.studioReviewAttachmentUrl ?? null
  );
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [notifyOnRegenerate, setNotifyOnRegenerate] = useState(true);
  const [busy, setBusy] = useState<
    | "accept"
    | "decline"
    | "screen"
    | "deliver"
    | "revoke"
    | "regenerateDeposit"
    | "saveDraft"
    | "uploadScreenshot"
    | null
  >(null);
  const [deliverableShots, setDeliverableShots] = useState<
    CycleDeliverableScreenshot[]
  >(cycle.deliverableScreenshots);

  const [figmaFileUrl, setFigmaFileUrl] = useState(cycle.figmaFileUrl ?? "");
  const [loomWalkthroughUrl, setLoomWalkthroughUrl] = useState(
    cycle.loomWalkthroughUrl ?? ""
  );
  const [engineeringNotes, setEngineeringNotes] = useState(
    cycle.engineeringNotes ?? ""
  );
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(
    cycle.deliveryDraftSavedAt
  );
  const [draftSavedByEmail, setDraftSavedByEmail] = useState<string | null>(
    cycle.deliveryDraftSavedByEmail
  );

  const isEditable = cycle.status === "submitted" && isAdmin;

  const tagline = useMemo(() => {
    switch (cycle.status) {
      case "submitted":
        return "Submitted — awaiting review.";
      case "accepted":
      case "awaiting_deposit":
        return "Accepted — awaiting deposit payment.";
      case "in_progress":
        return "Approved — work in progress.";
      case "awaiting_payment":
        return "Delivered — awaiting payment.";
      case "delivered":
        return "Delivered & paid.";
      case "declined":
        return "Declined.";
      case "expired":
        return "Expired — deposit was not paid in time.";
    }
  }, [cycle.status]);

  async function addScreen() {
    if (!isEditable) return;
    setBusy("screen");
    try {
      const res = await fetch(`/api/refinement-cycles/${cycle.id}/screens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          notes: "",
          adminNote: "",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add screen");
      }
      const json = (await res.json()) as { screen: CycleScreen };
      setScreens((prev) => [...prev, json.screen]);
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function patchScreen(id: string, patch: Partial<CycleScreen>) {
    if (!isEditable) return;
    const res = await fetch(
      `/api/refinement-cycles/${cycle.id}/screens/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Save failed");
    }
    setScreens((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  async function deleteScreen(id: string) {
    if (!isEditable) return;
    if (!window.confirm("Remove this screen from scope?")) return;
    const res = await fetch(
      `/api/refinement-cycles/${cycle.id}/screens/${id}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Failed to remove screen", "error");
      return;
    }
    setScreens((prev) => prev.filter((s) => s.id !== id));
  }

  async function uploadAttachment(file: File) {
    setUploadingAttachment(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `/api/refinement-cycles/${cycle.id}/review-attachment`,
        { method: "POST", body: fd }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const json = (await res.json()) as { url: string };
      setAttachmentUrl(json.url);
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function acceptCycle() {
    setBusy("accept");
    try {
      const res = await fetch(`/api/refinement-cycles/${cycle.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryDate,
          studioReviewNote: reviewNote.trim() || null,
          studioReviewAttachmentUrl: attachmentUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Accept failed");
      }
      showToast("Cycle accepted", "success");
      router.refresh();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function revokeCycle() {
    const message =
      cycle.status === "submitted"
        ? "Revoke this cycle? It will be removed and the studio will not review it."
        : "Revoke this accepted cycle? Any unpaid Stripe deposit invoice will be voided and the cycle will be removed.";
    if (!window.confirm(message)) return;
    setBusy("revoke");
    try {
      const res = await fetch(`/api/refinement-cycles/${cycle.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Revoke failed");
      }
      showToast("Cycle revoked", "success");
      router.push(
        isAdmin
          ? "/dashboard/refinement-cycles"
          : `/projects/${cycle.projectId}`
      );
    } catch (err) {
      showToast((err as Error).message, "error");
      setBusy(null);
    }
  }

  async function saveDeliveryDraft() {
    setBusy("saveDraft");
    try {
      const res = await fetch(
        `/api/refinement-cycles/${cycle.id}/delivery-draft`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            figmaFileUrl: figmaFileUrl.trim() || null,
            loomWalkthroughUrl: loomWalkthroughUrl.trim() || null,
            engineeringNotes: engineeringNotes.trim() || null,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save draft failed");
      }
      const json = (await res.json()) as {
        deliveryDraftSavedAt: string;
        deliveryDraftSavedByEmail: string;
      };
      setDraftSavedAt(json.deliveryDraftSavedAt);
      setDraftSavedByEmail(json.deliveryDraftSavedByEmail);
      showToast("Draft saved", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function uploadDeliverableScreenshot(file: File) {
    setBusy("uploadScreenshot");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `/api/refinement-cycles/${cycle.id}/deliverable-screenshots`,
        { method: "POST", body: fd }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const json = (await res.json()) as {
        screenshot: CycleDeliverableScreenshot;
      };
      setDeliverableShots((prev) => [...prev, json.screenshot]);
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function deleteDeliverableScreenshot(id: string) {
    if (!window.confirm("Remove this screenshot?")) return;
    try {
      const res = await fetch(
        `/api/refinement-cycles/${cycle.id}/deliverable-screenshots/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Delete failed");
      }
      setDeliverableShots((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  async function deliverCycle() {
    if (
      !window.confirm(
        "Mark this cycle delivered? The client will receive the deliverables and final invoice."
      )
    ) {
      return;
    }
    setBusy("deliver");
    try {
      const res = await fetch(`/api/refinement-cycles/${cycle.id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figmaFileUrl: figmaFileUrl.trim() || null,
          loomWalkthroughUrl: loomWalkthroughUrl.trim() || null,
          engineeringNotes: engineeringNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Deliver failed");
      }
      showToast("Cycle delivered", "success");
      router.refresh();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function declineCycle() {
    if (
      !window.confirm(
        "Decline this refinement cycle? The client will be emailed."
      )
    ) {
      return;
    }
    setBusy("decline");
    try {
      const res = await fetch(`/api/refinement-cycles/${cycle.id}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioReviewNote: reviewNote.trim() || null,
          studioReviewAttachmentUrl: attachmentUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Decline failed");
      }
      showToast("Cycle declined", "success");
      router.refresh();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function regenerateDepositInvoice() {
    const confirmMsg = notifyOnRegenerate
      ? "Generate a Stripe deposit invoice for this cycle? The acceptance email will be sent to the submitter and any CC'd project members with the payment link."
      : "Generate a Stripe deposit invoice for this cycle? No email will be sent — you'll need to share the link manually.";
    if (!window.confirm(confirmMsg)) return;
    setBusy("regenerateDeposit");
    try {
      const res = await fetch(
        `/api/refinement-cycles/${cycle.id}/regenerate-deposit-invoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notify: notifyOnRegenerate }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate deposit invoice");
      }
      showToast(
        notifyOnRegenerate
          ? "Deposit invoice generated and email sent"
          : "Deposit invoice generated (no email sent)",
        "success"
      );
      router.refresh();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function submitDecision() {
    if (decision === "accept") {
      await acceptCycle();
    } else if (decision === "decline") {
      await declineCycle();
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <header className="space-y-3">
        <Link
          href={
            isAdmin
              ? "/dashboard/refinement-cycles"
              : `/projects/${cycle.projectId}`
          }
          className="opacity-70 hover:opacity-100"
        >
          <Typography scale="body-sm" as="span">
            ← {isAdmin ? "Back to queue" : "Back to project"}
          </Typography>
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Typography as="h1" scale="display-md" className="mb-1">
              {cycle.title || "Refinement Cycle"}
            </Typography>
            <Typography className="text-text-secondary">
              {cycle.projectEmoji ? `${cycle.projectEmoji} ` : ""}
              {cycle.projectName ?? "—"} ·{" "}
              {cycle.submitterEmail ?? "unknown submitter"}
            </Typography>
            <Typography
              scale="body-sm"
              className="text-text-secondary mt-1"
            >
              {cycle.rate === "pilot" ? "Pilot rate" : "Full rate"} —{" "}
              {`$${cycle.totalPrice.toLocaleString()}`} (
              {`$${cycle.depositAmount.toLocaleString()}`} +{" "}
              {`$${cycle.finalAmount.toLocaleString()}`})
            </Typography>
            <Typography scale="body-sm" className="text-text-secondary mt-1">
              Submitted {formatDateTime(cycle.submittedAt)} ET · {tagline}
            </Typography>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={cycle.status} />
            {canRevoke && (
              <Button
                type="button"
                variant="destructiveOutline"
                size="sm"
                onClick={revokeCycle}
                disabled={busy !== null}
              >
                {busy === "revoke" ? "Revoking…" : "Revoke cycle"}
              </Button>
            )}
          </div>
        </div>
      </header>

      {cycle.status === "awaiting_deposit" &&
        !cycle.stripeDepositInvoiceUrl &&
        isAdmin && (
          <section className="rounded-md border border-red-200 bg-red-50 p-4 space-y-3">
            <Typography as="h2" scale="heading-md">
              Stripe deposit invoice missing
            </Typography>
            <Typography className="text-text-secondary">
              This cycle was accepted but no Stripe deposit invoice was
              created — the client can&rsquo;t pay yet. Generate one now to
              re-send the acceptance email with a real payment link.
            </Typography>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={regenerateDepositInvoice}
                disabled={busy !== null}
              >
                {busy === "regenerateDeposit"
                  ? "Generating…"
                  : "Generate deposit invoice"}
              </Button>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifyOnRegenerate}
                  onChange={(e) => setNotifyOnRegenerate(e.target.checked)}
                  disabled={busy !== null}
                />
                <Typography scale="body-sm" as="span">
                  Email this link to project members on this cycle
                </Typography>
              </label>
            </div>
          </section>
        )}

      {cycle.status === "awaiting_deposit" && cycle.stripeDepositInvoiceUrl && (
        <section className="rounded-md border border-yellow-200 bg-yellow-50 p-4 space-y-3">
          <Typography as="h2" scale="heading-md">
            Pay your deposit
          </Typography>
          <Typography className="text-text-secondary">
            Your refinement cycle is accepted. Pay the{" "}
            {`$${cycle.depositAmount.toLocaleString()}`} deposit by 10am ET on{" "}
            {cycle.deliveryDate
              ? formatDate(cycle.deliveryDate)
              : "delivery day"}{" "}
            to lock in your slot — the cycle starts after the deposit clears.
          </Typography>
          <div>
            <a
              href={cycle.stripeDepositInvoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Pay deposit invoice →
            </a>
          </div>
        </section>
      )}

      {cycle.status === "submitted" && isAdmin && (
        <section className="rounded-md border border-stroke-muted bg-surface-subtle p-4 space-y-4">
          <Typography as="h2" scale="heading-md">
            Review &amp; decide
          </Typography>

          <div className="space-y-2">
            <Typography
              scale="body-sm"
              as="div"
              className="font-semibold"
            >
              Decision
            </Typography>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="decision"
                  value="accept"
                  checked={decision === "accept"}
                  onChange={() => setDecision("accept")}
                />
                <Typography scale="body-sm" as="span">
                  Accept
                </Typography>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="decision"
                  value="decline"
                  checked={decision === "decline"}
                  onChange={() => setDecision("decline")}
                />
                <Typography scale="body-sm" as="span">
                  Decline
                </Typography>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block">
              <Typography scale="body-sm" as="span" className="font-semibold">
                Studio note (optional)
              </Typography>
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              placeholder="Commentary that ships in the accept/decline email — flag adjustments, surface observations, or note things to discuss on the check-in."
              className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-text-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="block">
              <Typography scale="body-sm" as="span" className="font-semibold">
                Attachment (optional)
              </Typography>
            </label>
            {attachmentUrl ? (
              <div className="space-y-2">
                {/\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(attachmentUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachmentUrl}
                    alt="Studio attachment"
                    className="max-h-64 rounded-md border border-stroke-muted"
                  />
                ) : (
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-sm"
                  >
                    {attachmentUrl}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setAttachmentUrl(null)}
                  className="text-semantic-danger hover:underline"
                >
                  <Typography scale="body-sm" as="span">
                    Remove
                  </Typography>
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
                disabled={uploadingAttachment}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadAttachment(f);
                  e.target.value = "";
                }}
                className="block text-sm"
              />
            )}
            {uploadingAttachment && (
              <Typography
                scale="body-sm"
                className="text-text-secondary"
              >
                Uploading…
              </Typography>
            )}
          </div>

          {decision === "accept" && (
            <div className="space-y-2">
              <label className="block">
                <Typography
                  scale="body-sm"
                  as="span"
                  className="font-semibold"
                >
                  Delivery date
                </Typography>
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="rounded-md border border-stroke-muted bg-background px-3 py-2 text-text-primary"
              />
              <Typography scale="body-sm" className="text-text-secondary">
                Default is the next business day. Deposit deadline = 10am ET
                that day; delivery target = 5pm ET that day.
              </Typography>
              {cycle.preferredDeliveryDate && (
                <Typography
                  scale="body-sm"
                  className="text-text-secondary"
                >
                  Client&rsquo;s preferred date:{" "}
                  {formatDate(cycle.preferredDeliveryDate)}
                </Typography>
              )}
            </div>
          )}

          <div className="flex justify-end border-t border-stroke-muted pt-3">
            <Button
              type="button"
              onClick={submitDecision}
              disabled={
                busy !== null ||
                uploadingAttachment ||
                decision === null ||
                (decision === "accept" && !deliveryDate)
              }
            >
              {busy === "accept" || busy === "decline"
                ? "Submitting…"
                : "Submit decision"}
            </Button>
          </div>
        </section>
      )}

      <section className="rounded-md border border-stroke-muted bg-surface-subtle p-4 space-y-3">
        <Typography as="h2" scale="heading-md">
          Submission
        </Typography>
        {cycle.ccEmails.length > 0 && (
          <Field label="CC&rsquo;d on emails">
            {cycle.ccEmails.join(", ")}
          </Field>
        )}
        <Field label="Screen recording">
          {cycle.screenRecordingUrl ? (
            <a
              href={cycle.screenRecordingUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {cycle.screenRecordingUrl}
            </a>
          ) : (
            <span className="opacity-60">Not provided</span>
          )}
        </Field>
        <Field label="What's working">{cycle.whatsWorking ?? "—"}</Field>
        <Field label="What's not working">
          {cycle.whatsNotWorking ?? "—"}
        </Field>
        <Field label="What success looks like">
          {cycle.successLooksLike ?? "—"}
        </Field>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Typography as="h2" scale="heading-md">
            Screens in scope ({screens.length})
          </Typography>
          {isEditable && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addScreen}
              disabled={busy !== null}
            >
              Add screen
            </Button>
          )}
        </div>

        {screens.length === 0 ? (
          <Typography className="text-text-secondary">
            No screens listed.
          </Typography>
        ) : (
          <div className="space-y-3">
            {screens.map((s) => (
              <ScreenCard
                key={s.id}
                screen={s}
                editable={isEditable}
                onPatch={async (patch) => {
                  try {
                    await patchScreen(s.id, patch);
                  } catch (err) {
                    showToast((err as Error).message, "error");
                  }
                }}
                onDelete={() => deleteScreen(s.id)}
              />
            ))}
          </div>
        )}
      </section>

      {cycle.status !== "submitted" && (
        <>
          {isAdmin &&
            (cycle.status === "awaiting_deposit" ||
              cycle.status === "in_progress") && (
            <section className="rounded-md border border-stroke-muted bg-surface-subtle p-4 space-y-4">
              <Typography as="h2" scale="heading-md">
                Deliver
              </Typography>
              {cycle.status === "awaiting_deposit" && (
                <Typography
                  scale="body-sm"
                  className="text-text-secondary italic"
                >
                  Heads up — this is a legacy cycle on the deposit flow and
                  the deposit hasn&rsquo;t cleared. Delivering now will still
                  create the final invoice for the remaining{" "}
                  {`$${cycle.finalAmount}`}.
                </Typography>
              )}
              <div className="space-y-2">
                <label className="block">
                  <Typography
                    scale="body-sm"
                    as="span"
                    className="font-semibold"
                  >
                    Figma file URL
                  </Typography>
                </label>
                <input
                  type="url"
                  value={figmaFileUrl}
                  onChange={(e) => setFigmaFileUrl(e.target.value)}
                  placeholder="https://www.figma.com/file/..."
                  className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-text-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="block">
                  <Typography
                    scale="body-sm"
                    as="span"
                    className="font-semibold"
                  >
                    Walkthrough Loom URL
                  </Typography>
                </label>
                <input
                  type="url"
                  value={loomWalkthroughUrl}
                  onChange={(e) => setLoomWalkthroughUrl(e.target.value)}
                  placeholder="https://www.loom.com/share/..."
                  className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-text-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="block">
                  <Typography
                    scale="body-sm"
                    as="span"
                    className="font-semibold"
                  >
                    Engineering notes
                  </Typography>
                </label>
                <textarea
                  value={engineeringNotes}
                  onChange={(e) => setEngineeringNotes(e.target.value)}
                  rows={5}
                  placeholder="Implementation notes for the build team — tokens used, edge cases, gotchas, etc."
                  className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-text-primary"
                />
              </div>
              <div className="space-y-2">
                <Typography
                  scale="body-sm"
                  as="span"
                  className="font-semibold"
                >
                  Screenshots
                </Typography>
                {deliverableShots.length === 0 ? (
                  <Typography
                    scale="body-sm"
                    className="text-text-secondary"
                  >
                    No screenshots attached yet.
                  </Typography>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {deliverableShots.map((s) => (
                      <div
                        key={s.id}
                        className="group relative overflow-hidden rounded-md border border-stroke-muted bg-background"
                      >
                        <a
                          href={s.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <img
                            src={s.fileUrl}
                            alt={s.filename ?? "Deliverable screenshot"}
                            className="h-32 w-full object-cover"
                          />
                        </a>
                        <button
                          type="button"
                          onClick={() => deleteDeliverableScreenshot(s.id)}
                          className="absolute right-1 top-1 rounded bg-red-600/90 px-2 py-0.5 text-white opacity-0 transition group-hover:opacity-100"
                        >
                          <Typography scale="body-sm" as="span">
                            Remove
                          </Typography>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  disabled={busy !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadDeliverableScreenshot(f);
                    e.target.value = "";
                  }}
                />
                {busy === "uploadScreenshot" && (
                  <Typography
                    scale="body-sm"
                    className="text-text-secondary"
                  >
                    Uploading…
                  </Typography>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stroke-muted pt-3">
                <Typography
                  scale="body-sm"
                  className="text-text-secondary"
                >
                  {draftSavedAt
                    ? `Draft saved ${formatDateTime(draftSavedAt)} ET${
                        draftSavedByEmail ? ` by ${draftSavedByEmail}` : ""
                      }`
                    : "No draft saved yet. Saving a draft does not notify the client."}
                </Typography>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={saveDeliveryDraft}
                    disabled={busy !== null}
                  >
                    {busy === "saveDraft" ? "Saving…" : "Save draft"}
                  </Button>
                  <Button
                    type="button"
                    onClick={deliverCycle}
                    disabled={busy !== null}
                  >
                    {busy === "deliver" ? "Delivering…" : "Mark delivered"}
                  </Button>
                </div>
              </div>
            </section>
          )}

        <section className="rounded-md border border-stroke-muted bg-surface-subtle p-4 space-y-2">
          <Typography as="h2" scale="heading-md">
            Decision
          </Typography>
          {cycle.studioReviewNote ? (
            <Field label="Studio note">{cycle.studioReviewNote}</Field>
          ) : null}
          {cycle.studioReviewAttachmentUrl ? (
            <Field label="Studio attachment">
              <a
                href={cycle.studioReviewAttachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {cycle.studioReviewAttachmentUrl}
              </a>
            </Field>
          ) : null}
          {cycle.deliveryDate && (
            <Field label="Delivery date">
              {formatDate(cycle.deliveryDate)}
            </Field>
          )}
          {cycle.acceptedAt && (
            <Field label="Accepted">{formatDateTime(cycle.acceptedAt)} ET</Field>
          )}
          {cycle.declinedAt && (
            <Field label="Declined">{formatDateTime(cycle.declinedAt)} ET</Field>
          )}
          {cycle.depositPaidAt && (
            <Field label="Deposit paid">
              {formatDateTime(cycle.depositPaidAt)} ET
            </Field>
          )}
          {cycle.deliveredAt && (
            <Field label="Delivered">
              {formatDateTime(cycle.deliveredAt)} ET
            </Field>
          )}
          {cycle.expiredAt && (
            <Field label="Expired">{formatDateTime(cycle.expiredAt)} ET</Field>
          )}
          {cycle.stripeDepositInvoiceUrl && (
            <Field label="Deposit invoice">
              <a
                href={cycle.stripeDepositInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {cycle.stripeDepositInvoiceUrl}
              </a>
            </Field>
          )}
          {cycle.stripeFinalInvoiceUrl && (
            <Field label="Final invoice">
              <a
                href={cycle.stripeFinalInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {cycle.stripeFinalInvoiceUrl}
              </a>
            </Field>
          )}
          {cycle.calBookingUrl && (
            <Field label="Check-in booking link">
              <a
                href={cycle.calBookingUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {cycle.calBookingUrl}
              </a>
            </Field>
          )}
          {cycle.figmaFileUrl && (
            <Field label="Figma file">
              <a
                href={cycle.figmaFileUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {cycle.figmaFileUrl}
              </a>
            </Field>
          )}
          {cycle.loomWalkthroughUrl && (
            <Field label="Walkthrough Loom">
              <a
                href={cycle.loomWalkthroughUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {cycle.loomWalkthroughUrl}
              </a>
            </Field>
          )}
          {cycle.engineeringNotes && (
            <Field label="Engineering notes">{cycle.engineeringNotes}</Field>
          )}
          {deliverableShots.length > 0 && (
            <Field label="Screenshots">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mt-1">
                {deliverableShots.map((s) => (
                  <a
                    key={s.id}
                    href={s.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-md border border-stroke-muted"
                  >
                    <img
                      src={s.fileUrl}
                      alt={s.filename ?? "Deliverable screenshot"}
                      className="h-32 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </Field>
          )}
        </section>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Typography scale="body-sm" as="span" className="font-semibold opacity-70">
        {label}
      </Typography>
      <Typography className="whitespace-pre-wrap">{children}</Typography>
    </div>
  );
}

function ScreenCard({
  screen,
  editable,
  onPatch,
  onDelete,
}: {
  screen: CycleScreen;
  editable: boolean;
  onPatch: (patch: Partial<CycleScreen>) => Promise<void>;
  onDelete: () => void | Promise<void>;
}) {
  const [name, setName] = useState(screen.name ?? "");
  const [notes, setNotes] = useState(screen.notes ?? "");
  const [adminNote, setAdminNote] = useState(screen.adminNote ?? "");
  const [saving, setSaving] = useState(false);

  async function commit(patch: Partial<CycleScreen>) {
    setSaving(true);
    try {
      await onPatch(patch);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-stroke-muted bg-surface-subtle p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center rounded border px-2 py-0.5 ${
            screen.addedBy === "admin"
              ? "border-blue-200 bg-blue-100 text-blue-800"
              : "border-stroke-muted bg-background text-text-secondary"
          }`}
        >
          <Typography scale="body-sm" as="span">
            {screen.addedBy === "admin" ? "Added by studio" : "From client"}
          </Typography>
        </span>
        {editable && (
          <button
            type="button"
            onClick={onDelete}
            className="text-semantic-danger hover:underline"
          >
            <Typography scale="body-sm" as="span">
              Remove
            </Typography>
          </button>
        )}
      </div>

      {editable ? (
        <>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if ((screen.name ?? "") !== name) commit({ name: name || null });
            }}
            placeholder="Screen name"
            className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-text-primary"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if ((screen.notes ?? "") !== notes)
                commit({ notes: notes || null });
            }}
            placeholder="Notes"
            rows={3}
            className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-text-primary"
          />
          {screen.addedBy === "admin" && (
            <input
              type="text"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              onBlur={() => {
                if ((screen.adminNote ?? "") !== adminNote)
                  commit({ adminNote: adminNote || null });
              }}
              placeholder="Why studio added this (e.g. 'spotted in your recording at 1:23')"
              className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-text-primary"
            />
          )}
        </>
      ) : (
        <>
          <Typography className="font-semibold">
            {screen.name ?? "(no name)"}
          </Typography>
          {screen.notes && (
            <Typography className="whitespace-pre-wrap">
              {screen.notes}
            </Typography>
          )}
          {screen.adminNote && (
            <Typography
              scale="body-sm"
              className="text-text-secondary italic"
            >
              Studio note: {screen.adminNote}
            </Typography>
          )}
        </>
      )}

      {screen.screenshotUrl && (
        <a
          href={screen.screenshotUrl}
          target="_blank"
          rel="noreferrer"
          className="block"
        >
          <img
            src={screen.screenshotUrl}
            alt={screen.name ?? "Screenshot"}
            className="max-h-64 rounded border border-stroke-muted"
          />
        </a>
      )}

      {saving && (
        <Typography scale="body-sm" className="text-text-secondary">
          Saving…
        </Typography>
      )}
    </div>
  );
}

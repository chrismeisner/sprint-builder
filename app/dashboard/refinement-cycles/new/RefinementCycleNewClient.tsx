"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Typography from "@/components/ui/Typography";
import { useToast } from "@/lib/toast-context";
import type {
  RefinementCycleRate,
  RefinementCycleRateOption,
} from "@/lib/refinementCycle";
import type { ProjectOption, ProjectMember } from "./page";

type ScreenDraft = {
  clientId: string;
  name: string;
  notes: string;
  screenshot: File | null;
};

type Props = {
  projects: ProjectOption[];
  membersByProject: Record<string, ProjectMember[]>;
  preselectedProjectId: string | null;
  submitterEmail: string;
  submitterName: string | null;
  preferredDeliveryOptions: string[];
  rateOptions: RefinementCycleRateOption[];
  defaultRate: RefinementCycleRate;
};

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatPreferredDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map((n) => Number(n));
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const MAX_SCREENS = 20;
const MAX_SCREENSHOT_BYTES = 25 * 1024 * 1024;
const ALLOWED_SCREENSHOT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
]);
const SCREENSHOT_ACCEPT_ATTR = "image/png,image/jpeg,application/pdf";
const SCREENSHOT_HINT = "PNG, JPG, or PDF — drag and drop or click to upload";

function makeClientId(): string {
  return `tmp_${Math.random().toString(36).slice(2, 10)}`;
}

function emptyScreen(): ScreenDraft {
  return {
    clientId: makeClientId(),
    name: "",
    notes: "",
    screenshot: null,
  };
}

export default function RefinementCycleNewClient({
  projects,
  membersByProject,
  preselectedProjectId,
  submitterEmail,
  submitterName,
  preferredDeliveryOptions,
  rateOptions,
  defaultRate,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();

  const [projectId, setProjectId] = useState<string>(
    preselectedProjectId && projects.some((p) => p.id === preselectedProjectId)
      ? preselectedProjectId
      : projects[0]?.id ?? ""
  );
  const [title, setTitle] = useState("");
  const [screenRecordingUrl, setScreenRecordingUrl] = useState("");
  const [screens, setScreens] = useState<ScreenDraft[]>([emptyScreen()]);
  const [whatsWorking, setWhatsWorking] = useState("");
  const [whatsNotWorking, setWhatsNotWorking] = useState("");
  const [successLooksLike, setSuccessLooksLike] = useState("");
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState<string>(
    preferredDeliveryOptions[0] ?? ""
  );
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [rate, setRate] = useState<RefinementCycleRate>(defaultRate);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedRate =
    rateOptions.find((r) => r.id === rate) ?? rateOptions[rateOptions.length - 1];

  const availableCcMembers: ProjectMember[] = useMemo(
    () => (projectId ? membersByProject[projectId] ?? [] : []),
    [projectId, membersByProject]
  );

  // When the project changes, drop any CC selections that aren't members of
  // the new project.
  useEffect(() => {
    setCcEmails((prev) => {
      const allowed = new Set(
        availableCcMembers.map((m) => m.email.toLowerCase())
      );
      return prev.filter((e) => allowed.has(e.toLowerCase()));
    });
  }, [availableCcMembers]);

  function toggleCc(email: string) {
    setCcEmails((prev) =>
      prev.some((e) => e.toLowerCase() === email.toLowerCase())
        ? prev.filter((e) => e.toLowerCase() !== email.toLowerCase())
        : [...prev, email]
    );
  }

  const hasProjects = projects.length > 0;

  function updateScreen(clientId: string, patch: Partial<ScreenDraft>) {
    setScreens((prev) =>
      prev.map((s) => (s.clientId === clientId ? { ...s, ...patch } : s))
    );
  }

  function addScreen() {
    if (screens.length >= MAX_SCREENS) {
      showToast(`Up to ${MAX_SCREENS} screens per submission`, "warning");
      return;
    }
    setScreens((prev) => [...prev, emptyScreen()]);
  }

  function removeScreen(clientId: string) {
    setScreens((prev) =>
      prev.length === 1 ? prev : prev.filter((s) => s.clientId !== clientId)
    );
  }

  function handleScreenshotPick(clientId: string, file: File | null) {
    if (!file) {
      updateScreen(clientId, { screenshot: null });
      return;
    }
    if (!ALLOWED_SCREENSHOT_TYPES.has(file.type)) {
      showToast("Screenshot must be PNG, JPG, or PDF", "error");
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      showToast("Screenshot must be under 25 MB", "error");
      return;
    }
    updateScreen(clientId, { screenshot: file });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) {
      showToast("Pick a project before submitting", "warning");
      return;
    }

    const trimmedScreens = screens
      .map((s) => ({
        clientId: s.clientId,
        name: s.name.trim(),
        notes: s.notes.trim(),
        screenshot: s.screenshot,
      }))
      .filter((s) => s.name || s.notes || s.screenshot);

    const hasAnyContent =
      Boolean(screenRecordingUrl.trim()) ||
      trimmedScreens.length > 0 ||
      Boolean(whatsWorking.trim()) ||
      Boolean(whatsNotWorking.trim()) ||
      Boolean(successLooksLike.trim());

    if (!hasAnyContent) {
      showToast("Add at least one piece of context before submitting", "warning");
      return;
    }

    const fd = new FormData();
    fd.set("projectId", projectId);
    if (title.trim()) fd.set("title", title.trim());
    if (screenRecordingUrl.trim()) {
      fd.set("screenRecordingUrl", screenRecordingUrl.trim());
    }
    if (whatsWorking.trim()) fd.set("whatsWorking", whatsWorking.trim());
    if (whatsNotWorking.trim())
      fd.set("whatsNotWorking", whatsNotWorking.trim());
    if (successLooksLike.trim())
      fd.set("successLooksLike", successLooksLike.trim());
    if (preferredDeliveryDate) {
      fd.set("preferredDeliveryDate", preferredDeliveryDate);
    }
    if (ccEmails.length > 0) {
      fd.set("ccEmails", JSON.stringify(ccEmails));
    }
    fd.set("rate", rate);

    fd.set(
      "screens",
      JSON.stringify(
        trimmedScreens.map((s) => ({
          clientId: s.clientId,
          name: s.name || null,
          notes: s.notes || null,
          hasScreenshot: Boolean(s.screenshot),
        }))
      )
    );
    for (const s of trimmedScreens) {
      if (s.screenshot) {
        fd.append(`screenshot:${s.clientId}`, s.screenshot);
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/refinement-cycles", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Submission failed");
      }
      await res.json();
      showToast(
        "Refinement cycle submitted — you'll get an email when the studio reviews it",
        "success"
      );
      router.push(`/projects/${projectId}`);
    } catch (err) {
      showToast((err as Error).message, "error");
      setSubmitting(false);
    }
  }

  if (!hasProjects) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Typography as="h1" scale="display-md" className="mb-4">
          New Refinement Cycle
        </Typography>
        <Typography className="mb-6 text-text-secondary">
          You need to be a member of a project before you can submit a refinement
          cycle.
        </Typography>
        <Button as="a" href="/dashboard/projects">
          Go to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8 space-y-6">
        <div className="space-y-2">
          <Typography as="h1" scale="display-md">
            New Refinement Cycle
          </Typography>
          <Typography className="text-text-secondary">
            A fixed-price design refinement. Submit before 3pm Eastern for
            next-day delivery.
          </Typography>
        </div>

        <section className="space-y-2">
          <Typography as="span" scale="body-sm" className="font-semibold">
            Rate
          </Typography>
          <div className="grid gap-2 sm:grid-cols-2">
            {rateOptions.map((opt) => {
              const isActive = rate === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`cursor-pointer rounded-md border p-3 transition ${
                    isActive
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-stroke-muted bg-surface-subtle hover:bg-surface-strong"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="rate"
                      value={opt.id}
                      checked={isActive}
                      onChange={() => setRate(opt.id)}
                      className="mt-1"
                    />
                    <div className="flex flex-col">
                      <Typography as="span" className="font-semibold">
                        {opt.label} — {formatUsd(opt.totalPrice)}
                      </Typography>
                      <Typography
                        scale="body-sm"
                        className="text-text-secondary"
                      >
                        {opt.blurb} {formatUsd(opt.depositAmount)} deposit +{" "}
                        {formatUsd(opt.finalAmount)} on delivery.
                      </Typography>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-md border border-stroke-muted bg-surface-subtle p-4 space-y-2">
          <Typography as="h2" scale="heading-md">
            How it works
          </Typography>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              <Typography as="span">
                Submit your cycle — scope, screens, and how you&rsquo;d like the
                experience to feel.
              </Typography>
            </li>
            <li>
              <Typography as="span">
                The studio reviews and decides by 5pm Eastern — accepted (with
                a note + Stripe deposit invoice + optional check-in link) or
                declined. You&rsquo;ll know either way before close of business.
              </Typography>
            </li>
            <li>
              <Typography as="span">
                Pay the {formatUsd(selectedRate.depositAmount)} deposit by 10am
                ET on delivery day to lock the slot.
              </Typography>
            </li>
            <li>
              <Typography as="span">
                Receive Figma file, walkthrough Loom, and engineering notes by
                5pm ET on delivery day, alongside the{" "}
                {formatUsd(selectedRate.finalAmount)} final invoice.
              </Typography>
            </li>
          </ol>
          <div className="mt-3 border-t border-stroke-muted pt-3">
            <Typography scale="body-sm" className="italic">
              <span className="font-semibold not-italic">
                Cycles end at delivery.
              </span>{" "}
              Further changes are submitted as a new cycle.
            </Typography>
          </div>
        </section>

        <section className="rounded-md border border-stroke-muted bg-surface-subtle p-4 space-y-3">
          <Typography as="h2" scale="heading-md">
            The Hill
          </Typography>
          <Typography>
            Every feature travels a hill.{" "}
            <span className="font-semibold">Uphill:</span> UX, prototyping,
            defining how it works.{" "}
            <span className="font-semibold">Over the top:</span> UX locks.{" "}
            <span className="font-semibold">Downhill:</span> UI polish,
            branding, refinement.
          </Typography>
          <Typography>
            A Refinement Cycle pushes your feature as far across that hill as
            one day allows. The further up the hill you hand off, the further
            down the other side you&rsquo;ll get back.
          </Typography>
          <ul className="space-y-2 pl-5 list-disc">
            <li>
              <Typography as="span">
                <span className="font-semibold">Hand off mid-uphill</span>{" "}
                (rough prototype, UX still loose) → cycle finishes the uphill,
                may not reach polish.
              </Typography>
            </li>
            <li>
              <Typography as="span">
                <span className="font-semibold">Hand off at the peak</span>{" "}
                (UX locked, ready for refinement) → cycle delivers fully
                polished, ship-ready output.
              </Typography>
            </li>
            <li>
              <Typography as="span">
                <span className="font-semibold">Hand off mid-downhill</span>{" "}
                (mostly polished, needs a final pass) → cycle takes it the rest
                of the way.
              </Typography>
            </li>
          </ul>
          <div className="border-t border-stroke-muted pt-3 space-y-2">
            <Typography scale="body-sm" className="italic text-text-secondary">
              Same studio methodology as our two-week sprints — just compressed
              to one day per chunk of hill.
            </Typography>
            <Typography scale="body-sm">
              <a
                href="/refinement-cycle"
                target="_blank"
                rel="noreferrer"
                className="underline hover:opacity-80"
              >
                Drag the hill →
              </a>
            </Typography>
          </div>
        </section>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-md border border-stroke-muted bg-surface-subtle p-4 space-y-1">
          <Typography scale="body-sm" as="span" className="font-semibold opacity-70">
            Submitting as
          </Typography>
          <Typography>
            {submitterName ? (
              <>
                {submitterName}{" "}
                <span className="text-text-secondary">
                  ({submitterEmail})
                </span>
              </>
            ) : (
              submitterEmail
            )}
          </Typography>
          <Typography scale="body-sm" className="text-text-secondary">
            Acceptance, deposit, check-in, and delivery emails will all be sent
            to this address. Sign in as a different account if that&rsquo;s
            wrong.
          </Typography>
        </section>

        <section className="space-y-2">
          <label
            htmlFor="rc-project"
            className="block text-sm font-semibold text-text-primary"
          >
            Project
          </label>
          <select
            id="rc-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-md border border-stroke-muted bg-surface-subtle px-3 py-2 text-text-primary"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji ? `${p.emoji} ` : ""}
                {p.name}
              </option>
            ))}
          </select>
        </section>

        {availableCcMembers.length > 0 && (
          <section className="space-y-2">
            <Typography as="span" scale="body-sm" className="font-semibold">
              CC team members
            </Typography>
            <Typography scale="body-sm" className="text-text-secondary">
              Pick anyone you want looped into the back-and-forth with the
              studio (acceptance, deposit, check-in, delivery emails). They
              don&rsquo;t have to be the one who pays.
            </Typography>
            <div className="space-y-1 rounded-md border border-stroke-muted bg-surface-subtle p-3">
              {availableCcMembers.map((member) => {
                const checked = ccEmails.some(
                  (e) => e.toLowerCase() === member.email.toLowerCase()
                );
                return (
                  <label
                    key={member.email}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCc(member.email)}
                    />
                    <Typography as="span">
                      {member.displayName ? (
                        <>
                          {member.displayName}{" "}
                          <span className="text-text-secondary">
                            ({member.email})
                          </span>
                        </>
                      ) : (
                        member.email
                      )}
                    </Typography>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-2">
          <label
            htmlFor="rc-title"
            className="block text-sm font-semibold text-text-primary"
          >
            Title
          </label>
          <Typography scale="body-sm" className="text-text-secondary">
            A short label for this cycle so you can find it later (e.g.
            &ldquo;Trip summary&rdquo;).
          </Typography>
          <input
            id="rc-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Trip summary"
            className="w-full rounded-md border border-stroke-muted bg-surface-subtle px-3 py-2 text-text-primary"
          />
        </section>

        <section className="space-y-2">
          <label
            htmlFor="rc-recording"
            className="block text-sm font-semibold text-text-primary"
          >
            Screen recording URL
          </label>
          <Typography scale="body-sm" className="text-text-secondary">
            Loom, Figma video, iCloud share, or any link that walks through the
            feature. Optional but strongly recommended.
          </Typography>
          <input
            id="rc-recording"
            type="url"
            value={screenRecordingUrl}
            onChange={(e) => setScreenRecordingUrl(e.target.value)}
            placeholder="https://www.loom.com/share/..."
            className="w-full rounded-md border border-stroke-muted bg-surface-subtle px-3 py-2 text-text-primary"
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Typography as="h2" scale="heading-md">
              Screens in scope
            </Typography>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addScreen}
              disabled={screens.length >= MAX_SCREENS}
            >
              Add screen
            </Button>
          </div>
          <Typography scale="body-sm" className="text-text-secondary">
            One row per deliverable in scope — a screen, state, widget, or
            component. Use the notes to call out specific elements on each
            screen or state we&rsquo;re refining. Screenshots help the studio
            ground the deliverable.
          </Typography>

          <div className="space-y-3">
            {screens.map((screen, idx) => (
              <div
                key={screen.clientId}
                className="rounded-md border border-stroke-muted bg-surface-subtle p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Typography scale="body-sm" className="font-semibold">
                    Screen {idx + 1}
                  </Typography>
                  {screens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeScreen(screen.clientId)}
                      className="text-sm text-semantic-danger hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor={`rc-screen-name-${screen.clientId}`}
                    className="block text-sm font-semibold text-text-primary"
                  >
                    Name
                  </label>
                  <input
                    id={`rc-screen-name-${screen.clientId}`}
                    type="text"
                    value={screen.name}
                    onChange={(e) =>
                      updateScreen(screen.clientId, { name: e.target.value })
                    }
                    placeholder="Screen, state, widget, or component (e.g. Settings → Billing, empty-state card)"
                    className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor={`rc-screen-notes-${screen.clientId}`}
                    className="block text-sm font-semibold text-text-primary"
                  >
                    Notes
                  </label>
                  <textarea
                    id={`rc-screen-notes-${screen.clientId}`}
                    value={screen.notes}
                    onChange={(e) =>
                      updateScreen(screen.clientId, { notes: e.target.value })
                    }
                    placeholder="Call out specific widgets, components, or states on this screen that are part of the deliverable."
                    rows={3}
                    className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-text-primary"
                  />
                </div>
                <ScreenshotDropzone
                  file={screen.screenshot}
                  onPick={(f) => handleScreenshotPick(screen.clientId, f)}
                  onClear={() => updateScreen(screen.clientId, { screenshot: null })}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <label
            htmlFor="rc-working"
            className="block text-sm font-semibold text-text-primary"
          >
            What&rsquo;s working
          </label>
          <textarea
            id="rc-working"
            value={whatsWorking}
            onChange={(e) => setWhatsWorking(e.target.value)}
            rows={3}
            placeholder="What's already good and shouldn't change?"
            className="w-full rounded-md border border-stroke-muted bg-surface-subtle px-3 py-2 text-text-primary"
          />
        </section>

        <section className="space-y-2">
          <label
            htmlFor="rc-not-working"
            className="block text-sm font-semibold text-text-primary"
          >
            What&rsquo;s not working
          </label>
          <textarea
            id="rc-not-working"
            value={whatsNotWorking}
            onChange={(e) => setWhatsNotWorking(e.target.value)}
            rows={3}
            placeholder="What's broken, confusing, or in the way?"
            className="w-full rounded-md border border-stroke-muted bg-surface-subtle px-3 py-2 text-text-primary"
          />
        </section>

        <section className="space-y-2">
          <label
            htmlFor="rc-success"
            className="block text-sm font-semibold text-text-primary"
          >
            What does success look like
          </label>
          <Typography scale="body-sm" className="text-text-secondary">
            How should the experience feel? Focus on what the user thinks and
            feels.
          </Typography>
          <textarea
            id="rc-success"
            value={successLooksLike}
            onChange={(e) => setSuccessLooksLike(e.target.value)}
            rows={3}
            placeholder="e.g. effortless to scan, confidence that nothing's missing, feels lighter than the current flow"
            className="w-full rounded-md border border-stroke-muted bg-surface-subtle px-3 py-2 text-text-primary"
          />
        </section>

        {preferredDeliveryOptions.length > 0 && (
          <section className="space-y-2">
            <label
              htmlFor="rc-preferred-date"
              className="block text-sm font-semibold text-text-primary"
            >
              Delivery date
            </label>
            <Typography scale="body-sm" className="text-text-secondary">
              If the studio accepts your cycle, we&rsquo;ll deliver by the date
              you pick.
            </Typography>
            <select
              id="rc-preferred-date"
              value={preferredDeliveryDate}
              onChange={(e) => setPreferredDeliveryDate(e.target.value)}
              className="w-full rounded-md border border-stroke-muted bg-surface-subtle px-3 py-2 text-text-primary"
            >
              {preferredDeliveryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {formatPreferredDate(opt)}
                </option>
              ))}
            </select>
          </section>
        )}

        <div className="space-y-4 border-t border-stroke-muted pt-6">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-stroke-muted bg-surface-subtle p-3">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1"
            />
            <Typography scale="body-sm">
              By submitting, I understand the studio will review by 5pm ET and
              email me {submitterEmail} with their decision. If accepted,
              I&rsquo;ll receive a deposit invoice and an optional check-in
              link. The cycle is confirmed once the{" "}
              {formatUsd(selectedRate.depositAmount)} deposit is paid by 10am
              ET on the delivery date.
            </Typography>
          </label>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !projectId || !acknowledged}
            >
              {submitting ? "Submitting…" : "Submit refinement cycle"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ScreenshotDropzone({
  file,
  onPick,
  onClear,
}: {
  file: File | null;
  onPick: (file: File | null) => void;
  onClear: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0] ?? null;
    if (dropped) onPick(dropped);
  }

  return (
    <div className="space-y-1">
      <Typography as="span" scale="body-sm" className="font-semibold">
        Screenshot{" "}
        <span className="text-text-secondary font-normal">(optional)</span>
      </Typography>
      {file ? (
        <div className="flex items-center justify-between rounded-md border border-stroke-muted bg-background px-3 py-2">
          <div className="flex flex-col">
            <Typography scale="body-sm">{file.name}</Typography>
            <Typography scale="body-sm" className="text-text-secondary">
              {Math.round(file.size / 1024)} KB
            </Typography>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-semantic-danger hover:underline"
          >
            <Typography scale="body-sm" as="span">
              Remove
            </Typography>
          </button>
        </div>
      ) : (
        <label
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragActive) setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-4 py-6 text-center transition ${
            dragActive
              ? "border-brand-primary bg-brand-primary/5"
              : "border-stroke-muted bg-background hover:bg-surface-subtle"
          }`}
        >
          <input
            type="file"
            accept={SCREENSHOT_ACCEPT_ATTR}
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
          <Typography scale="body-sm">
            Drop a screenshot here or click to upload
          </Typography>
          <Typography scale="body-sm" className="text-text-secondary">
            {SCREENSHOT_HINT}
          </Typography>
        </label>
      )}
    </div>
  );
}

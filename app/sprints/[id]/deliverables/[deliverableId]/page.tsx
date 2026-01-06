import { ensureSchema, getPool } from "@/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";
import { getCurrentUser } from "@/lib/auth";
import { hoursFromPoints } from "@/lib/pricing";
import SprintDeliverableContent from "./SprintDeliverableContent";
import DeliverableTypeSection from "./DeliverableTypeSection";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string; deliverableId: string };
};

type NumericLike = number | string | null;

function toNumber(value: NumericLike): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export default async function SprintDeliverableDetailPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/login?redirect=${encodeURIComponent(`/sprints/${params.id}/deliverables/${params.deliverableId}`)}`);
  }

  // Fetch the sprint deliverable with both sprint and global deliverable info
  const result = await pool.query(
    `SELECT 
      spd.id as sprint_deliverable_id,
      spd.sprint_draft_id,
      spd.deliverable_id,
      spd.quantity,
      spd.deliverable_name,
      spd.deliverable_description,
      spd.deliverable_category,
      spd.deliverable_scope,
      spd.base_points,
      spd.custom_hours,
      spd.custom_estimate_points,
      spd.complexity_score,
      spd.custom_scope,
      spd.notes,
      spd.content,
      spd.attachments,
      spd.type_data,
      spd.current_version,
      spd.created_at as spd_created_at,
      -- Global deliverable fields
      d.id as global_id,
      d.name as global_name,
      d.description as global_description,
      d.category as global_category,
      d.scope as global_scope,
      d.format as global_format,
      d.points as global_points,
      d.presentation_content,
      d.example_images,
      d.slug as global_slug,
      -- Sprint fields
      sd.id as sprint_id,
      sd.title as sprint_title,
      sd.status as sprint_status,
      sd.project_id,
      doc.account_id,
      doc.email
     FROM sprint_deliverables spd
     LEFT JOIN deliverables d ON spd.deliverable_id = d.id
     JOIN sprint_drafts sd ON spd.sprint_draft_id = sd.id
     JOIN documents doc ON sd.document_id = doc.id
     WHERE spd.id = $1 AND sd.id = $2`,
    [params.deliverableId, params.id]
  );

  if (result.rowCount === 0) {
    notFound();
  }

  const row = result.rows[0];

  // Check permissions
  const isOwner = row.account_id === currentUser.accountId;
  const isAdmin = currentUser?.isAdmin === true;
  const projectId = row.project_id;
  
  let isProjectMember = false;
  if (projectId) {
    const memberRes = await pool.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
      [projectId, currentUser.email]
    );
    isProjectMember = Boolean(memberRes?.rowCount && memberRes.rowCount > 0);
  }

  if (!isOwner && !isAdmin && !isProjectMember) {
    redirect(`/login?redirect=${encodeURIComponent(`/sprints/${params.id}/deliverables/${params.deliverableId}`)}`);
  }

  // Build the deliverable data
  const deliverable = {
    sprintDeliverableId: row.sprint_deliverable_id as string,
    deliverableId: row.deliverable_id as string | null,
    name: (row.deliverable_name as string | null) ?? (row.global_name as string | null) ?? "Untitled Deliverable",
    description: (row.deliverable_description as string | null) ?? (row.global_description as string | null),
    category: (row.deliverable_category as string | null) ?? (row.global_category as string | null),
    scope: (row.custom_scope as string | null) ?? (row.deliverable_scope as string | null) ?? (row.global_scope as string | null),
    format: row.global_format as string | null,
    basePoints: toNumber(row.base_points) ?? toNumber(row.global_points),
    customPoints: toNumber(row.custom_estimate_points),
    complexityScore: toNumber(row.complexity_score) ?? 1.0,
    customHours: toNumber(row.custom_hours),
    notes: row.notes as string | null,
    content: row.content as string | null,
    attachments: row.attachments as string[] | null,
    typeData: row.type_data as Record<string, unknown> | null,
    currentVersion: (row.current_version as string | null) ?? "0.0",
    // Global template info
    presentationContent: row.presentation_content as string | null,
    exampleImages: row.example_images as string[] | null,
    globalSlug: row.global_slug as string | null,
  };

  const sprint = {
    id: row.sprint_id as string,
    title: (row.sprint_title as string | null) ?? `Sprint ${(row.sprint_id as string).slice(0, 8)}`,
    status: row.sprint_status as string | null,
  };

  const effectivePoints = deliverable.customPoints ?? (deliverable.basePoints ? deliverable.basePoints * (deliverable.complexityScore ?? 1) : null);
  const effectiveHours = deliverable.customHours ?? (effectivePoints ? hoursFromPoints(effectivePoints) : null);

  const t = {
    pageTitle: typography.headingSection,
    subhead: `${getTypographyClassName("body-sm")} text-text-secondary`,
    body: `${getTypographyClassName("body-md")} text-text-secondary`,
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    label: `${getTypographyClassName("subtitle-sm")} text-text-muted`,
    monoLabel: `${getTypographyClassName("mono-sm")} text-text-muted`,
    sectionHeading: `${getTypographyClassName("h3")} text-text-primary`,
    cardHeading: typography.headingCard,
  };

  const scopeLines = deliverable.scope
    ? deliverable.scope.split("\n").map((l) => l.trim()).filter(Boolean)
    : [];

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-8">
      {/* Breadcrumb */}
      <nav className={`flex items-center gap-2 ${t.bodySm}`}>
        <Link href={`/sprints/${params.id}`} className="hover:underline">
          ← {sprint.title}
        </Link>
        <span className="opacity-50">/</span>
        <span>Deliverable</span>
      </nav>

      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center rounded-full bg-black/10 dark:bg-white/10 px-3 py-1 ${getTypographyClassName("mono-sm")} text-black/70 dark:text-white/60`}>
                {deliverable.category ?? "Deliverable"}
              </span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                sprint.status === "complete" 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                  : sprint.status === "in_progress"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                    : "bg-black/10 dark:bg-white/10"
              }`}>
                Sprint: {sprint.status || "draft"}
              </span>
            </div>
            <h1 className={t.pageTitle}>{deliverable.name}</h1>
            {deliverable.description && (
              <p className={t.body}>{deliverable.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="rounded-xl bg-black/5 dark:bg-white/5 px-4 py-3 text-center">
              <p className={t.monoLabel}>Points</p>
              <p className="text-2xl font-bold">{effectivePoints?.toFixed(1) ?? "—"}</p>
            </div>
            {effectiveHours && (
              <p className={t.bodySm}>{effectiveHours.toFixed(1)} hours est.</p>
            )}
          </div>
        </div>

        {/* Link to global template */}
        {deliverable.deliverableId && (
          <Link
            href={`/deliverables/${deliverable.globalSlug || deliverable.deliverableId}`}
            className={`inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition ${getTypographyClassName("button-sm")}`}
          >
            <span>View deliverable template</span>
            <span className="opacity-50">→</span>
          </Link>
        )}
      </header>

      {/* Sprint-Specific Content */}
      <SprintDeliverableContent
        sprintDeliverableId={deliverable.sprintDeliverableId}
        sprintId={params.id}
        initialContent={deliverable.content}
        initialNotes={deliverable.notes}
        canEdit={isOwner || isAdmin}
        sprintStatus={sprint.status}
      />

      {/* Deliverable Type-Specific Section */}
      <DeliverableTypeSection
        sprintDeliverableId={deliverable.sprintDeliverableId}
        sprintId={params.id}
        deliverableName={deliverable.name}
        deliverableSlug={deliverable.globalSlug}
        initialTypeData={deliverable.typeData}
        initialVersion={deliverable.currentVersion}
        canEdit={isOwner || isAdmin}
        mode="sprint"
      />

      {/* Scope for this sprint */}
      {scopeLines.length > 0 && (
        <section className="rounded-xl border border-black/10 dark:border-white/15 p-6 space-y-4 bg-white/40 dark:bg-black/40">
          <h2 className={t.sectionHeading}>Scope</h2>
          <ul className="space-y-2">
            {scopeLines.map((line, i) => (
              <li key={i} className={`flex items-start gap-2 ${t.bodySm}`}>
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span>{line.replace(/^[•\-]\s*/, "")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Notes */}
      {deliverable.notes && (
        <section className="rounded-xl border border-black/10 dark:border-white/15 p-6 space-y-4 bg-white/40 dark:bg-black/40">
          <h2 className={t.sectionHeading}>Notes</h2>
          <div className={`whitespace-pre-wrap ${t.bodySm}`}>{deliverable.notes}</div>
        </section>
      )}

      {/* How We Present This (from global template) */}
      {deliverable.presentationContent && (
        <section className="rounded-xl border border-dashed border-black/20 dark:border-white/20 p-6 space-y-4 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <h2 className={t.sectionHeading}>Presentation Guidelines</h2>
            <span className={`${t.monoLabel} text-xs`}>From template</span>
          </div>
          <div className={`prose prose-sm dark:prose-invert max-w-none ${t.bodySm}`}>
            {deliverable.presentationContent.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>
      )}

      {/* Example Images from template */}
      {deliverable.exampleImages && deliverable.exampleImages.length > 0 && (
        <section className="rounded-xl border border-dashed border-black/20 dark:border-white/20 p-6 space-y-4 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <h2 className={t.sectionHeading}>Reference Examples</h2>
            <span className={`${t.monoLabel} text-xs`}>From template</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {deliverable.exampleImages.map((url, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-black/10 dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`${deliverable.name} example ${i + 1}`} className="w-full h-auto" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="pt-4 flex items-center gap-4">
        <Link
          href={`/sprints/${params.id}`}
          className={`inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition ${getTypographyClassName("button-sm")}`}
        >
          ← Back to sprint
        </Link>
        {deliverable.deliverableId && (
          <Link
            href={`/deliverables/${deliverable.globalSlug || deliverable.deliverableId}`}
            className={`inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition ${getTypographyClassName("button-sm")}`}
          >
            View template →
          </Link>
        )}
      </div>
    </main>
  );
}


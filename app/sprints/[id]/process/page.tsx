import { ensureSchema, getPool } from "@/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";
import { SPRINT_WEEKS, ENGAGEMENT_BADGES } from "@/lib/sprintProcess";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function SprintProcessPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();

  // Get current user if logged in
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/login?redirect=${encodeURIComponent(`/sprints/${params.id}/process`)}`);
  }

  // Fetch sprint with document info including account_id and email
  const result = await pool.query(
    `SELECT sd.id, sd.title, sd.status, sd.weeks, sd.start_date, sd.due_date,
            sd.project_id, sd.draft,
            d.email, d.account_id, d.project_id AS document_project_id
     FROM sprint_drafts sd
     JOIN documents d ON sd.document_id = d.id
     WHERE sd.id = $1`,
    [params.id]
  );
  if (result.rowCount === 0) {
    notFound();
  }
  const row = result.rows[0] as {
    id: string;
    title: string | null;
    status: string | null;
    weeks: number | null;
    start_date: string | Date | null;
    due_date: string | Date | null;
    project_id: string | null;
    document_project_id: string | null;
    draft: Record<string, unknown> | null;
    email: string | null;
    account_id: string | null;
  };

  // Check if current user owns this sprint or is a member of the linked project
  const isOwner = row.account_id === currentUser.accountId;
  const projectId = row.project_id || row.document_project_id;
  const memberRes =
    projectId
      ? await pool.query(
          `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
          [projectId, currentUser.email]
        )
      : null;
  const isProjectMember = Boolean(memberRes?.rowCount && memberRes.rowCount > 0);
  const isAdmin = currentUser?.isAdmin === true;

  if (!isOwner && !isAdmin && !isProjectMember) {
    redirect(`/login?redirect=${encodeURIComponent(`/sprints/${params.id}/process`)}`);
  }

  // Get sprint title from draft if not in title field
  const sprintTitle =
    row.title ||
    (row.draft && typeof row.draft === "object" && "sprintTitle" in row.draft
      ? String(row.draft.sprintTitle)
      : null) ||
    "Sprint";

  const t = {
    pageTitle: typography.headingSection,
    subhead: `${getTypographyClassName("body-sm")} text-text-secondary`,
    body: `${getTypographyClassName("body-md")} text-text-secondary`,
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    label: `${getTypographyClassName("subtitle-sm")} text-text-muted`,
    monoLabel: `${getTypographyClassName("mono-sm")} text-text-muted`,
    sectionHeading: `${getTypographyClassName("h3")} text-text-primary`,
    cardHeading: typography.headingCard,
    cellText: `${getTypographyClassName("body-sm")} text-text-primary`,
    chip: getTypographyClassName("body-sm"),
  };

  const attitudeThemes = [
    "Understood",
    "Explorative",
    "Excited",
    "Decisive",
    "Aligned",
    "Focused",
    "Inspired",
    "Confident",
    "Meticulous",
    "Proud",
  ];

  const rows = (() => {
    const acc: Array<{
      day: string;
      title: string;
      detail: string;
      engagement: { label: string; variant: "required" | "optional" | "studio"; badge: { icon: string; classes: string } } | null;
      attitude: string;
    }> = [];
    let idx = 0;
    for (const week of SPRINT_WEEKS) {
      for (const day of week.days) {
        const attitude = attitudeThemes[idx] ?? attitudeThemes[attitudeThemes.length - 1];
        acc.push({
          day: day.day,
          title: day.title,
          detail: day.detail,
          engagement: day.engagement
            ? { ...day.engagement, badge: ENGAGEMENT_BADGES[day.engagement.variant] }
            : null,
          attitude,
        });
        idx += 1;
      }
    }
    return acc;
  })();

  return (
    <main className="min-h-screen max-w-6xl mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className={`flex items-center gap-2 ${t.bodySm}`}>
        <Link href={`/sprints/${params.id}`} className="hover:underline">
          ← Back to sprint
        </Link>
      </nav>

      {/* Header */}
      <div className="space-y-2">
        <div className={`inline-flex items-center rounded-full bg-black/10 dark:bg-white/10 px-3 py-1 ${t.chip} text-black/70 dark:text-white/60`}>
          Process
        </div>
        <h1 className={t.pageTitle}>{sprintTitle} — Process</h1>
        <p className={t.body}>
          Every sprint we run follows this exact cadence so you always know when we need you live,
          when feedback is optional, and when the studio is heads down making progress.
        </p>
      </div>

      {/* Sprint Info Bar */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white/40 dark:bg-black/40">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={t.monoLabel}>Duration:</span>
            <span className={t.bodySm}>{row.weeks || 2} weeks</span>
          </div>
          {row.start_date && (
            <div className="flex items-center gap-2">
              <span className={t.monoLabel}>Starts:</span>
              <span className={t.bodySm}>{new Date(row.start_date).toLocaleDateString()}</span>
            </div>
          )}
          {row.due_date && (
            <div className="flex items-center gap-2">
              <span className={t.monoLabel}>Ends:</span>
              <span className={t.bodySm}>{new Date(row.due_date).toLocaleDateString()}</span>
            </div>
          )}
          <span
            className={`inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 ${getTypographyClassName("subtitle-sm")}`}
          >
            {row.status || "draft"}
          </span>
        </div>
      </section>

      {/* Week Summaries */}
      <div className="grid gap-4 md:grid-cols-2">
        {SPRINT_WEEKS.map((week) => (
          <div
            key={week.id}
            className="rounded-lg border border-black/10 dark:border-white/15 p-5 bg-white/40 dark:bg-black/40 space-y-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{week.icon}</span>
              <h2 className={t.cardHeading}>{week.title}</h2>
            </div>
            <p className={t.bodySm}>{week.summary}</p>
            <div className={`inline-flex items-center rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 px-3 py-1 ${t.chip}`}>
              {week.highlight}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Day-by-Day Table */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-5 bg-white/40 dark:bg-black/40 space-y-4">
        <h2 className={t.sectionHeading}>Day-by-Day Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-black/10 dark:border-white/15 rounded-lg overflow-hidden">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr className={getTypographyClassName("body-sm")}>
                <th className="text-left px-4 py-3 text-text-muted">Day</th>
                <th className="text-left px-4 py-3 text-text-muted">Focus</th>
                <th className="text-left px-4 py-3 text-text-muted">Engagement</th>
                <th className="text-left px-4 py-3 text-text-muted">Attitude</th>
                <th className="text-left px-4 py-3 text-text-muted">Detail</th>
              </tr>
            </thead>
            <tbody className={t.bodySm}>
              {rows.map((row, idx) => (
                <tr
                  key={`${row.day}-${idx}`}
                  className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-gray-950/40"
                >
                  <td className="px-4 py-4 align-top whitespace-nowrap">
                    <div className={`${t.cellText} font-medium`}>{row.day}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className={`${t.cellText} font-medium`}>{row.title}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    {row.engagement && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${t.chip} ${row.engagement.badge.classes}`}
                      >
                        <span>{row.engagement.badge.icon}</span>
                        <span>{row.engagement.label}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className={`${t.cellText} rounded-md px-2 py-1 bg-black/5 dark:bg-white/5 w-fit`}>
                      {row.attitude}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top max-w-md">
                    <div className={t.bodySm}>{row.detail}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Engagement Legend */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-5 bg-white/40 dark:bg-black/40 space-y-4">
        <h2 className={t.cardHeading}>Engagement Legend</h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${t.chip} ${ENGAGEMENT_BADGES.required.classes}`}>
              <span>{ENGAGEMENT_BADGES.required.icon}</span>
              <span>Client input required</span>
            </span>
            <span className={t.bodySm}>— We need you live or with feedback</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${t.chip} ${ENGAGEMENT_BADGES.optional.classes}`}>
              <span>{ENGAGEMENT_BADGES.optional.icon}</span>
              <span>Optional sync</span>
            </span>
            <span className={t.bodySm}>— Available if helpful, not required</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${t.chip} ${ENGAGEMENT_BADGES.studio.classes}`}>
              <span>{ENGAGEMENT_BADGES.studio.icon}</span>
              <span>Studio heads down</span>
            </span>
            <span className={t.bodySm}>— No meetings, we&apos;re building</span>
          </div>
        </div>
      </section>

      {/* Back to sprint link */}
      <div className="pt-4">
        <Link
          href={`/sprints/${params.id}`}
          className={`inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition ${getTypographyClassName("button-sm")}`}
        >
          ← Back to sprint details
        </Link>
      </div>
    </main>
  );
}


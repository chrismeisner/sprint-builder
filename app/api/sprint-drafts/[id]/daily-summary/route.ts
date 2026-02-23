import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

type Params = { params: { id: string } };

export async function POST(_req: Request, { params }: Params) {
  await ensureSchema();
  const pool = getPool();
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sprintId = params.id;

  // ── 1. Fetch sprint details ──
  const sprintRes = await pool.query(
    `SELECT sd.id, sd.title, sd.status, sd.weeks, sd.start_date, sd.due_date,
            sd.total_estimate_points, sd.total_fixed_price, sd.draft,
            sd.project_id, d.email AS client_email, d.project_id AS doc_project_id
     FROM sprint_drafts sd
     LEFT JOIN documents d ON sd.document_id = d.id
     WHERE sd.id = $1`,
    [sprintId]
  );
  if (!sprintRes.rowCount) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }
  const sprint = sprintRes.rows[0] as {
    id: string;
    title: string | null;
    status: string | null;
    weeks: number | null;
    start_date: string | Date | null;
    due_date: string | Date | null;
    total_estimate_points: number | null;
    total_fixed_price: number | null;
    draft: Record<string, unknown> | null;
    project_id: string | null;
    client_email: string | null;
    doc_project_id: string | null;
  };

  const projectId = sprint.project_id || sprint.doc_project_id;

  // ── 2. Fetch deliverables ──
  const deliverablesRes = await pool.query(
    `SELECT COALESCE(spd.deliverable_name, d.name) AS name,
            COALESCE(spd.deliverable_category, d.category) AS category,
            spd.delivery_url
     FROM sprint_deliverables spd
     LEFT JOIN deliverables d ON spd.deliverable_id = d.id
     WHERE spd.sprint_draft_id = $1
     ORDER BY spd.created_at`,
    [sprintId]
  );
  const deliverables = deliverablesRes.rows.map((r) => ({
    name: r.name as string,
    category: r.category as string | null,
    delivered: Boolean(r.delivery_url),
  }));

  // ── 3. Fetch ALL daily updates (sorted chronologically) ──
  const updatesRes = await pool.query(
    `SELECT sdu.sprint_day, sdu.total_days, sdu.frame, sdu.body, sdu.created_at,
            COALESCE(
              NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), ''),
              a.name,
              a.email
            ) AS author_name
     FROM sprint_daily_updates sdu
     JOIN accounts a ON sdu.account_id = a.id
     WHERE sdu.sprint_draft_id = $1
     ORDER BY sdu.sprint_day ASC, sdu.created_at ASC`,
    [sprintId]
  );
  const allUpdates = updatesRes.rows.map((r) => ({
    sprintDay: Number(r.sprint_day),
    totalDays: Number(r.total_days),
    frame: r.frame as string | null,
    body: r.body as string,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : (r.created_at as string),
    authorName: r.author_name as string,
  }));

  if (allUpdates.length === 0) {
    return NextResponse.json(
      { error: "No daily updates to summarize" },
      { status: 400 }
    );
  }

  // ── 4. Fetch sprint links and read any readable text files ──
  const READABLE_MIMETYPES = new Set([
    "text/plain",
    "text/markdown",
    "text/csv",
    "text/tab-separated-values",
    "application/json",
    "application/xml",
    "text/xml",
    "text/html",
  ]);
  const MAX_FILE_CHARS = 8_000; // cap per file to avoid bloating the prompt

  const linksRes = await pool.query(
    `SELECT id, name, link_type, url, file_url, file_name, mimetype, description
     FROM sprint_links
     WHERE sprint_id = $1
     ORDER BY sort_order ASC, created_at DESC`,
    [sprintId]
  ).catch(() => ({ rows: [] }));

  type SprintLinkRow = {
    id: string;
    name: string;
    link_type: "url" | "file";
    url: string | null;
    file_url: string | null;
    file_name: string | null;
    mimetype: string | null;
    description: string | null;
  };

  const sprintLinks = linksRes.rows as SprintLinkRow[];

  // For readable files, try to fetch their text content
  const fileContexts: Array<{ name: string; fileName: string; content: string }> = [];
  for (const link of sprintLinks) {
    if (
      link.link_type === "file" &&
      link.file_url &&
      link.mimetype &&
      READABLE_MIMETYPES.has(link.mimetype.split(";")[0].trim().toLowerCase())
    ) {
      try {
        const fileRes = await fetch(link.file_url, { signal: AbortSignal.timeout(8_000) });
        if (fileRes.ok) {
          const text = await fileRes.text();
          fileContexts.push({
            name: link.name,
            fileName: link.file_name || link.name,
            content: text.slice(0, MAX_FILE_CHARS),
          });
        }
      } catch (err) {
        console.warn(`[Daily Summary] Could not fetch file "${link.name}":`, err);
      }
    }
  }

  // ── 5. Gather project member emails ──
  const recipientEmails: string[] = [];
  if (projectId) {
    const membersRes = await pool.query(
      `SELECT DISTINCT lower(pm.email) AS email
       FROM project_members pm
       WHERE pm.project_id = $1`,
      [projectId]
    );
    for (const r of membersRes.rows) {
      recipientEmails.push(r.email as string);
    }
    // Also include the project owner
    const ownerRes = await pool.query(
      `SELECT a.email FROM projects p JOIN accounts a ON p.account_id = a.id WHERE p.id = $1`,
      [projectId]
    );
    if (ownerRes.rowCount) {
      const ownerEmail = (ownerRes.rows[0].email as string).toLowerCase();
      if (!recipientEmails.includes(ownerEmail)) {
        recipientEmails.push(ownerEmail);
      }
    }
  }
  if (sprint.client_email) {
    const ce = sprint.client_email.toLowerCase();
    if (!recipientEmails.includes(ce)) recipientEmails.push(ce);
  }

  // ── 6. Build context for the AI prompt ──
  const latestDay = Math.max(...allUpdates.map((u) => u.sprintDay));
  const totalDays = allUpdates[0]?.totalDays ?? (sprint.weeks ?? 2) * 5;
  const progressPct = Math.round((latestDay / totalDays) * 100);

  const draft = sprint.draft ?? {};
  const goals = Array.isArray(draft.goals)
    ? (draft.goals as string[]).filter((g) => typeof g === "string")
    : [];

  const contextBlock = `
SPRINT TITLE: ${sprint.title || "Untitled Sprint"}
STATUS: ${sprint.status || "in_progress"}
DURATION: ${sprint.weeks ?? 2} weeks (${totalDays} business days)
START DATE: ${sprint.start_date ? new Date(sprint.start_date as string).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "Not set"}
DUE DATE: ${sprint.due_date ? new Date(sprint.due_date as string).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "Not set"}
PROGRESS: Day ${latestDay} of ${totalDays} (${progressPct}%)

SPRINT GOALS:
${goals.length > 0 ? goals.map((g, i) => `${i + 1}. ${g}`).join("\n") : "No goals defined."}

DELIVERABLES (${deliverables.length} total):
${deliverables.map((d) => `- ${d.name}${d.category ? ` (${d.category})` : ""}${d.delivered ? " [DELIVERED]" : ""}`).join("\n") || "None"}

ALL DAILY UPDATES:
${allUpdates.map((u) => `--- Day ${u.sprintDay}/${u.totalDays}${u.frame ? ` · Frame: ${u.frame}` : ""} (${new Date(u.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}) by ${u.authorName} ---\n${u.body}`).join("\n\n")}
${fileContexts.length > 0 ? `\nSUPPLEMENTAL PROJECT FILES:\n${fileContexts.map((f) => `--- ${f.name} (${f.fileName}) ---\n${f.content}`).join("\n\n")}` : ""}
`.trim();

  // ── 7. Call OpenAI to draft the email ──
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  const systemPrompt = `You are the AI Studio Assistant for Meisner Design, a design/branding sprint studio. You send daily project update emails on behalf of the studio team.

You may be given supplemental project files (briefs, notes, CSVs, etc.) as additional context. If present, use them to enrich the summary — reference relevant details from those files where appropriate, but keep them as background context rather than quoting them directly.

The email should:
- Be warm, professional, and concise (aim for 150-300 words in the body)
- Open with a brief one-liner introducing yourself as "the AI Studio Assistant" — something like "Hi team, this is the AI Studio Assistant with your Day X update." Keep it light and natural, not robotic
- Summarize what was accomplished today (the latest day's update)
- Reference relevant context from prior days to show continuity
- Weave in any relevant details from supplemental project files when it adds value
- Mention which deliverables are in progress or completed
- Include a "What's Next" section with 2-3 bullet points about what to expect
- Sign off as "AI Studio Assistant · Meisner Design"
- Use plain language, no jargon
- Don't use excessive formatting — keep it clean and scannable

Return ONLY a JSON object with these exact keys:
{
  "subject": "the email subject line",
  "body": "the full email body in plain text (use \\n for line breaks)"
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  const openaiProject = process.env.OPENAI_PROJECT_ID;
  const openaiOrg = process.env.OPENAI_ORG_ID;
  if (openaiProject) headers["OpenAI-Project"] = openaiProject;
  if (openaiOrg) headers["OpenAI-Organization"] = openaiOrg;

  let aiRes: Response;
  try {
    aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextBlock },
        ],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if ((err as { name?: string })?.name === "AbortError") {
      return NextResponse.json({ error: "AI request timed out" }, { status: 504 });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!aiRes.ok) {
    const errText = await aiRes.text().catch(() => "");
    console.error("[Daily Summary] OpenAI error", { status: aiRes.status, body: errText.slice(0, 500) });
    return NextResponse.json(
      { error: `AI error: ${aiRes.status}` },
      { status: 502 }
    );
  }

  type ChatCompletion = { choices: Array<{ message: { content: string } }> };
  const aiData = (await aiRes.json()) as ChatCompletion;
  const rawContent = aiData.choices?.[0]?.message?.content ?? "";

  let emailSubject: string;
  let emailBody: string;
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    const parsed = JSON.parse(jsonMatch[0]) as { subject: string; body: string };
    emailSubject = parsed.subject;
    emailBody = parsed.body;
  } catch {
    emailSubject = `${sprint.title || "Sprint"} — Day ${latestDay} Update`;
    emailBody = rawContent;
  }

  // ── 8. Build HTML email ──
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const sprintUrl = `${appUrl}/sprints/${sprintId}`;

  const bodyHtml = emailBody
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
        return `<li style="margin:4px 0;color:#18181b;">${trimmed.replace(/^[-•]\s*/, "")}</li>`;
      }
      if (trimmed.match(/^(what'?s next|next steps|coming up|looking ahead)/i)) {
        return `<p style="margin:16px 0 8px;font-weight:600;color:#18181b;">${trimmed}</p>`;
      }
      return `<p style="margin:8px 0;color:#18181b;">${trimmed}</p>`;
    })
    .join("\n")
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul style="margin:8px 0 8px 20px;padding:0;">${match}</ul>`);

  const progressBar = `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
<tr>
<td style="padding:0;">
  <div style="background-color:#e4e4e7;border-radius:4px;overflow:hidden;height:8px;">
    <div style="background-color:#18181b;height:8px;width:${progressPct}%;border-radius:4px;"></div>
  </div>
  <p style="margin:4px 0 0;font-size:12px;color:#71717a;">Day ${latestDay} of ${totalDays} · ${progressPct}% complete</p>
</td>
</tr>
</table>`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;border:1px solid #e4e4e7;padding:32px;">
<tr><td style="color:#18181b;font-size:15px;line-height:1.6;">

<p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Daily Update · ${sprint.title || "Sprint"}</p>
${progressBar}
<hr style="border:none;border-top:1px solid #e4e4e7;margin:16px 0;">

${bodyHtml}

<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">
<a href="${sprintUrl}" style="display:inline-block;background-color:#18181b;color:#ffffff!important;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;">View Sprint</a>

<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">
<p style="color:#71717a;font-size:13px;margin:0;">AI Studio Assistant · Meisner Design</p>

</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  // ── 8. Parse request body to decide: preview or send ──
  let mode: "preview" | "send" = "preview";
  try {
    const body = await _req.json();
    if (body?.mode === "send") mode = "send";
  } catch {
    // default to preview
  }

  if (mode === "preview") {
    return NextResponse.json({
      subject: emailSubject,
      body: emailBody,
      html,
      recipients: recipientEmails,
      sprintDay: latestDay,
      totalDays,
      fileContexts: fileContexts.map((f) => ({ name: f.name, fileName: f.fileName })),
    });
  }

  // ── 9. Send emails ──
  if (recipientEmails.length === 0) {
    return NextResponse.json(
      { error: "No recipients found. Add project members first." },
      { status: 400 }
    );
  }

  const results: Array<{ email: string; success: boolean; error?: string }> = [];
  for (const email of recipientEmails) {
    const result = await sendEmail({
      to: email,
      subject: emailSubject,
      text: emailBody,
      html,
    });
    results.push({ email, success: result.success, error: result.error });
  }

  return NextResponse.json({
    sent: true,
    subject: emailSubject,
    recipientCount: recipientEmails.length,
    results,
  });
}

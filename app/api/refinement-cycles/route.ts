import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile, getStorage } from "@/lib/storage";
import { onCycleSubmitted } from "@/lib/refinementCycleBilling";
import { randomUUID } from "crypto";

const ALLOWED_SCREENSHOT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
]);
const MAX_SCREENSHOT_BYTES = 25 * 1024 * 1024;
const MAX_SCREENS = 20;
const MAX_TEXT = 5000;

type IncomingScreen = {
  clientId: unknown;
  name: unknown;
  notes: unknown;
  hasScreenshot: unknown;
};

function clipText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_TEXT) : null;
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const fd = await request.formData();
    const projectId = fd.get("projectId");
    if (typeof projectId !== "string" || !projectId.trim()) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const access = await pool.query(
      `
      SELECT p.id
      FROM projects p
      LEFT JOIN project_members pm
        ON pm.project_id = p.id
       AND lower(pm.email) = lower($2)
      WHERE p.id = $1
        AND (p.account_id = $3 OR pm.email IS NOT NULL)
      LIMIT 1
      `,
      [projectId, user.email, user.accountId]
    );
    if (access.rowCount === 0) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    let screensSpec: IncomingScreen[] = [];
    const screensRaw = fd.get("screens");
    if (typeof screensRaw === "string" && screensRaw.trim()) {
      try {
        const parsed = JSON.parse(screensRaw);
        if (Array.isArray(parsed)) {
          screensSpec = parsed.slice(0, MAX_SCREENS) as IncomingScreen[];
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid screens payload" },
          { status: 400 }
        );
      }
    }

    if (getStorage() == null) {
      const wantsUpload = screensSpec.some((s) => s.hasScreenshot === true);
      if (wantsUpload) {
        return NextResponse.json(
          {
            error:
              "File upload is not configured. Set GCS_PROJECT_ID, GCS_BUCKET_NAME, and credentials, or remove screenshots before submitting.",
          },
          { status: 503 }
        );
      }
    }

    const cycleId = randomUUID();

    const screenInserts: Array<{
      id: string;
      name: string | null;
      notes: string | null;
      screenshotUrl: string | null;
      sortOrder: number;
    }> = [];

    let sortOrder = 0;
    for (const spec of screensSpec) {
      const clientId =
        typeof spec.clientId === "string" ? spec.clientId : null;
      const name =
        typeof spec.name === "string" && spec.name.trim()
          ? spec.name.trim().slice(0, 200)
          : null;
      const notes =
        typeof spec.notes === "string" && spec.notes.trim()
          ? spec.notes.trim().slice(0, MAX_TEXT)
          : null;

      let screenshotUrl: string | null = null;
      if (spec.hasScreenshot === true && clientId) {
        const file = fd.get(`screenshot:${clientId}`);
        if (file instanceof File && file.size > 0) {
          if (!ALLOWED_SCREENSHOT_TYPES.has(file.type)) {
            return NextResponse.json(
              { error: `Unsupported screenshot type: ${file.type}` },
              { status: 400 }
            );
          }
          if (file.size > MAX_SCREENSHOT_BYTES) {
            return NextResponse.json(
              { error: "Screenshot exceeds 25 MB" },
              { status: 400 }
            );
          }
          const buffer = Buffer.from(await file.arrayBuffer());
          screenshotUrl = await uploadFile(buffer, file.name, file.type, {
            prefix: `refinement-cycles/${cycleId}/screens`,
          });
        }
      }

      if (!name && !notes && !screenshotUrl) continue;

      screenInserts.push({
        id: randomUUID(),
        name,
        notes,
        screenshotUrl,
        sortOrder: sortOrder++,
      });
    }

    const titleRaw = fd.get("title");
    const title =
      typeof titleRaw === "string" && titleRaw.trim()
        ? titleRaw.trim().slice(0, 200)
        : null;
    const screenRecordingUrl = clipText(fd.get("screenRecordingUrl"));
    const whatsWorking = clipText(fd.get("whatsWorking"));
    const whatsNotWorking = clipText(fd.get("whatsNotWorking"));
    const successLooksLike = clipText(fd.get("successLooksLike"));

    const preferredDeliveryDateRaw = fd.get("preferredDeliveryDate");
    const preferredDeliveryDate =
      typeof preferredDeliveryDateRaw === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(preferredDeliveryDateRaw)
        ? preferredDeliveryDateRaw
        : null;

    let ccEmails: string[] = [];
    const ccRaw = fd.get("ccEmails");
    if (typeof ccRaw === "string" && ccRaw.trim()) {
      try {
        const parsed = JSON.parse(ccRaw);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          for (const v of parsed) {
            if (typeof v !== "string") continue;
            const norm = v.trim().toLowerCase();
            if (!norm) continue;
            if (norm === user.email.toLowerCase()) continue; // already primary
            if (seen.has(norm)) continue;
            seen.add(norm);
            ccEmails.push(v.trim());
          }
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid ccEmails payload" },
          { status: 400 }
        );
      }
    }
    // Validate every CC email is an actual member of the project.
    if (ccEmails.length > 0) {
      const validRes = await pool.query(
        `SELECT lower(email) AS email
         FROM project_members
         WHERE project_id = $1 AND lower(email) = ANY($2::text[])`,
        [projectId, ccEmails.map((e) => e.toLowerCase())]
      );
      const validSet = new Set(
        validRes.rows.map((r) => (r.email as string).toLowerCase())
      );
      const filtered = ccEmails.filter((e) =>
        validSet.has(e.toLowerCase())
      );
      if (filtered.length !== ccEmails.length) {
        return NextResponse.json(
          { error: "One or more CC emails are not members of this project" },
          { status: 400 }
        );
      }
      ccEmails = filtered;
    }

    const hasAnyContent =
      Boolean(screenRecordingUrl) ||
      screenInserts.length > 0 ||
      Boolean(whatsWorking) ||
      Boolean(whatsNotWorking) ||
      Boolean(successLooksLike);

    if (!hasAnyContent) {
      return NextResponse.json(
        { error: "Submit at least one piece of context" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO refinement_cycles (
           id, project_id, title, submitter_email, screen_recording_url,
           whats_working, whats_not_working, success_looks_like,
           preferred_delivery_date, cc_emails,
           status, submitted_at, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'submitted', now(), $11)`,
        [
          cycleId,
          projectId,
          title,
          user.email,
          screenRecordingUrl,
          whatsWorking,
          whatsNotWorking,
          successLooksLike,
          preferredDeliveryDate,
          ccEmails,
          user.accountId,
        ]
      );

      for (const s of screenInserts) {
        await client.query(
          `INSERT INTO refinement_cycle_screens (
             id, refinement_cycle_id, name, notes, screenshot_url,
             added_by, sort_order
           ) VALUES ($1, $2, $3, $4, $5, 'client', $6)`,
          [s.id, cycleId, s.name, s.notes, s.screenshotUrl, s.sortOrder]
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    // Fire-and-forget: notify admins of the new submission. Errors are
    // swallowed inside onCycleSubmitted so a failed email doesn't fail
    // the submission.
    void onCycleSubmitted(cycleId);

    return NextResponse.json(
      { id: cycleId, status: "submitted" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[RefinementCyclesAPI] POST error:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Submission failed" },
      { status: 500 }
    );
  }
}

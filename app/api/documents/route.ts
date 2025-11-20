import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { verifyTypeformSignature } from "@/lib/typeform";
import { sendEmail, generateIntakeConfirmationEmail } from "@/lib/email";

function extractEmailFromPayload(content: unknown): string | null {
  const maybeEmail = (value: unknown): string | null => {
    if (typeof value === "string" && value.includes("@")) {
      return value.trim();
    }
    return null;
  };

  if (!content || typeof content !== "object") return null;
  const root = content as Record<string, unknown>;

  // Prefer Typeform v2-style payload: form_response.answers[]
  const formResponse = root.form_response as unknown;
  if (formResponse && typeof formResponse === "object") {
    const fr = formResponse as { answers?: unknown[]; hidden?: Record<string, unknown> | undefined };
    if (Array.isArray(fr.answers)) {
      for (const ans of fr.answers) {
        if (ans && typeof ans === "object") {
          const a = ans as { type?: string; email?: unknown; text?: unknown };
          const emailFromField = maybeEmail(a.email);
          if (a.type === "email" && emailFromField) return emailFromField;
          const emailFromText = maybeEmail(a.text);
          if (a.type === "email" && emailFromText) return emailFromText;
        }
      }
    }
    if (fr.hidden && typeof fr.hidden === "object") {
      const hidden = fr.hidden as Record<string, unknown>;
      const emailFromHidden = maybeEmail(hidden.email ?? hidden.contact_email ?? hidden.user_email);
      if (emailFromHidden) return emailFromHidden;
    }
  }

  // Generic fallback: look for a top-level email-ish field
  const emailFromRoot = maybeEmail(
    (root.email as unknown) ?? (root.contact_email as unknown) ?? (root.user_email as unknown)
  );
  if (emailFromRoot) return emailFromRoot;

  return null;
}

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "20");
    const offset = Number(searchParams.get("offset") ?? "0");
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, filename, email, created_at FROM documents ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [isFinite(limit) ? limit : 20, isFinite(offset) ? offset : 0]
    );
    return NextResponse.json({ documents: result.rows });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Read raw body once, to support signature verification
    const rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "";
    const typeformSignature = request.headers.get("typeform-signature");
    const typeformSecret = process.env.TYPEFORM_WEBHOOK_SECRET;

    // Verify Typeform signature if configured and header present
    if (typeformSecret && typeformSignature) {
      const ok = verifyTypeformSignature(rawBody, typeformSignature, typeformSecret);
      if (!ok) {
        return NextResponse.json({ error: "Invalid Typeform signature" }, { status: 401 });
      }
    }

    await ensureSchema();
    let content: unknown;
    const filename: string | null = null;

    if (contentType.includes("application/json") || contentType.includes("text/json") || contentType.includes("application/octet-stream")) {
      content = JSON.parse(rawBody || "{}");
    } else {
      return NextResponse.json(
        { error: "Unsupported Content-Type. Use application/json." },
        { status: 415 }
      );
    }

    const id = crypto.randomUUID();
    const emailRaw = extractEmailFromPayload(content);
    const email = emailRaw ? emailRaw.toLowerCase() : null;
    const pool = getPool();
    let accountId: string | null = null;

    if (email) {
      const accountRes = await pool.query(
        `
          INSERT INTO accounts (id, email)
          VALUES ($1, $2)
          ON CONFLICT (email)
          DO UPDATE SET email = EXCLUDED.email
          RETURNING id
        `,
        [crypto.randomUUID(), email]
      );
      accountId = (accountRes.rows[0] as { id: string }).id;
    }

    await pool.query(
      `INSERT INTO documents (id, content, filename, email, account_id) VALUES ($1, $2::jsonb, $3, $4, $5)`,
      [id, JSON.stringify(content), filename, email, accountId]
    );

    // Send confirmation email to the submitter (non-blocking)
    if (email) {
      const emailContent = generateIntakeConfirmationEmail();
      sendEmail({
        to: email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      }).catch((error) => {
        console.error("[Documents] Failed to send intake confirmation email:", error);
        // Don't throw - we don't want email failures to break document submission
      });
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}



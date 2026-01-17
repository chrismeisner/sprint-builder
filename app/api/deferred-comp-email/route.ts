import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

type MilestonePayload = {
  summary: string;
  date: string;
  multiplier: number;
};

type EmailRequest = {
  to: string[];
  subject?: string;
  calculator: {
    totalProjectValue: number;
    upfrontPayment: number;
    equitySplit: number;
    milestones: MilestonePayload[];
    milestoneMissOutcome: string;
    upfrontAmount: number;
    equityAmount: number;
    deferredAmount: number;
  };
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as EmailRequest | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const rawRecipients = Array.isArray(body.to) ? body.to : [];
    const recipients = Array.from(
      new Set(
        rawRecipients
          .map((email) => String(email).trim().toLowerCase())
          .filter((email) => EMAIL_REGEX.test(email))
      )
    );

    if (recipients.length === 0) {
      return NextResponse.json({ error: "At least one valid recipient is required" }, { status: 400 });
    }

    const { calculator } = body;
    if (!calculator || typeof calculator.totalProjectValue !== "number") {
      return NextResponse.json({ error: "Calculator payload is required" }, { status: 400 });
    }

    const subject = body.subject || "Compensation calculator snapshot";

    const milestoneLines =
      calculator.milestones && calculator.milestones.length
        ? calculator.milestones
            .map(
              (m) =>
                `- ${m.summary || "—"} | ${m.date || "—"} | ${m.multiplier || 0}x (Deferred payout: ${formatCurrency(
                  calculator.deferredAmount * (Number.isFinite(m.multiplier) ? m.multiplier : 0)
                )})`
            )
            .join("\n")
        : "No milestones added.";

    const text = `
Compensation calculator snapshot

Total project value: ${formatCurrency(calculator.totalProjectValue)}
Upfront: ${formatPercent(calculator.upfrontPayment)} (${formatCurrency(calculator.upfrontAmount)})
Equity: ${formatPercent((1 - calculator.upfrontPayment) * calculator.equitySplit)} (${formatCurrency(calculator.equityAmount)})
Deferred: ${formatPercent((1 - calculator.upfrontPayment) * (1 - calculator.equitySplit))} (${formatCurrency(
      calculator.deferredAmount
    )})
Outcome if milestones missed: ${calculator.milestoneMissOutcome}

Milestones:
${milestoneLines}
`.trim();

    const milestoneRows =
      calculator.milestones && calculator.milestones.length
        ? calculator.milestones
            .map(
              (m) => `
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${m.summary || "—"}</td>
                <td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${m.date || "—"}</td>
                <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align:right;">${Number.isFinite(m.multiplier) ? `${m.multiplier}x` : "—"}</td>
                <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align:right;">${formatCurrency(
                  calculator.deferredAmount * (Number.isFinite(m.multiplier) ? m.multiplier : 0)
                )}</td>
              </tr>`
            )
            .join("")
        : `<tr><td colspan="4" style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align:center;">No milestones added.</td></tr>`;

    const html = `
<!DOCTYPE html>
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background: #f8fafc; padding: 16px;">
    <div style="max-width: 640px; margin: 0 auto; background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px;">
      <h2 style="margin: 0 0 12px 0;">Compensation calculator snapshot</h2>
      <p style="margin: 0 0 16px 0;">Here's the latest calculation you requested:</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tbody>
          <tr><td style="padding: 6px 0;">Total project value</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatCurrency(
            calculator.totalProjectValue
          )}</td></tr>
          <tr><td style="padding: 6px 0;">Upfront</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatPercent(
            calculator.upfrontPayment
          )} (${formatCurrency(calculator.upfrontAmount)})</td></tr>
          <tr><td style="padding: 6px 0;">Equity</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatPercent(
            (1 - calculator.upfrontPayment) * calculator.equitySplit
          )} (${formatCurrency(calculator.equityAmount)})</td></tr>
          <tr><td style="padding: 6px 0;">Deferred</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatPercent(
            (1 - calculator.upfrontPayment) * (1 - calculator.equitySplit)
          )} (${formatCurrency(calculator.deferredAmount)})</td></tr>
          <tr><td style="padding: 6px 0;">If milestones are missed</td><td style="padding: 6px 0; text-align: right;">${calculator.milestoneMissOutcome}</td></tr>
        </tbody>
      </table>

      <h3 style="margin: 24px 0 8px 0;">Milestones</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px; text-align: left; background: #f8fafc; border: 1px solid #e5e7eb;">Summary</th>
            <th style="padding: 8px; text-align: left; background: #f8fafc; border: 1px solid #e5e7eb;">Date</th>
            <th style="padding: 8px; text-align: right; background: #f8fafc; border: 1px solid #e5e7eb;">Multiplier</th>
            <th style="padding: 8px; text-align: right; background: #f8fafc; border: 1px solid #e5e7eb;">Deferred payout</th>
          </tr>
        </thead>
        <tbody>
          ${milestoneRows}
        </tbody>
      </table>

      <p style="margin-top: 24px; color: #475569; font-size: 14px;">Sent via Compensation Calculator.</p>
    </div>
  </body>
</html>
`;

    const sendResult = await sendEmail({
      to: recipients.join(","),
      subject,
      text,
      html,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || "Failed to send email" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, messageId: sendResult.messageId });
  } catch (error: unknown) {
    console.error("[DeferredCompEmail] Error sending email", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


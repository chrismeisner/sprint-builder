import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const hasSecretKey = Boolean(secretKey);
  const hasPublishableKey = Boolean(publishableKey);
  const hasWebhookSecret = Boolean(webhookSecret);

  // Determine mode from key prefix
  const mode: "live" | "test" | null = secretKey
    ? secretKey.startsWith("sk_live_")
      ? "live"
      : "test"
    : null;

  if (!hasSecretKey) {
    return NextResponse.json({
      connected: false,
      mode: null,
      account: null,
      balance: null,
      keys: { hasSecretKey, hasPublishableKey, hasWebhookSecret },
      error: null,
    });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey!, { apiVersion: "2026-01-28.clover" });

    const [account, balance] = await Promise.all([
      stripe.accounts.retrieve(),
      stripe.balance.retrieve(),
    ]);

    return NextResponse.json({
      connected: true,
      mode,
      account: {
        id: account.id,
        email: account.email,
        business_name:
          account.business_profile?.name ??
          account.settings?.dashboard?.display_name ??
          null,
        country: account.country,
        default_currency: account.default_currency,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      },
      balance: {
        available: balance.available.map((b) => ({
          amount: b.amount,
          currency: b.currency,
        })),
        pending: balance.pending.map((b) => ({
          amount: b.amount,
          currency: b.currency,
        })),
      },
      keys: { hasSecretKey, hasPublishableKey, hasWebhookSecret },
      error: null,
    });
  } catch (err) {
    return NextResponse.json({
      connected: false,
      mode,
      account: null,
      balance: null,
      keys: { hasSecretKey, hasPublishableKey, hasWebhookSecret },
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-01-28.clover" });
  }
  return _stripe;
}

/**
 * Finds an existing Stripe Customer for this account, or creates one.
 * Persists the stripe_customer_id back to the accounts table on first creation.
 */
export async function getOrCreateStripeCustomer(
  pool: import("pg").Pool,
  accountId: string
): Promise<string> {
  const acctRes = await pool.query(
    `SELECT id, email, name, first_name, last_name, stripe_customer_id
     FROM accounts WHERE id = $1`,
    [accountId]
  );
  if ((acctRes.rowCount ?? 0) === 0) {
    throw new Error(`Account ${accountId} not found`);
  }

  const acct = acctRes.rows[0] as {
    id: string;
    email: string;
    name: string | null;
    first_name: string | null;
    last_name: string | null;
    stripe_customer_id: string | null;
  };

  if (acct.stripe_customer_id) {
    return acct.stripe_customer_id;
  }

  const stripe = getStripe();
  const displayName =
    [acct.first_name, acct.last_name].filter(Boolean).join(" ") ||
    acct.name ||
    acct.email;

  const customer = await stripe.customers.create({
    email: acct.email,
    name: displayName,
    metadata: { account_id: acct.id },
  });

  await pool.query(
    `UPDATE accounts SET stripe_customer_id = $1 WHERE id = $2`,
    [customer.id, acct.id]
  );

  return customer.id;
}

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StackClient from "./StackClient";

export default async function StackPage() {
  const user = await getCurrentUser();

  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  const configStatus = {
    database: Boolean(process.env.DATABASE_URL || process.env.PGHOST),
    storage: Boolean(process.env.GCS_PROJECT_ID && process.env.GCS_BUCKET_NAME),
    resend: Boolean(process.env.RESEND_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    analytics: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
  };

  return <StackClient configStatus={configStatus} />;
}


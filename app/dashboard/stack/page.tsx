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
    mailgun: Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
    openai: Boolean(process.env.OPENAI_API_KEY),
    analytics: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
  };

  return <StackClient configStatus={configStatus} />;
}


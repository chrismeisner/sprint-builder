import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema, getPool } from "@/lib/db";
import AdminAiToolsClient from "./AdminAiToolsClient";

export const dynamic = "force-dynamic";

type Document = {
  id: string;
  filename: string | null;
  email: string | null;
  created_at: string;
  has_sprint: boolean;
};

export default async function AdminAiToolsPage() {
  // Admin-only protection
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  // AI generation disabled; no data needed
  return <AdminAiToolsClient documents={[]} />;
}



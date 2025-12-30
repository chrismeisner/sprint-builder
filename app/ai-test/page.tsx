import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminAiToolsClient from "./AdminAiToolsClient";

export const dynamic = "force-dynamic";

export default async function AdminAiToolsPage() {
  // Admin-only protection
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  // AI generation disabled; no data needed
  return <AdminAiToolsClient documents={[]} />;
}



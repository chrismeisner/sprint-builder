import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import HillDetailClient from "./HillDetailClient";

export default async function HillDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");
  return <HillDetailClient hillId={params.id} />;
}

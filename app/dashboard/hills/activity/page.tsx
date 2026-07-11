import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ActivityClient from "./ActivityClient";

export default async function HillsActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");
  return <ActivityClient />;
}

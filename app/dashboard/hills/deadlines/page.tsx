import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DeadlinesClient from "./DeadlinesClient";

export default async function HillsDeadlinesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");
  return <DeadlinesClient />;
}

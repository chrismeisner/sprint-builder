import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import HillsClient from "./HillsClient";

export default async function HillsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");
  return <HillsClient />;
}

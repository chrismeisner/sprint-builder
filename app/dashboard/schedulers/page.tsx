import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SchedulersClient from "./SchedulersClient";

export default async function SchedulersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");
  return <SchedulersClient />;
}

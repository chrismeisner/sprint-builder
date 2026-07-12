import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PrintersClient from "./PrintersClient";

export default async function PrintersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");
  return <PrintersClient />;
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ActivityClient from "./ActivityClient";

export default async function ActivityPage() {
  const user = await getCurrentUser();

  if (!user?.isAdmin) {
    redirect("/login");
  }

  return <ActivityClient />;
}

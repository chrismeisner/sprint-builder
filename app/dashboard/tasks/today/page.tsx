import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import TodayClient from "./TodayClient";

export default async function TodayPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  if (!user.isAdmin) {
    redirect("/dashboard");
  }

  return <TodayClient />;
}

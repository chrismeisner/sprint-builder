import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MyDashboardClient from "./MyDashboardClient";

export default async function MyDashboardPage() {
  const user = await getCurrentUser();
  
  // Redirect if not logged in
  if (!user) {
    redirect("/login");
  }

  return <MyDashboardClient />;
}

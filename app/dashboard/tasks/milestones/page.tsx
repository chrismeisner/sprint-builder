import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MilestonesClient from "./MilestonesClient";

export default async function MilestonesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  if (!user.isAdmin) {
    redirect("/dashboard");
  }

  return <MilestonesClient />;
}

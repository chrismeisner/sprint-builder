import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const user = await getCurrentUser();
  
  // Redirect if not logged in
  if (!user) {
    redirect("/login");
  }
  
  // Redirect if not admin
  if (!user.isAdmin) {
    redirect("/dashboard");
  }

  return <UsersClient />;
}


import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  
  // Redirect if not logged in
  if (!user) {
    redirect("/login");
  }

  return <ProfileClient />;
}


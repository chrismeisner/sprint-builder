import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ProjectsClient from "./ProjectsClient";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  
  // Redirect if not logged in
  if (!user) {
    redirect("/login");
  }

  return <ProjectsClient />;
}

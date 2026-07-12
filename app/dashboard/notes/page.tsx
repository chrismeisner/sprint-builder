import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import NotesClient from "./NotesClient";

export default async function NotesAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");
  return <NotesClient />;
}

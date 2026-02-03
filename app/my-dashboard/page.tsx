import { redirect } from "next/navigation";

// Redirect old /my-dashboard URL to new /projects URL
export default function MyDashboardPage() {
  redirect("/projects");
}

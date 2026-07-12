import { redirect } from "next/navigation";

// Notes moved to the dedicated top-level admin page.
export default function NotesPage() {
  redirect("/dashboard/notes");
}

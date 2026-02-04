import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import IdeaDetailClient from "./IdeaDetailClient";

type Props = {
  params: Promise<{ ideaId: string }>;
};

export default async function IdeaDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  if (!user.isAdmin) {
    redirect("/dashboard");
  }

  const { ideaId } = await params;

  return <IdeaDetailClient ideaId={ideaId} />;
}

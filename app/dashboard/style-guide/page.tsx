import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StyleGuideClient from "./StyleGuideClient";

export default async function StyleGuidePage() {
  const user = await getCurrentUser();
  
  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  return <StyleGuideClient />;
}


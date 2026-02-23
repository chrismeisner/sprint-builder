import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import StripeConnectionClient from "./StripeConnectionClient";

export default async function StripeConnectionPage() {
  const user = await getCurrentUser();

  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  return <StripeConnectionClient />;
}

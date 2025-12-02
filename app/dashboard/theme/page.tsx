import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ThemeOverrideClient from "./ThemeOverrideClient";
import {
  THEME_OVERRIDE_COOKIE,
  ThemeOverrideSelection,
} from "@/lib/theme-mode";

function readSelectionFromCookie(): ThemeOverrideSelection {
  const cookieStore = cookies();
  const value = cookieStore.get(THEME_OVERRIDE_COOKIE)?.value;
  if (value === "dark" || value === "light") {
    return value;
  }
  return "default";
}

export default async function ThemePage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  const initialSelection = readSelectionFromCookie();
  return <ThemeOverrideClient initialSelection={initialSelection} />;
}



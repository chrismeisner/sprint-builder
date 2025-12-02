import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import TypographySampleClient from "./TypographySampleClient";
import { typographyScale } from "@/lib/design-system/tokens";

type TypographyViewport = "desktop" | "mobile";

type TypographySamplePageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

const DEFAULT_SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog";

const getViewport = (value: string | undefined): TypographyViewport => {
  if (value === "mobile") {
    return "mobile";
  }
  return "desktop";
};

const parseIds = (raw: string | string[] | undefined) => {
  if (!raw) {
    return [];
  }
  const rawArray = Array.isArray(raw) ? raw : [raw];
  return rawArray
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
};

export default async function TypographySamplePage({ searchParams }: TypographySamplePageProps) {
  const user = await getCurrentUser();

  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  const viewport = getViewport(typeof searchParams.viewport === "string" ? searchParams.viewport : undefined);
  const sampleTextParam = typeof searchParams.text === "string" ? searchParams.text : "";
  const sampleText = sampleTextParam.trim() || DEFAULT_SAMPLE_TEXT;
  const requestedIds = parseIds(searchParams.id);
  const idSet = new Set(requestedIds);
  const filteredTokens =
    idSet.size > 0 ? typographyScale.filter((token) => idSet.has(token.id)) : typographyScale;
  const tokensToRender = filteredTokens.length > 0 ? filteredTokens : typographyScale;

  return <TypographySampleClient tokens={tokensToRender} sampleText={sampleText} viewport={viewport} />;
}



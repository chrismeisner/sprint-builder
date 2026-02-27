"use client";

import NextLink, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { BASE } from "@/app/sandboxes/miles-proto-1/_lib/nav";

type Props = Omit<LinkProps, "href"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

/**
 * Drop-in replacement for next/link that automatically prefixes internal
 * paths with the miles-proto-1 sandbox base path.
 */
export default function Link({ href, ...rest }: Props) {
  const prefixed =
    typeof href === "string" &&
    href.startsWith("/") &&
    !href.startsWith("/api")
      ? `${BASE}${href}`
      : href;
  return <NextLink href={prefixed} {...rest} />;
}

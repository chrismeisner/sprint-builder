export const BASE = "/sandboxes/miles-proto-1";

/** Prefix an internal path with the sandbox base path. */
export function p(path: string): string {
  if (!path.startsWith("/") || path.startsWith("/api")) return path;
  return `${BASE}${path}`;
}

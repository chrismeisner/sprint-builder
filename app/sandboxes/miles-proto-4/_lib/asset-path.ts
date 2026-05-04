/**
 * Returns the path to a public-folder asset for the miles-proto-4 sandbox.
 * Assets live in /public/miles-proto-4/ in the main app.
 *
 * Example: assetPath("/images/civic.png") → "/miles-proto-4/images/civic.png"
 */
export function assetPath(path: string): string {
  return `/miles-proto-4${path}`;
}

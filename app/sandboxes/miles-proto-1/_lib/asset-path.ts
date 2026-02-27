/**
 * Returns the path to a public-folder asset for the miles-proto-1 sandbox.
 * Assets live in /public/miles-proto-1/ in the main app.
 *
 * Example: assetPath("/images/civic.png") → "/miles-proto-1/images/civic.png"
 */
export function assetPath(path: string): string {
  return `/miles-proto-1${path}`;
}

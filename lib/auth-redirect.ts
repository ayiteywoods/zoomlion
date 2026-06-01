/** Safe post-login redirect target from middleware or login form `from` param. */
export function resolvePostLoginPath(from: string | null | undefined): string {
  if (
    from &&
    from !== "/login" &&
    !from.startsWith("/api/") &&
    !from.startsWith("/_next/")
  ) {
    return from;
  }
  return "/dashboard";
}

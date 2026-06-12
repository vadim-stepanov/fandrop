// Loose validator for a connected social value. Accepts either a handle
// (`@?[a-zA-Z0-9_.]{1,50}`) or a full http(s) URL. Deliberately not per-platform
// (URL shapes vary too much) — just filters obvious garbage from trust-based
// manual linking.
export function isValidSocialHandleOrUrl(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > 500) {
    return false;
  }
  const handlePattern = /^@?[a-zA-Z0-9_.]{1,50}$/;
  const urlPattern = /^https?:\/\/[\w./?=&%~#:\-+@!$'()*,;]+$/i;
  return handlePattern.test(trimmed) || urlPattern.test(trimmed);
}

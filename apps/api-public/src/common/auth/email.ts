// Canonical email for identity matching: one address = one account across OTP
// and Google. Postgres `@unique` is case-sensitive and inputs vary in
// case/whitespace, so every entry point normalizes before lookup/create.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

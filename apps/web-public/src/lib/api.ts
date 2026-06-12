// Base URL of the NestJS public backend. Override via apps/web-public/.env.local
// (NEXT reads it) if the api-public port changes.
const API_PUBLIC_URL = process.env.API_PUBLIC_URL ?? "http://localhost:3001";

// Versioned API base (URI versioning). Callers pass resource paths
// without the /api/v1 prefix, e.g. apiUrl("/artists/aurora/home").
export function apiUrl(path: string): string {
  return `${API_PUBLIC_URL}/api/v1${path}`;
}

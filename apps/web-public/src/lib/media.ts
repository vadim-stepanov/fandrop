// The admin backend may hand back uploaded-media URLs as absolute
// (http://localhost:3002/uploads/...). next/image only optimizes a localhost
// upstream if it's referenced as a root-relative /uploads/... path (a local
// image proxied same-origin via the next.config rewrite) — an absolute
// private-IP URL is rejected by the optimizer's SSRF guard. Strip the origin so
// the path is first-party. External hosts (e.g. Google avatars) are left as-is.
export function toUploadPath(url: string): string {
  const marker = "/uploads/";
  const i = url.indexOf(marker);
  return i === -1 ? url : url.slice(i);
}

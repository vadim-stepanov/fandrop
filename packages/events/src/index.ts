// Client-safe entry: event contract + Socket.io types + helpers. No runtime
// deps (frontends import this). The Redis EventBus lives in "./bus" (server).

// --- Cross-service events (Redis Pub/Sub channels) ---

export const ARTIST_HOME_UPDATED = "artist.home.updated";

export interface ArtistHomeUpdatedPayload {
  artistId: string;
}

export const ARTIST_ACTIVITY = "artist.activity";

// A member-driven change to an artist's public data (points/leaderboard,
// membership, inventory/stock) — emitted by api-public on public actions.
// Distinct from artist.home.updated (admin content edits).
export type ArtistActivityKind =
  | "purchase"
  | "social-connect"
  | "membership"
  | "referral"
  | "welcome-bonus"
  | "quest-claim";

export interface ArtistActivityPayload {
  artistId: string;
  userId: string;
  kind: ArtistActivityKind;
}

export const USER_WIPED = "user.wiped";

// A member was hard-deleted by an admin (Users table). api-public force-logs-out
// that user's live sessions on the public side.
export interface UserWipedPayload {
  userId: string;
  artistId: string;
}

export const MEMBER_NOTICE = "member.notice";

// An admin-driven change to one member that the member should be told about
// (their balance/inventory changed "by itself"). Structured so the client owns
// the wording. Emitted by api-admin, pushed to the member's live session.
export type MemberNotice =
  | { kind: "points-adjusted"; amount: number }
  | { kind: "inventory-granted"; itemName: string }
  | { kind: "inventory-removed"; itemName: string };

export interface MemberNoticePayload {
  userId: string;
  artistId: string;
  notice: MemberNotice;
}

export const ARTIST_ADMIN_UPDATED = "artist.admin.updated";

// An admin write that other admins of the same artist should see live, by the
// admin view it affects: "audit" (every audited action) and/or "users" (the
// Users moderation grid — points/inventory/membership). Content editors are
// intentionally excluded (live-refresh would fight dirty-save).
export type AdminTopic = "users" | "audit";

export interface ArtistAdminUpdatedPayload {
  artistId: string;
  topics: AdminTopic[];
}

// Bus event name → payload (used by @fandrop/events/bus).
export interface BusEvents {
  "artist.home.updated": ArtistHomeUpdatedPayload;
  "artist.activity": ArtistActivityPayload;
  "user.wiped": UserWipedPayload;
  "member.notice": MemberNoticePayload;
  "artist.admin.updated": ArtistAdminUpdatedPayload;
}

// --- Socket.io contract (shared by api-public gateway and clients) ---

export interface ServerToClientEvents {
  // Public viewers: "something on the artist changed, refetch the page".
  "artist.updated": (payload: { artistId: string }) => void;
  // Admin SPA: a member action happened — invalidate the affected queries
  // (Users / leaderboard / audit) by kind.
  "artist.activity": (payload: { artistId: string; kind: ArtistActivityKind }) => void;
  // The signed-in viewer was deleted by an admin → the client logs out.
  "force-logout": (payload: { artistId: string }) => void;
  // An admin changed the viewer's balance/inventory → show a toast + refetch.
  "member.notice": (payload: { notice: MemberNotice }) => void;
  // Another admin of this artist made a change → invalidate the affected admin
  // views (Users grid / Audit) live.
  "admin.updated": (payload: { topics: AdminTopic[] }) => void;
}

export interface ClientToServerEvents {
  subscribe: (payload: { artistId: string }) => void;
  unsubscribe: (payload: { artistId: string }) => void;
}

// Room for an artist's public content updates (anonymous viewers allowed).
export const artistRoom = (artistId: string): string => `artist:${artistId}`;

// Per-user room for targeted pushes (e.g. force-logout). Joined on handshake.
export const userRoom = (userId: string): string => `user:${userId}`;

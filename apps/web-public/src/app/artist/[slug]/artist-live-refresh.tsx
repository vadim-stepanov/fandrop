"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type Socket, io } from "socket.io-client";
import { toast } from "sonner";

import type { ClientToServerEvents, MemberNotice, ServerToClientEvents } from "@fandrop/events";

import { logout } from "@/app/actions";

// Dev: api-public is a different origin (:3001) — override via
// apps/web-public/.env.local (NEXT_PUBLIC_* is inlined at build time). In prod
// (single domain behind a proxy) the WS would be same-origin — io() with no URL.
const WS_URL = process.env.NEXT_PUBLIC_API_PUBLIC_URL ?? "http://localhost:3001";

// Explains an admin-driven change to the member's own balance/inventory.
function noticeMessage(notice: MemberNotice): string {
  switch (notice.kind) {
    case "points-adjusted":
      return notice.amount >= 0
        ? `An admin added ${notice.amount} points`
        : `An admin removed ${Math.abs(notice.amount)} points`;
    case "inventory-granted":
      return `An admin added "${notice.itemName}" to your inventory`;
    case "inventory-removed":
      return `An admin removed "${notice.itemName}" from your inventory`;
  }
}

// Subscribes to the artist's content channel and refetches the page (Server
// Components) when the admin changes Home. WS = refetch signal. Mounted only
// for authenticated viewers (realtime is authed-only). Also force-logs-out the
// viewer if an admin deletes their membership.
export function ArtistLiveRefresh({ artistId, slug }: { artistId: string; slug: string }) {
  const router = useRouter();

  useEffect(() => {
    // withCredentials so the browser sends the httpOnly sid-cookie on the
    // cross-origin handshake (the gateway auths the session from it).
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(WS_URL, {
      withCredentials: true,
    });
    socket.on("connect", () => socket.emit("subscribe", { artistId }));
    socket.on("artist.updated", () => router.refresh());
    // Admin deleted this member → log out exactly like the Sign-out button
    // (clears cookies, revokes the session, lands on the anon artist Home).
    socket.on("force-logout", () => {
      void logout(slug);
    });
    // Admin changed this member's balance/inventory → explain it + refetch so
    // the balance widget / inventory reflect the change.
    socket.on("member.notice", ({ notice }) => {
      toast.info(noticeMessage(notice));
      router.refresh();
    });
    return () => {
      socket.disconnect();
    };
  }, [artistId, slug, router]);

  return null;
}

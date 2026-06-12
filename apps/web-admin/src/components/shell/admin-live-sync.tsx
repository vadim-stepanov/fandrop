import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { type Socket, io } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "@fandrop/events";

import { getListAuditQueryKey } from "@/api/generated/audit/audit";
import { getListUsersQueryKey } from "@/api/generated/users/users";
import { useAuthStore } from "@/lib/auth-store";

// Dev: api-admin is a different origin (:3002). In prod (single domain behind a
// proxy) the WS would be same-origin.
const WS_URL = import.meta.env.VITE_API_ADMIN_URL ?? "http://localhost:3002";

// Subscribes to the admin's artist channel and invalidates the queries a member
// action affects (the Users list — points / inventory / membership / referrals)
// so the admin sees fans' activity live. WS = refetch signal; the data still
// comes from the JWT-guarded REST endpoints. withCredentials sends the sid-cookie
// for the handshake. Renders nothing.
export function AdminLiveSync() {
  const artistId = useAuthStore((s) => s.admin?.artist.id);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!artistId) {
      return;
    }
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(WS_URL, {
      withCredentials: true,
    });
    socket.on("connect", () => socket.emit("subscribe", { artistId }));
    socket.on("artist.activity", () => {
      void queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    });
    // Another admin of this artist made a change → refresh the affected views.
    socket.on("admin.updated", ({ topics }) => {
      if (topics.includes("users")) {
        void queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      }
      if (topics.includes("audit")) {
        void queryClient.invalidateQueries({ queryKey: getListAuditQueryKey() });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [artistId, queryClient]);

  return null;
}

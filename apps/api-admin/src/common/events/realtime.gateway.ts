import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {
  ARTIST_ACTIVITY,
  ARTIST_ADMIN_UPDATED,
  type ArtistAdminUpdatedPayload,
  type ClientToServerEvents,
  type ServerToClientEvents,
  artistRoom,
} from "@fandrop/events";
import { EventBus } from "@fandrop/events/bus";
import type { Server, Socket } from "socket.io";

import { SessionService } from "../auth/session.service";

interface SocketData {
  userId: string;
  sid: string;
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) {
    return out;
  }
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const name = part.slice(0, eq).trim();
    if (name) {
      out[name] = decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return out;
}

// Admin realtime: same scheme as api-public — sid-cookie handshake against the
// shared Redis sessions, then refetch signals to the artist room. WS only ever
// says "this changed, refetch"; the data itself stays behind the JWT-guarded
// HTTP endpoints, so a valid session (not an admin check) is enough to subscribe.
@WebSocketGateway({
  cors: { origin: ["http://localhost:5173"], credentials: true },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private readonly server!: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    private readonly bus: EventBus,
    private readonly sessions: SessionService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const cookies = parseCookieHeader(client.handshake.headers.cookie);
    const sid = cookies["sid"];
    if (!sid) {
      client.disconnect(true);
      return;
    }
    const userId = await this.sessions.getUserIdBySid(sid);
    if (!userId) {
      client.disconnect(true);
      return;
    }
    const data = client.data as SocketData;
    data.userId = userId;
    data.sid = sid;
  }

  // Member actions in api-public (purchase/social-connect/membership/referral)
  // reach admins as targeted query-invalidation signals (carry the kind).
  afterInit(): void {
    void this.bus.subscribe(ARTIST_ACTIVITY, ({ artistId, kind }) => {
      this.server.to(artistRoom(artistId)).emit("artist.activity", { artistId, kind });
    });
    // Another admin's write (audited) → refresh the affected admin views live.
    void this.bus.subscribe(
      ARTIST_ADMIN_UPDATED,
      ({ artistId, topics }: ArtistAdminUpdatedPayload) => {
        this.server.to(artistRoom(artistId)).emit("admin.updated", { topics });
      },
    );
  }

  @SubscribeMessage("subscribe")
  onSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() { artistId }: { artistId: string },
  ): void {
    void client.join(artistRoom(artistId));
  }

  @SubscribeMessage("unsubscribe")
  onUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() { artistId }: { artistId: string },
  ): void {
    void client.leave(artistRoom(artistId));
  }
}

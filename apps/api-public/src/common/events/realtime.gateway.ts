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
  ARTIST_HOME_UPDATED,
  MEMBER_NOTICE,
  USER_WIPED,
  type ClientToServerEvents,
  type MemberNoticePayload,
  type ServerToClientEvents,
  type UserWipedPayload,
  artistRoom,
  userRoom,
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

// Realtime is authed-only (spec): the handshake must carry a valid session
// sid-cookie, anonymous connections are dropped — anon viewers refresh
// manually (saves traffic). `credentials: true` so the browser sends the
// httpOnly sid-cookie cross-origin (dev). In prod (single domain) the WS is
// same-origin. Personal user:{id}:artist:{id} rooms land in a later slice.
@WebSocketGateway({
  cors: { origin: ["http://localhost:3000", "http://localhost:5173"], credentials: true },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private readonly server!: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    private readonly bus: EventBus,
    private readonly sessions: SessionService,
  ) {}

  // Handshake auth: resolve the session from the sid-cookie (admin `sid` or
  // public BFF `fd_sid`); no valid session → disconnect.
  async handleConnection(client: Socket): Promise<void> {
    const cookies = parseCookieHeader(client.handshake.headers.cookie);
    const sid = cookies["fd_sid"] ?? cookies["sid"];
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
    // Personal room for targeted pushes (force-logout on admin wipe).
    void client.join(userRoom(userId));
  }

  // Content edits (admin) and member activity (public actions) both tell viewers
  // to refetch the artist page — same WS signal, browser re-renders from server.
  afterInit(): void {
    const broadcast = ({ artistId }: { artistId: string }): void => {
      this.server.to(artistRoom(artistId)).emit("artist.updated", { artistId });
    };
    void this.bus.subscribe(ARTIST_HOME_UPDATED, broadcast);
    void this.bus.subscribe(ARTIST_ACTIVITY, broadcast);

    // Admin deleted a member → tell that user's live sessions to log out.
    void this.bus.subscribe(USER_WIPED, ({ userId, artistId }: UserWipedPayload): void => {
      this.server.to(userRoom(userId)).emit("force-logout", { artistId });
    });

    // Admin changed a member's balance/inventory → toast that member.
    void this.bus.subscribe(MEMBER_NOTICE, ({ userId, notice }: MemberNoticePayload): void => {
      this.server.to(userRoom(userId)).emit("member.notice", { notice });
    });
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

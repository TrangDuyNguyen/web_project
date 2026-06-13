import type * as Party from 'partykit/server';
import { applyAction, joinPlayer, createWaitingState, createPlayer } from '../../src/game/engine';
import { getBotAction } from '../../src/game/engine/bot';
import type { ClientMessage, RoomSummary } from '../../src/types/room';
import type { GameState, RoomSettings } from '../../src/types/game';
import type { PendingRoomSettings } from '../../src/types/auth';
import { DISCONNECT_TIMEOUT_MS } from '../../src/game/rules/constants';
import { broadcastState, sendError } from './utils/broadcast';
import { notifyLobby } from './utils/lobbyClient';
import { verifyWsToken } from './utils/verifyToken';
import { extractRoomIdFromUrl } from './utils/extractRoomId';

export default class GameServer implements Party.Server {
  state: GameState | null = null;

  constructor(readonly room: Party.Room) {}

  static async onBeforeConnect(
    req: Party.Request,
    lobby: Party.Lobby
  ): Promise<Party.Request | Response> {
    const url = req.url;
    const token = new URL(url).searchParams.get('token');
    if (!token) return new Response('Unauthorized', { status: 401 });

    const secret = lobby.env.AUTH_SECRET as string;
    if (!secret) return new Response('Server misconfigured', { status: 500 });

    const payload = await verifyWsToken(token, secret);
    if (!payload) return new Response('Invalid token', { status: 401 });

    const roomId = extractRoomIdFromUrl(url);
    if (!roomId || payload.roomId !== roomId) {
      return new Response('Token/room mismatch', { status: 403 });
    }

    const headers = new Headers();
    req.headers.forEach((value, key) => headers.set(key, value));
    headers.set('X-User-Id', payload.sub);
    headers.set('X-Display-Name', payload.displayName);
    headers.set('X-Color', payload.color);
    if (payload.isHost) headers.set('X-Is-Host', 'true');

    return new Request(url, { headers }) as unknown as Party.Request;
  }

  async onStart() {
    const stored = await this.room.storage.get<GameState>('state');
    if (stored) this.state = stored;
  }

  async saveState() {
    if (this.state) await this.room.storage.put('state', this.state);
  }

  async buildRoomSummary(): Promise<RoomSummary | null> {
    if (!this.state) return null;
    if (this.state.settings.visibility !== 'public' || this.state.gameStatus !== 'waiting') {
      return null;
    }
    if (this.state.players.length === 0) return null;

    const roomCode = (await this.room.storage.get<string>('roomCode')) ?? this.room.id;
    let createdAt = await this.room.storage.get<number>('lobbyCreatedAt');
    if (!createdAt) {
      createdAt = Date.now();
      await this.room.storage.put('lobbyCreatedAt', createdAt);
    }

    const host = this.state.players.find((p) => p.id === this.state!.hostId);
    return {
      roomId: this.room.id,
      roomCode,
      hostName: host?.displayName ?? 'Host',
      playerCount: this.state.players.length,
      maxPlayers: this.state.settings.maxPlayers,
      visibility: 'public',
      gameStatus: 'waiting',
      createdAt,
    };
  }

  async syncLobby() {
    const summary = await this.buildRoomSummary();
    if (summary) {
      await notifyLobby(this.room, { type: 'register', room: summary });
    } else {
      await notifyLobby(this.room, { type: 'unregister', roomId: this.room.id });
    }
  }

  async onRequest(req: Party.Request) {
    const path = new URL(req.url).pathname;

    if (req.method === 'GET' && path.endsWith('/host')) {
      const hostUserId = await this.room.storage.get<string>('hostUserId');
      return Response.json({ hostUserId: hostUserId ?? null });
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as PendingRoomSettings;
      await this.room.storage.put('hostUserId', body.hostUserId);
      await this.room.storage.put('pendingSettings', body);
      await this.room.storage.put('roomCode', this.room.id);
      if (body.visibility === 'public') {
        await this.room.storage.put('lobbyCreatedAt', Date.now());
      }
      return Response.json({ ok: true });
    }

    return new Response('Not found', { status: 404 });
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const userId = ctx.request.headers.get('X-User-Id') ?? '';
    const displayName = ctx.request.headers.get('X-Display-Name') ?? 'Khách';
    const color = ctx.request.headers.get('X-Color') ?? '#EF4444';
    const isHost = ctx.request.headers.get('X-Is-Host') === 'true';

    if (!userId) {
      conn.close();
      return;
    }

    if (!this.state) {
      const storedHost = await this.room.storage.get<string>('hostUserId');
      if (!isHost || userId !== storedHost) {
        sendError(conn, 'ROOM_NOT_READY', 'Đang chờ host vào phòng...');
        conn.close();
        return;
      }
      const pending = await this.room.storage.get<PendingRoomSettings>('pendingSettings');
      const settings: RoomSettings = {
        visibility: pending?.visibility ?? 'private',
        maxPlayers: pending?.maxPlayers ?? 4,
        roundLimit: pending?.roundLimit,
        disconnectTimeoutMs: DISCONNECT_TIMEOUT_MS,
        startingMoney: 1500,
        goBonus: 200,
      };
      this.state = createWaitingState(this.room.id, userId, settings);
    }

    const existing = this.state.players.find((p) => p.id === userId);
    if (existing) {
      this.state = {
        ...this.state,
        players: this.state.players.map((p) =>
          p.id === userId ? { ...p, connection: 'online', disconnectedAt: undefined } : p
        ),
      };
    } else if (this.state.gameStatus === 'waiting') {
      if (this.state.players.length >= this.state.settings.maxPlayers) {
        sendError(conn, 'ROOM_FULL', 'Phòng đã đầy');
        conn.close();
        return;
      }
      this.state = joinPlayer(this.state, createPlayer(userId, displayName, color));
    } else {
      sendError(conn, 'GAME_FINISHED', 'Không thể tham gia ván đang chơi');
      conn.close();
      return;
    }

    conn.setState({ userId });
    await this.saveState();
    broadcastState(this.room, this.state);
    await this.syncLobby();
  }

  async onMessage(raw: string, sender: Party.Connection) {
    if (!this.state) return;
    const userId = (sender.state as { userId?: string })?.userId ?? '';
    const msg = JSON.parse(raw) as ClientMessage;

    const engineAction = msg.type === 'leave'
      ? null
      : { type: msg.type } as Parameters<typeof applyAction>[1];

    if (msg.type === 'leave') {
      if (this.state.gameStatus === 'waiting') {
        this.state = {
          ...this.state,
          players: this.state.players.filter((p) => p.id !== userId),
        };
        broadcastState(this.room, this.state);
        await this.saveState();
        await this.syncLobby();
      }
      return;
    }

    if (!engineAction) return;

    const result = applyAction(this.state, engineAction, userId);
    if (!result.ok) {
      sendError(sender, result.error.code, result.error.message);
      return;
    }

    this.state = result.state;
    await this.saveState();
    broadcastState(this.room, this.state);

    if (this.state.gameStatus === 'playing') {
      await this.maybeRunBot();
    }

    if (msg.type === 'start_game') {
      await this.syncLobby();
    }
  }

  async onClose(conn: Party.Connection) {
    if (!this.state) return;
    const userId = (conn.state as { userId?: string })?.userId ?? '';

    if (this.state.gameStatus === 'waiting') {
      const hasOtherConnection = [...this.room.getConnections()].some(
        (c) => c.id !== conn.id && (c.state as { userId?: string })?.userId === userId
      );
      if (!hasOtherConnection) {
        this.state = {
          ...this.state,
          players: this.state.players.filter((p) => p.id !== userId),
        };
        await this.syncLobby();
      }
    } else if (this.state.gameStatus === 'playing') {
      this.state = {
        ...this.state,
        players: this.state.players.map((p) =>
          p.id === userId
            ? { ...p, connection: 'disconnected', disconnectedAt: Date.now() }
            : p
        ),
      };
      await this.room.storage.setAlarm(Date.now() + DISCONNECT_TIMEOUT_MS);
    }

    await this.saveState();
    broadcastState(this.room, this.state);
  }

  async onAlarm() {
    if (!this.state) return;

    this.state = {
      ...this.state,
      players: this.state.players.map((p) =>
        p.connection === 'disconnected' ? { ...p, connection: 'bot' } : p
      ),
    };

    if (this.state.hostId && this.state.players.find((p) => p.id === this.state!.hostId)?.connection === 'bot') {
      const nextHost = this.state.players.find((p) => p.connection === 'online');
      if (nextHost) this.state = { ...this.state, hostId: nextHost.id };
    }

    await this.saveState();
    broadcastState(this.room, this.state);
    await this.maybeRunBot();
  }

  async maybeRunBot() {
    if (!this.state || this.state.gameStatus !== 'playing') return;
    const current = this.state.players[this.state.currentPlayerIndex];
    if (!current || current.connection !== 'bot') return;

    await new Promise((r) => setTimeout(r, 1500));
    const botAction = getBotAction(this.state);
    const result = applyAction(this.state, botAction, current.id);
    if (result.ok) {
      this.state = result.state;
      await this.saveState();
      broadcastState(this.room, this.state);
      if (this.state.gameStatus === 'playing') await this.maybeRunBot();
    }
  }
}

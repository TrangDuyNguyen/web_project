import type * as Party from 'partykit/server';
import { applyAction, joinPlayer, createWaitingState, createPlayer } from '../../src/game/engine';
import { getBotAction } from '../../src/game/engine/bot';
import type { ClientMessage } from '../../src/types/room';
import type { GameState, RoomSettings } from '../../src/types/game';
import { DISCONNECT_TIMEOUT_MS } from '../../src/game/rules/constants';
import { broadcastState, sendError } from './utils/broadcast';

export default class GameServer implements Party.Server {
  state: GameState | null = null;

  constructor(readonly room: Party.Room) {}

  async onStart() {
    const stored = await this.room.storage.get<GameState>('state');
    if (stored) this.state = stored;
  }

  async saveState() {
    if (this.state) await this.room.storage.put('state', this.state);
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const guestId = url.searchParams.get('guestId') ?? '';
    const displayName = url.searchParams.get('displayName') ?? 'Khách';
    const color = url.searchParams.get('color') ?? '#EF4444';
    const visibility = (url.searchParams.get('visibility') ?? 'private') as RoomSettings['visibility'];
    const maxPlayers = Number(url.searchParams.get('maxPlayers') ?? 4);
    const roundLimit = url.searchParams.get('roundLimit');
    const hostId = url.searchParams.get('hostId') ?? guestId;
    const roomCode = url.searchParams.get('roomCode') ?? '';

    if (!this.state) {
      const settings: RoomSettings = {
        visibility,
        maxPlayers,
        roundLimit: roundLimit ? Number(roundLimit) : undefined,
        disconnectTimeoutMs: DISCONNECT_TIMEOUT_MS,
        startingMoney: 1500,
        goBonus: 200,
      };
      this.state = createWaitingState(this.room.id, hostId, settings);
      if (roomCode) this.room.storage.put('roomCode', roomCode);
    }

    const existing = this.state.players.find((p) => p.id === guestId);
    if (existing) {
      this.state = {
        ...this.state,
        players: this.state.players.map((p) =>
          p.id === guestId ? { ...p, connection: 'online', disconnectedAt: undefined } : p
        ),
      };
    } else if (this.state.gameStatus === 'waiting') {
      if (this.state.players.length >= this.state.settings.maxPlayers) {
        sendError(conn, 'ROOM_FULL', 'Phòng đã đầy');
        conn.close();
        return;
      }
      this.state = joinPlayer(this.state, createPlayer(guestId, displayName, color));
    } else {
      sendError(conn, 'GAME_FINISHED', 'Không thể tham gia ván đang chơi');
      conn.close();
      return;
    }

    conn.setState({ guestId });
    this.saveState();
    broadcastState(this.room, this.state);
    if (this.state.gameStatus === 'waiting' && this.state.settings.visibility === 'public') {
      void this.registerWithLobby();
    }
  }

  async onMessage(raw: string, sender: Party.Connection) {
    if (!this.state) return;
    const guestId = (sender.state as { guestId?: string })?.guestId ?? '';
    const msg = JSON.parse(raw) as ClientMessage;

    if (msg.type === 'join') return;

    const engineAction = msg.type === 'leave'
      ? null
      : { type: msg.type } as Parameters<typeof applyAction>[1];

    if (msg.type === 'leave') {
      if (this.state.gameStatus === 'waiting') {
        this.state = {
          ...this.state,
          players: this.state.players.filter((p) => p.id !== guestId),
        };
        broadcastState(this.room, this.state);
        await this.saveState();
      }
      return;
    }

    if (!engineAction) return;

    const result = applyAction(this.state, engineAction, guestId);
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

    if (msg.type === 'start_game' && this.state.settings.visibility === 'public') {
      await this.unregisterFromLobby();
    }
  }

  async registerWithLobby() {
    if (!this.state || this.state.settings.visibility !== 'public') return;
    const host = this.state.players.find((p) => p.id === this.state!.hostId);
    const roomCode = (await this.room.storage.get<string>('roomCode')) ?? this.room.id;
    const summary = {
      roomId: this.room.id,
      roomCode,
      hostName: host?.displayName ?? 'Host',
      playerCount: this.state.players.length,
      maxPlayers: this.state.settings.maxPlayers,
      visibility: 'public' as const,
      gameStatus: this.state.gameStatus,
      createdAt: Date.now(),
    };
    const hostEnv = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
    const protocol = hostEnv.startsWith('localhost') ? 'ws' : 'wss';
    try {
      const ws = new WebSocket(`${protocol}://${hostEnv}/parties/lobby/lobby`);
      await new Promise<void>((resolve, reject) => {
        ws.addEventListener('open', () => {
          ws.send(JSON.stringify({ type: 'register', room: summary }));
          ws.close();
          resolve();
        });
        ws.addEventListener('error', reject);
      });
    } catch {
      // lobby registration is best-effort in dev
    }
  }

  async unregisterFromLobby() {
    const hostEnv = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
    const protocol = hostEnv.startsWith('localhost') ? 'ws' : 'wss';
    try {
      const ws = new WebSocket(`${protocol}://${hostEnv}/parties/lobby/lobby`);
      await new Promise<void>((resolve, reject) => {
        ws.addEventListener('open', () => {
          ws.send(JSON.stringify({ type: 'unregister', roomId: this.room.id }));
          ws.close();
          resolve();
        });
        ws.addEventListener('error', reject);
      });
    } catch {
      // best-effort
    }
  }

  async onClose(conn: Party.Connection) {
    if (!this.state) return;
    const guestId = (conn.state as { guestId?: string })?.guestId ?? '';

    if (this.state.gameStatus === 'waiting') {
      this.state = {
        ...this.state,
        players: this.state.players.filter((p) => p.id !== guestId),
      };
    } else if (this.state.gameStatus === 'playing') {
      this.state = {
        ...this.state,
        players: this.state.players.map((p) =>
          p.id === guestId
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

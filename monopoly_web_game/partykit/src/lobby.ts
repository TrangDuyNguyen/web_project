import type * as Party from 'partykit/server';
import type { RoomSummary } from '../../src/types/room';
import type { LobbyRequest } from './utils/lobbyClient';

export default class LobbyServer implements Party.Server {
  rooms: RoomSummary[] = [];

  constructor(readonly room: Party.Room) {}

  async onStart() {
    const stored = await this.room.storage.get<RoomSummary[]>('rooms');
    if (stored) this.rooms = stored;
    await this.room.storage.setAlarm(Date.now() + 30_000);
  }

  async persist() {
    await this.room.storage.put('rooms', this.rooms);
  }

  applyMessage(msg: LobbyRequest) {
    if (msg.type === 'register') {
      this.rooms = this.rooms.filter((r) => r.roomId !== msg.room.roomId);
      this.rooms.push(msg.room);
    } else if (msg.type === 'unregister') {
      this.rooms = this.rooms.filter((r) => r.roomId !== msg.roomId);
    }
  }

  broadcastSync() {
    this.room.broadcast(JSON.stringify({ type: 'lobby_sync', rooms: this.rooms }));
  }

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: 'lobby_sync', rooms: this.rooms }));
  }

  async onMessage(raw: string) {
    const msg = JSON.parse(raw) as LobbyRequest;
    this.applyMessage(msg);
    await this.persist();
    this.broadcastSync();
  }

  async onRequest(req: Party.Request) {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const msg = (await req.json()) as LobbyRequest;
    this.applyMessage(msg);
    await this.persist();
    this.broadcastSync();
    return new Response(JSON.stringify({ ok: true, rooms: this.rooms.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async onAlarm() {
    this.rooms = this.rooms.filter((r) => Date.now() - r.createdAt < 30 * 60 * 1000);
    await this.persist();
    this.broadcastSync();
    await this.room.storage.setAlarm(Date.now() + 30_000);
  }
}

import type * as Party from 'partykit/server';
import type { RoomSummary } from '../../src/types/room';

type LobbyMessage =
  | { type: 'register'; room: RoomSummary }
  | { type: 'unregister'; roomId: string };

export default class LobbyServer implements Party.Server {
  rooms: RoomSummary[] = [];

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: 'lobby_sync', rooms: this.rooms }));
  }

  onMessage(raw: string) {
    const msg = JSON.parse(raw) as LobbyMessage;
    if (msg.type === 'register') {
      this.rooms = this.rooms.filter((r) => r.roomId !== msg.room.roomId);
      this.rooms.push(msg.room);
    } else if (msg.type === 'unregister') {
      this.rooms = this.rooms.filter((r) => r.roomId !== msg.roomId);
    }
    this.room.broadcast(JSON.stringify({ type: 'lobby_sync', rooms: this.rooms }));
  }

  async onAlarm() {
    this.rooms = this.rooms.filter((r) => Date.now() - r.createdAt < 30 * 60 * 1000);
    this.room.broadcast(JSON.stringify({ type: 'lobby_sync', rooms: this.rooms }));
    await this.room.storage.setAlarm(Date.now() + 30_000);
  }

  async onStart() {
    await this.room.storage.setAlarm(Date.now() + 30_000);
  }
}

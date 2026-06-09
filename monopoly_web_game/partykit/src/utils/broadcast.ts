import type * as Party from 'partykit/server';
import type { GameState } from '../../../src/types/game';

export function broadcastState(room: Party.Room, state: GameState) {
  room.broadcast(JSON.stringify({ type: 'state_sync', state }));
}

export function sendError(conn: Party.Connection, code: string, message: string) {
  conn.send(JSON.stringify({ type: 'error', code, message }));
}

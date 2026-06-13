import type * as Party from 'partykit/server';
import type { RoomSummary } from '../../../src/types/room';

export type LobbyRequest =
  | { type: 'register'; room: RoomSummary }
  | { type: 'unregister'; roomId: string };

export async function notifyLobby(room: Party.Room, message: LobbyRequest): Promise<void> {
  try {
    const res = await room.context.parties.lobby.get('lobby').fetch(
      new Request('https://partykit.internal/lobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })
    );
    if (!res.ok) {
      console.error('Lobby notify failed:', res.status, await res.text());
    }
  } catch (error) {
    console.error('Lobby notify error:', error);
  }
}

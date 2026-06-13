/**
 * Smoke test: create room via API, join 2 players via WebSocket, start game, roll dice.
 * Local: npm run dev + npm run partykit:dev
 * Production: NEXT_PUBLIC_APP_URL=... NEXT_PUBLIC_PARTYKIT_HOST=... node scripts/e2e-smoke.mjs
 */
const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const PK = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
const wsProtocol = PK.startsWith('localhost') ? 'ws' : 'wss';

const res = await fetch(`${APP}/api/rooms`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ visibility: 'private', maxPlayers: 4 }),
});
if (!res.ok) throw new Error(`API failed: ${res.status}`);
const { roomId } = await res.json();

function connect(guestId, name, color, hostId) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      guestId, displayName: name, color, hostId,
      visibility: 'private', maxPlayers: '4', roomCode: roomId,
    });
    const ws = new WebSocket(`${wsProtocol}://${PK}/parties/game/${roomId}?${params}`);
    let lastState = null;
    ws.addEventListener('open', () => resolve({ ws, getState: () => lastState }));
    ws.addEventListener('error', reject);
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'state_sync') lastState = msg.state;
    });
  });
}

const hostId = crypto.randomUUID();
const host = await connect(hostId, 'Host', '#EF4444', hostId);
await new Promise((r) => setTimeout(r, 800));
const guest = await connect(crypto.randomUUID(), 'Guest', '#3B82F6', hostId);
await new Promise((r) => setTimeout(r, 800));

host.ws.send(JSON.stringify({ type: 'start_game' }));
await new Promise((r) => setTimeout(r, 1500));
host.ws.send(JSON.stringify({ type: 'roll_dice' }));
await new Promise((r) => setTimeout(r, 2000));

const state = host.getState();
if (!state || state.gameStatus !== 'playing') throw new Error('Game did not start');
if (state.players.length !== 2) throw new Error(`Expected 2 players, got ${state.players.length}`);
if (!state.dice) throw new Error('Dice not rolled');

console.log('✓ E2E smoke passed:', { roomId, dice: state.dice.total, phase: state.phase });
host.ws.close();
guest.ws.close();

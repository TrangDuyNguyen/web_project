/**
 * Smoke test: init room on PartyKit, join 2 players via JWT WebSocket, start game, roll dice.
 * Local: npm run partykit:dev (AUTH_SECRET in partykit.json)
 * Env: AUTH_SECRET, NEXT_PUBLIC_PARTYKIT_HOST
 */
import { SignJWT } from 'jose';

const SECRET = process.env.AUTH_SECRET ?? 'dev-secret-change-in-production-min-32-chars';
const PK = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
const wsProtocol = PK.startsWith('localhost') ? 'ws' : 'wss';
const httpProtocol = PK.startsWith('localhost') ? 'http' : 'https';

const roomId = crypto.randomUUID().slice(0, 6).toUpperCase();
const hostUserId = 'google:host-smoke-test';
const guestUserId = 'github:guest-smoke-test';

async function mintToken({ sub, displayName, color, isHost }) {
  const key = new TextEncoder().encode(SECRET);
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ roomId, displayName, color, ...(isHost ? { isHost: true } : {}) })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(key);
}

const initRes = await fetch(`${httpProtocol}://${PK}/parties/game/${roomId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hostUserId,
    visibility: 'private',
    maxPlayers: 4,
  }),
});
if (!initRes.ok) throw new Error(`Room init failed: ${initRes.status}`);

function connect(userId, name, color, isHost) {
  return new Promise(async (resolve, reject) => {
    const token = await mintToken({ sub: userId, displayName: name, color, isHost });
    const ws = new WebSocket(`${wsProtocol}://${PK}/parties/game/${roomId}?token=${encodeURIComponent(token)}`);
    let lastState = null;
    ws.addEventListener('open', () => resolve({ ws, getState: () => lastState }));
    ws.addEventListener('error', reject);
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'state_sync') lastState = msg.state;
    });
  });
}

const host = await connect(hostUserId, 'Host', '#EF4444', true);
await new Promise((r) => setTimeout(r, 800));
const guest = await connect(guestUserId, 'Guest', '#3B82F6', false);
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

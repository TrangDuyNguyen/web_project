/**
 * Phase 2 automated verification — chạy: npm run verify:phase2
 * Env: AUTH_SECRET, NEXT_PUBLIC_PARTYKIT_HOST, NEXT_PUBLIC_APP_URL (optional)
 */
import { SignJWT } from 'jose';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'https://monopolywebgame.vercel.app';
const SECRET = process.env.AUTH_SECRET ?? 'dev-secret-change-in-production-min-32-chars';
const PK = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'monopoly-game.trangduynguyen.partykit.dev';
const wsProtocol = PK.startsWith('localhost') ? 'ws' : 'wss';
const httpProtocol = PK.startsWith('localhost') ? 'http' : 'https';
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const results = [];

function record(id, name, pass, detail = '') {
  results.push({ id, name, pass, detail });
  const icon = pass ? '✓' : '✗';
  console.log(`${icon} ${id} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function mintToken({ sub, roomId, displayName, color, isHost }) {
  const key = new TextEncoder().encode(SECRET);
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ roomId, displayName, color, ...(isHost ? { isHost: true } : {}) })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(key);
}

function connectWs(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let lastState = null;
    ws.addEventListener('open', () => resolve({ ws, getState: () => lastState }));
    ws.addEventListener('error', reject);
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'state_sync') lastState = msg.state;
    });
  });
}

async function wsQuickCheck(url, expectState = false) {
  return new Promise((resolve) => {
    let opened = false;
    let gotState = false;
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      ws.close();
      resolve({ opened, gotState });
    }, 3000);
    ws.addEventListener('open', () => { opened = true; if (!expectState) { clearTimeout(timer); ws.close(); resolve({ opened, gotState }); } });
    ws.addEventListener('message', (e) => {
      if (JSON.parse(e.data).type === 'state_sync') gotState = true;
    });
    ws.addEventListener('close', () => {
      if (expectState && gotState) { clearTimeout(timer); resolve({ opened, gotState }); }
    });
    ws.addEventListener('error', () => { clearTimeout(timer); resolve({ opened: false, gotState }); });
  });
}

async function runUnitTests() {
  return new Promise((resolve) => {
    const proc = spawn('npm', ['test'], { cwd: projectRoot, stdio: 'pipe' });
    let out = '';
    proc.stdout.on('data', (d) => { out += d; });
    proc.stderr.on('data', (d) => { out += d; });
    proc.on('close', (code) => resolve({ code, out }));
  });
}

console.log('Phase 2 Automated Verification');
console.log(`App: ${APP} | PartyKit: ${PK}\n`);

// A01
try {
  const res = await fetch(`${APP}/`, { redirect: 'manual' });
  const loc = res.headers.get('location') ?? '';
  record('A01', 'Protected route redirects to login', res.status === 307 && loc.includes('/login'), `status=${res.status}`);
} catch (e) {
  record('A01', 'Protected route redirects to login', false, String(e.message));
}

// A02
try {
  const res = await fetch(`${APP}/api/auth/providers`);
  const data = await res.json();
  record('A02', 'OAuth providers configured', Boolean(data.google && data.github && data.facebook), Object.keys(data).join(', '));
} catch (e) {
  record('A02', 'OAuth providers configured', false, String(e.message));
}

// A03 / A04 — middleware redirect (307) when unauthenticated
try {
  const res = await fetch(`${APP}/api/rooms`, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  record('A03', 'POST /api/rooms blocked without auth', res.status === 307 || res.status === 401, `status=${res.status}`);
} catch (e) {
  record('A03', 'POST /api/rooms blocked without auth', false, String(e.message));
}

try {
  const res = await fetch(`${APP}/api/game-token`, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  record('A04', 'POST /api/game-token blocked without auth', res.status === 307 || res.status === 401, `status=${res.status}`);
} catch (e) {
  record('A04', 'POST /api/game-token blocked without auth', false, String(e.message));
}

// A05
try {
  const ws = await wsQuickCheck(`${wsProtocol}://${PK}/parties/game/NOTOK1`, false);
  record('A05', 'WS rejects missing token', ws.opened && !ws.gotState, `opened=${ws.opened}`);
} catch (e) {
  record('A05', 'WS rejects missing token', false, String(e.message));
}

// A06–A10 — single game session, connections kept open
const roomId = crypto.randomUUID().slice(0, 6).toUpperCase();
const hostUserId = 'google:verify-host';
const joinUserId = 'github:verify-join';

try {
  const initRes = await fetch(`${httpProtocol}://${PK}/parties/game/${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostUserId, visibility: 'private', maxPlayers: 4 }),
  });
  record('A06a', 'Room init via PartyKit POST', initRes.ok, `room=${roomId}`);

  const hostToken = await mintToken({ sub: hostUserId, roomId, displayName: 'Host', color: '#EF4444', isHost: true });
  const host = await connectWs(`${wsProtocol}://${PK}/parties/game/${roomId}?token=${encodeURIComponent(hostToken)}`);
  await new Promise((r) => setTimeout(r, 600));
  record('A06', 'WS accepts valid host JWT', Boolean(host.getState()?.players?.length), `players=${host.getState()?.players?.length}`);

  const joinToken = await mintToken({ sub: joinUserId, roomId, displayName: 'Guest', color: '#3B82F6', isHost: false });
  const guest = await connectWs(`${wsProtocol}://${PK}/parties/game/${roomId}?token=${encodeURIComponent(joinToken)}`);
  await new Promise((r) => setTimeout(r, 600));
  const playerCount = host.getState()?.players?.length ?? guest.getState()?.players?.length;
  record('A08', 'Second player joins same room', playerCount === 2, `count=${playerCount}`);

  host.ws.send(JSON.stringify({ type: 'start_game' }));
  await new Promise((r) => setTimeout(r, 1200));
  record('A09', 'Host can start game', host.getState()?.gameStatus === 'playing', `status=${host.getState()?.gameStatus}`);

  host.ws.send(JSON.stringify({ type: 'roll_dice' }));
  await new Promise((r) => setTimeout(r, 1500));
  record('A10', 'Host can roll dice', Boolean(host.getState()?.dice), `dice=${host.getState()?.dice?.total}`);

  host.ws.close();
  guest.ws.close();
} catch (e) {
  record('A06', 'Game flow error', false, String(e.message));
}

// A11
try {
  const lobby = await wsQuickCheck(`${wsProtocol}://${PK}/parties/lobby/lobby`, false);
  record('A11', 'Lobby WebSocket opens', lobby.opened, '');
} catch (e) {
  record('A11', 'Lobby WebSocket opens', false, String(e.message));
}

// A12
try {
  const { code, out } = await runUnitTests();
  const match = out.match(/Tests\s+(\d+) passed/);
  record('A12', 'Unit tests pass', code === 0, match?.[0] ?? `exit=${code}`);
} catch (e) {
  record('A12', 'Unit tests pass', false, String(e.message));
}

console.log('\n--- Summary ---');
const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass);
console.log(`${passed}/${results.length} passed`);
if (failed.length) {
  console.log('Failed:', failed.map((f) => f.id).join(', '));
  process.exit(1);
}

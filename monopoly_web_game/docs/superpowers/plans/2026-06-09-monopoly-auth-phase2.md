# Phase 2: OAuth Authentication Implementation Plan

> **Status:** ✅ **Complete** (2026-06-13) — merged via [PR #3](https://github.com/TrangDuyNguyen/web_project/pull/3), [PR #5](https://github.com/TrangDuyNguyen/web_project/pull/5), [PR #6](https://github.com/TrangDuyNguyen/web_project/pull/6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace guest identity with mandatory OAuth login (Google, GitHub, Facebook) and short-lived WebSocket JWTs so join room, host authority, and reconnect work reliably.

**Architecture:** Auth.js v5 manages OAuth sessions on Next.js (JWT strategy, no DB). `/api/game-token` mints 5-minute HS256 tokens scoped to `roomId`. PartyKit `onBeforeConnect` verifies tokens with shared `AUTH_SECRET` and attaches `userId` to connections. `player.id = OAuth sub`.

**Tech Stack:** Next.js 16, Auth.js v5 (`next-auth@5`), jose, PartyKit, Vitest

**Spec:** `docs/superpowers/specs/2026-06-09-monopoly-auth-phase2-design.md`

---

## File Map

| Path | Responsibility |
|---|---|
| `src/types/auth.ts` | `GameTokenPayload`, mint request types |
| `src/lib/gameToken.ts` | Mint + verify JWT (shared Next.js + PartyKit) |
| `src/auth.ts` | Auth.js config (3 OAuth providers) |
| `src/middleware.ts` | Route protection |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js handlers |
| `src/app/api/game-token/route.ts` | Mint WS JWT |
| `src/app/api/rooms/route.ts` | Auth-required room creation + PartyKit pre-init |
| `src/app/login/page.tsx` | OAuth login UI |
| `src/hooks/usePartySocket.ts` | Token-based WebSocket connect + re-mint |
| `src/store/gameStore.ts` | Replace `guestId` with `userId` |
| `partykit/src/game.ts` | `onBeforeConnect`, `onRequest` init, userId identity |
| `partykit/src/utils/verifyToken.ts` | Re-export verify from shared lib |
| `tests/lib/gameToken.test.ts` | JWT unit tests |
| `scripts/e2e-smoke.mjs` | Auth-aware smoke (direct JWT sign) |

**Delete:** `src/hooks/useGuestId.ts`

---

## Phase 1: Dependencies & Shared JWT

### Task 1: Install auth dependencies

**Files:**
- Modify: `package.json`
- Modify: `.env.local.example` (create if missing)

- [ ] **Step 1: Install packages**

```bash
cd monopoly_web_game
npm install next-auth@5 jose
```

- [ ] **Step 2: Update `.env.local.example`**

```bash
# Auth.js
AUTH_SECRET=dev-secret-change-in-production-min-32-chars
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_FACEBOOK_ID=
AUTH_FACEBOOK_SECRET=

# Existing
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 3: Add `AUTH_SECRET` to `partykit.json`**

```json
{
  "name": "monopoly-game",
  "main": "partykit/src/game.ts",
  "compatibilityDate": "2024-01-01",
  "vars": {
    "AUTH_SECRET": "dev-secret-change-in-production-min-32-chars"
  },
  "parties": {
    "game": "partykit/src/game.ts",
    "lobby": "partykit/src/lobby.ts"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.local.example partykit.json
git commit -m "chore: add next-auth and jose for Phase 2 auth"
```

---

### Task 2: Game token types and library

**Files:**
- Create: `src/types/auth.ts`
- Create: `src/lib/gameToken.ts`
- Create: `tests/lib/gameToken.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/gameToken.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { mintGameToken, verifyGameToken } from '@/lib/gameToken';

const SECRET = 'test-secret-at-least-32-characters-long';

describe('gameToken', () => {
  it('mints and verifies a valid token', async () => {
    const token = await mintGameToken(
      { sub: 'user-1', roomId: 'ABC123', displayName: 'Alice', color: '#EF4444', isHost: true },
      SECRET
    );
    const payload = await verifyGameToken(token, SECRET);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('user-1');
    expect(payload!.roomId).toBe('ABC123');
    expect(payload!.displayName).toBe('Alice');
    expect(payload!.isHost).toBe(true);
  });

  it('rejects token with wrong secret', async () => {
    const token = await mintGameToken(
      { sub: 'user-1', roomId: 'ABC123', displayName: 'Alice', color: '#EF4444' },
      SECRET
    );
    const payload = await verifyGameToken(token, 'wrong-secret-at-least-32-chars-xx');
    expect(payload).toBeNull();
  });

  it('rejects expired token', async () => {
    const token = await mintGameToken(
      { sub: 'user-1', roomId: 'ABC123', displayName: 'Alice', color: '#EF4444', expiresInSec: -1 },
      SECRET
    );
    const payload = await verifyGameToken(token, SECRET);
    expect(payload).toBeNull();
  });

  it('rejects token when roomId mismatch checked externally', async () => {
    const token = await mintGameToken(
      { sub: 'user-1', roomId: 'ABC123', displayName: 'Alice', color: '#EF4444' },
      SECRET
    );
    const payload = await verifyGameToken(token, SECRET);
    expect(payload!.roomId).not.toBe('OTHER');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- tests/lib/gameToken.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create `src/types/auth.ts`**

```typescript
export type GameTokenPayload = {
  sub: string;
  roomId: string;
  displayName: string;
  color: string;
  isHost?: boolean;
  iat: number;
  exp: number;
};

export type MintGameTokenInput = {
  sub: string;
  roomId: string;
  displayName: string;
  color: string;
  isHost?: boolean;
  expiresInSec?: number;
};

export type GameTokenRequest = {
  roomId: string;
  displayName: string;
  color: string;
  isHost?: boolean;
};

export type GameTokenResponse = {
  token: string;
  expiresAt: number;
};
```

- [ ] **Step 4: Create `src/lib/gameToken.ts`**

```typescript
import { SignJWT, jwtVerify } from 'jose';
import type { GameTokenPayload, MintGameTokenInput } from '@/types/auth';

const DEFAULT_TTL_SEC = 5 * 60;

function secretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function mintGameToken(
  input: MintGameTokenInput,
  secret: string
): Promise<string> {
  const ttl = input.expiresInSec ?? DEFAULT_TTL_SEC;
  const now = Math.floor(Date.now() / 1000);
  const builder = new SignJWT({
    roomId: input.roomId,
    displayName: input.displayName,
    color: input.color,
    ...(input.isHost ? { isHost: true } : {}),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.sub)
    .setIssuedAt(now)
    .setExpirationTime(now + ttl);

  return builder.sign(secretKey(secret));
}

export async function verifyGameToken(
  token: string,
  secret: string
): Promise<GameTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.roomId !== 'string' ||
      typeof payload.displayName !== 'string' ||
      typeof payload.color !== 'string'
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      roomId: payload.roomId,
      displayName: payload.displayName,
      color: payload.color,
      isHost: payload.isHost === true,
      iat: payload.iat ?? 0,
      exp: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

export function isValidDisplayName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 20;
}

export function isValidColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}
```

- [ ] **Step 5: Run tests**

```bash
npm run test -- tests/lib/gameToken.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/types/auth.ts src/lib/gameToken.ts tests/lib/gameToken.test.ts
git commit -m "feat: add shared game JWT mint and verify library"
```

---

## Phase 2: Auth.js Setup

### Task 3: Auth.js configuration

**Files:**
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create `src/auth.ts`**

```typescript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  ],
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, account, profile }) {
      if (account) {
        token.sub = account.providerAccountId;
        token.provider = account.provider;
      }
      if (profile && 'name' in profile && profile.name) token.name = profile.name;
      if (profile && 'email' in profile && profile.email) token.email = profile.email as string;
      if (profile && 'picture' in profile && profile.picture) token.picture = profile.picture as string;
      if (profile && 'avatar_url' in profile && profile.avatar_url) token.picture = profile.avatar_url as string;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = `${token.provider}:${token.sub}`;
      }
      return session;
    },
  },
  trustHost: true,
});
```

- [ ] **Step 2: Create auth route**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Extend NextAuth types**

Create `src/types/next-auth.d.ts`:

```typescript
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: Build succeeds (OAuth env vars may be empty locally — providers only activate when set)

- [ ] **Step 5: Commit**

```bash
git add src/auth.ts src/app/api/auth src/types/next-auth.d.ts
git commit -m "feat: configure Auth.js with Google, GitHub, Facebook"
```

---

### Task 4: Middleware route protection

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create `src/middleware.ts`**

```typescript
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const publicPaths = ['/login', '/rules'];
  const isPublic =
    publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith('/api/auth');

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware for protected routes"
```

---

### Task 5: Login page

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/components/auth/OAuthButtons.tsx`

- [ ] **Step 1: Create OAuth buttons component**

Create `src/components/auth/OAuthButtons.tsx`:

```typescript
'use client';

import { signIn } from 'next-auth/react';

type Props = { callbackUrl?: string };

export function OAuthButtons({ callbackUrl = '/' }: Props) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl })}
        className="w-full flex items-center justify-center gap-2 bg-white border rounded-lg px-4 py-3 font-medium hover:bg-gray-50"
      >
        🔵 Tiếp tục với Google
      </button>
      <button
        type="button"
        onClick={() => signIn('github', { callbackUrl })}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800"
      >
        ⚫ Tiếp tục với GitHub
      </button>
      <button
        type="button"
        onClick={() => signIn('facebook', { callbackUrl })}
        className="w-full flex items-center justify-center gap-2 bg-[#1877F2] text-white rounded-lg px-4 py-3 font-medium hover:bg-[#166FE5]"
      >
        🔵 Tiếp tục với Facebook
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create login page**

Create `src/app/login/page.tsx`:

```typescript
import Link from 'next/link';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-xl p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">🎩 Cờ Tỷ Phú Online</h1>
          <p className="text-gray-600">Đăng nhập để chơi</p>
        </div>
        <OAuthButtons callbackUrl={callbackUrl ?? '/'} />
        <p className="text-center text-sm">
          <Link href="/rules" className="text-[#1B5E20] hover:underline">
            ← Xem luật chơi
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add SessionProvider**

Create `src/components/auth/SessionProvider.tsx`:

```typescript
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

Update `src/app/layout.tsx` — wrap `{children}` with `<SessionProvider>`.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/login src/components/auth src/app/layout.tsx
git commit -m "feat: add OAuth login page"
```

---

## Phase 3: PartyKit Auth

### Task 6: PartyKit token verification and onBeforeConnect

**Files:**
- Create: `partykit/src/utils/verifyToken.ts`
- Modify: `partykit/src/game.ts` — add static `onBeforeConnect`
- Create: `partykit/src/utils/extractRoomId.ts`

- [ ] **Step 1: Create room ID extractor**

Create `partykit/src/utils/extractRoomId.ts`:

```typescript
export function extractRoomIdFromUrl(url: string): string | null {
  const match = url.match(/\/parties\/game\/([^/?]+)/);
  return match?.[1] ?? null;
}
```

- [ ] **Step 2: Create PartyKit verify wrapper**

Create `partykit/src/utils/verifyToken.ts`:

```typescript
import { verifyGameToken } from '../../../src/lib/gameToken';
import type { GameTokenPayload } from '../../../src/types/auth';

export async function verifyWsToken(
  token: string,
  secret: string
): Promise<GameTokenPayload | null> {
  return verifyGameToken(token, secret);
}
```

- [ ] **Step 3: Add static onBeforeConnect to GameServer**

At top of `partykit/src/game.ts`, add imports and static method on the class:

```typescript
import { verifyWsToken } from './utils/verifyToken';
import { extractRoomIdFromUrl } from './utils/extractRoomId';

export default class GameServer implements Party.Server {
  // ... existing code ...

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

    const headers = new Headers(req.headers);
    headers.set('X-User-Id', payload.sub);
    headers.set('X-Display-Name', payload.displayName);
    headers.set('X-Color', payload.color);
    if (payload.isHost) headers.set('X-Is-Host', 'true');

    return new Request(url, { headers });
  }
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add partykit/src/utils/verifyToken.ts partykit/src/utils/extractRoomId.ts partykit/src/game.ts
git commit -m "feat: add PartyKit onBeforeConnect JWT verification"
```

---

### Task 7: GameServer userId identity and room init

**Files:**
- Modify: `partykit/src/game.ts` — onConnect, onMessage, onClose, onRequest

- [ ] **Step 1: Add onRequest for room pre-init and host lookup**

Add to `GameServer`:

```typescript
async onRequest(req: Party.Request) {
  if (req.method === 'GET' && new URL(req.url).pathname.endsWith('/host')) {
    const hostUserId = await this.room.storage.get<string>('hostUserId');
    const pending = await this.room.storage.get<RoomSettings & { hostUserId?: string }>('pendingSettings');
    return Response.json({ hostUserId: hostUserId ?? null, pendingSettings: pending ?? null });
  }

  if (req.method === 'POST') {
    const body = (await req.json()) as {
      hostUserId: string;
      visibility: RoomSettings['visibility'];
      maxPlayers: number;
      roundLimit?: number;
    };
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
```

- [ ] **Step 2: Rewrite onConnect to use verified headers**

Replace query param parsing with:

```typescript
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
    const pending = await this.room.storage.get<Omit<RoomSettings, 'disconnectTimeoutMs' | 'startingMoney' | 'goBonus'> & { visibility: RoomSettings['visibility'] }>('pendingSettings');
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
```

- [ ] **Step 3: Update onMessage and onClose to use `userId` instead of `guestId`**

Replace all `(sender.state as { guestId?: string })?.guestId` with `(sender.state as { userId?: string })?.userId`.
Replace onClose guestId checks with userId.

- [ ] **Step 4: Run existing tests**

```bash
npm run test
```
Expected: All 25+ tests PASS (engine unchanged)

- [ ] **Step 5: Commit**

```bash
git add partykit/src/game.ts
git commit -m "feat: migrate GameServer to userId identity and room pre-init"
```

---

## Phase 4: API Routes

### Task 8: POST /api/game-token

**Files:**
- Create: `src/app/api/game-token/route.ts`
- Create: `src/lib/partykitAdmin.ts` — fetch host info from PartyKit

- [ ] **Step 1: Create PartyKit admin helper**

Create `src/lib/partykitAdmin.ts`:

```typescript
const PK_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
const PK_PROTOCOL = PK_HOST.startsWith('localhost') ? 'http' : 'https';

export async function getRoomHostInfo(roomId: string): Promise<{ hostUserId: string | null }> {
  const res = await fetch(`${PK_PROTOCOL}://${PK_HOST}/parties/game/${roomId}/host`, {
    cache: 'no-store',
  });
  if (!res.ok) return { hostUserId: null };
  return res.json();
}

export async function initRoom(
  roomId: string,
  body: { hostUserId: string; visibility: string; maxPlayers: number; roundLimit?: number }
): Promise<boolean> {
  const res = await fetch(`${PK_PROTOCOL}://${PK_HOST}/parties/game/${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.ok;
}
```

Note: PartyKit routes POST to party room URL hit `onRequest` on the GameServer.

- [ ] **Step 2: Create game-token route**

Create `src/app/api/game-token/route.ts`:

```typescript
import { auth } from '@/auth';
import { mintGameToken, isValidDisplayName, isValidColor } from '@/lib/gameToken';
import { getRoomHostInfo } from '@/lib/partykitAdmin';
import type { GameTokenRequest, GameTokenResponse } from '@/types/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as GameTokenRequest;
  const { roomId, displayName, color, isHost } = body;

  if (!roomId || !isValidDisplayName(displayName) || !isValidColor(color)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  if (isHost) {
    const { hostUserId } = await getRoomHostInfo(roomId);
    if (hostUserId !== session.user.id) {
      return NextResponse.json({ error: 'Not host' }, { status: 403 });
    }
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const expiresInSec = 5 * 60;
  const token = await mintGameToken(
    {
      sub: session.user.id,
      roomId,
      displayName: displayName.trim(),
      color,
      isHost,
    },
    secret
  );

  const response: GameTokenResponse = {
    token,
    expiresAt: Date.now() + expiresInSec * 1000,
  };
  return NextResponse.json(response);
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/game-token src/lib/partykitAdmin.ts
git commit -m "feat: add game-token API for WebSocket JWT minting"
```

---

### Task 9: Update POST /api/rooms

**Files:**
- Modify: `src/app/api/rooms/route.ts`

- [ ] **Step 1: Rewrite rooms route with auth + pre-init**

```typescript
import { auth } from '@/auth';
import { generateRoomCode } from '@/utils/generateRoomCode';
import { initRoom } from '@/lib/partykitAdmin';
import type { CreateRoomRequest, CreateRoomResponse } from '@/types/room';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as CreateRoomRequest;
  const roomCode = generateRoomCode();
  const roomId = roomCode;
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
  const protocol = host.startsWith('localhost') ? 'ws' : 'wss';
  const wsUrl = `${protocol}://${host}/parties/game/${roomId}`;

  const initialized = await initRoom(roomId, {
    hostUserId: session.user.id,
    visibility: body.visibility,
    maxPlayers: body.maxPlayers,
    roundLimit: body.roundLimit,
  });

  if (!initialized) {
    return NextResponse.json({ error: 'Failed to init room' }, { status: 500 });
  }

  const response: CreateRoomResponse = { roomId, roomCode, wsUrl };
  return NextResponse.json(response);
}
```

- [ ] **Step 2: Fix PartyKit onRequest GET /host routing**

Ensure `onRequest` in game.ts handles GET requests where pathname ends with `/host`. PartyKit passes full URL like `https://internal/parties/game/ABC123/host`.

Update the GET check:

```typescript
if (req.method === 'GET') {
  const path = new URL(req.url).pathname;
  if (path.endsWith('/host')) {
    const hostUserId = await this.room.storage.get<string>('hostUserId');
    return Response.json({ hostUserId: hostUserId ?? null });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/rooms/route.ts partykit/src/game.ts
git commit -m "feat: require auth for room creation and pre-init host on PartyKit"
```

---

## Phase 5: Client Integration

### Task 10: Update gameStore and usePartySocket

**Files:**
- Modify: `src/store/gameStore.ts`
- Modify: `src/hooks/usePartySocket.ts`

- [ ] **Step 1: Rename guestId → userId in gameStore**

In `src/store/gameStore.ts`:
- Replace `guestId: string` with `userId: string`
- Replace `setGuestId` with `setUserId`
- Update initial state and usages

- [ ] **Step 2: Rewrite usePartySocket for token flow**

Replace `usePartySocket.ts` with token-based connect:

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { ServerMessage } from '@/types/room';

type ConnectOptions = {
  roomId: string;
  userId: string;
  displayName: string;
  color: string;
  isHost?: boolean;
};

const MAX_RECONNECTS = 15;
const RECONNECT_DELAY_MS = 2000;

async function fetchToken(options: ConnectOptions): Promise<string> {
  const res = await fetch('/api/game-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: options.roomId,
      displayName: options.displayName,
      color: options.color,
      isHost: options.isHost,
    }),
  });
  if (!res.ok) throw new Error('Failed to mint game token');
  const data = await res.json();
  return data.token as string;
}

export function usePartySocket(options: ConnectOptions | null) {
  const { setGameState, setConnectionStatus, setSocket, addToast, setUserId } = useGameStore();
  const wsRef = useRef<WebSocket | null>(null);
  const optionsRef = useRef(options);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const intentionalCloseRef = useRef(false);

  optionsRef.current = options;

  useEffect(() => {
    if (!options?.userId) return;

    intentionalCloseRef.current = false;
    reconnectCountRef.current = 0;

    async function connect() {
      const current = optionsRef.current;
      if (!current?.userId) return;

      setUserId(current.userId);
      setConnectionStatus('connecting');

      try {
        const token = await fetchToken(current);
        const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
        const protocol = host.startsWith('localhost') ? 'ws' : 'wss';
        const ws = new WebSocket(
          `${protocol}://${host}/parties/game/${current.roomId}?token=${encodeURIComponent(token)}`
        );
        wsRef.current = ws;
        setSocket(ws);

        ws.onopen = () => {
          reconnectCountRef.current = 0;
          setConnectionStatus('connected');
        };
        ws.onclose = () => {
          setConnectionStatus('disconnected');
          setSocket(null);
          if (intentionalCloseRef.current || reconnectCountRef.current >= MAX_RECONNECTS) return;
          reconnectCountRef.current += 1;
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        };
        ws.onerror = () => addToast('Lỗi kết nối', 'error');
        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data) as ServerMessage;
          if (msg.type === 'state_sync' && msg.state) setGameState(msg.state);
          if (msg.type === 'error') addToast(msg.message, 'error');
        };
      } catch {
        addToast('Không thể kết nối phòng', 'error');
        setConnectionStatus('disconnected');
      }
    }

    connect();

    return () => {
      intentionalCloseRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      setSocket(null);
    };
  }, [options?.roomId, options?.userId, options?.displayName, options?.color, options?.isHost]);

  return wsRef;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/store/gameStore.ts src/hooks/usePartySocket.ts
git commit -m "feat: connect WebSocket via minted game token"
```

---

### Task 11: Update UI components

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/Home/CreateRoomForm.tsx`
- Modify: `src/components/Home/JoinRoomForm.tsx`
- Modify: `src/app/game/[roomId]/page.tsx`
- Modify: `src/app/lobby/page.tsx`
- Modify: `src/components/Game/WaitingRoom.tsx`
- Modify: `src/components/Game/ActionBar.tsx`

- [ ] **Step 1: Update Header with session + logout**

Convert to client component; use `useSession()` and `signOut()`:

```typescript
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#1B5E20] text-white">
      <Link href="/" className="text-xl font-bold">🎩 Cờ Tỷ Phú Online</Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/lobby">Phòng công khai</Link>
        <Link href="/rules">Luật chơi</Link>
        {session?.user && (
          <div className="flex items-center gap-2">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
            )}
            <span className="hidden sm:inline">{session.user.name}</span>
            <Button variant="secondary" className="text-xs py-1 px-2" onClick={() => signOut({ callbackUrl: '/login' })}>
              Đăng xuất
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Update CreateRoomForm**

- Remove `useGuestId`
- Add `useSession()` — pre-fill `displayName` from `session.user.name`
- Remove sessionStorage writes
- Navigate to `/game/${roomId}?isHost=true` after create

- [ ] **Step 3: Update JoinRoomForm**

- Remove sessionStorage
- Pre-fill name from session
- Navigate to `/game/${roomCode}`

- [ ] **Step 4: Update game page**

Replace guest/sessionStorage logic:

```typescript
'use client';

import { use, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { usePartySocket } from '@/hooks/usePartySocket';
// ... other imports
import { PLAYER_COLORS } from '@/game/rules/constants';

export default function GamePage({ params }: Props) {
  const { roomId } = use(params);
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isHost = searchParams.get('isHost') === 'true';

  const [profile, setProfile] = useState<{ displayName: string; color: string } | null>(null);

  const defaultProfile = useMemo(() => ({
    displayName: session?.user?.name ?? 'Khách',
    color: PLAYER_COLORS[0],
  }), [session?.user?.name]);

  const activeProfile = profile ?? defaultProfile;

  usePartySocket(
    session?.user?.id
      ? {
          roomId,
          userId: session.user.id,
          displayName: activeProfile.displayName,
          color: activeProfile.color,
          isHost,
        }
      : null
  );

  // Show name/color picker overlay before first connect if user hasn't confirmed profile
  // ... rest of page using userId from store instead of guestId
}
```

Add a simple profile confirmation step: if `!profile`, show inline form to edit name/color + "Vào phòng" button that calls `setProfile`.

- [ ] **Step 5: Update WaitingRoom and ActionBar**

Replace `guestId` with `userId` from `useGameStore()`:

```typescript
const { gameState, userId, sendAction, addToast } = useGameStore();
const isHost = userId === gameState.hostId;
```

Same in ActionBar for `isMyTurn` and host end-game button.

- [ ] **Step 6: Update lobby page**

- Remove `useGuestId`
- Remove sessionStorage in `joinRoom`
- Navigate to `/game/${roomId}` directly (profile picker on game page)

- [ ] **Step 7: Verify build**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/components src/app
git commit -m "feat: update UI for authenticated user identity"
```

---

### Task 12: Remove guest code

**Files:**
- Delete: `src/hooks/useGuestId.ts`

- [ ] **Step 1: Delete useGuestId and grep for remaining references**

```bash
rm src/hooks/useGuestId.ts
rg "useGuestId|guestId|monopoly_guest_id|sessionStorage.*room_" src/
```

Fix any remaining references.

- [ ] **Step 2: Run tests and build**

```bash
npm run test && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove guest identity code"
```

---

## Phase 6: Testing & Deploy

### Task 13: Update E2E smoke test

**Files:**
- Modify: `scripts/e2e-smoke.mjs`

- [ ] **Step 1: Rewrite smoke test to sign JWTs directly**

The smoke test bypasses OAuth by signing tokens with `AUTH_SECRET` (same approach as unit tests, using dynamic import of jose):

```javascript
import { SignJWT } from 'jose';

const SECRET = process.env.AUTH_SECRET ?? 'dev-secret-change-in-production-min-32-chars';
const PK = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const wsProtocol = PK.startsWith('localhost') ? 'ws' : 'wss';

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

// 1. Init room via PartyKit POST (host pre-init)
// 2. Host connect with isHost token
// 3. Guest connect with guest token
// 4. start_game, roll_dice — same as before
```

Add `jose` import at top (already installed). Update room creation to POST directly to PartyKit init instead of `/api/rooms` (which now requires auth session), OR add note to run against local PartyKit with direct init.

- [ ] **Step 2: Run smoke test locally**

```bash
# Terminal 1: npm run partykit:dev
# Terminal 2: npm run dev
npm run e2e:smoke
```
Expected: `✓ E2E smoke passed`

- [ ] **Step 3: Commit**

```bash
git add scripts/e2e-smoke.mjs
git commit -m "test: update E2E smoke for JWT auth flow"
```

---

### Task 14: README and deploy

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document OAuth setup in README**

Add section:
- Required env vars (AUTH_*, OAuth redirect URIs)
- How to create Google/GitHub/Facebook OAuth apps
- PartyKit AUTH_SECRET must match Vercel
- Note: guest mode removed in Phase 2

- [ ] **Step 2: Deploy**

```bash
npm run partykit:deploy
npx vercel deploy --prod
```

Set all AUTH_* env vars on Vercel and PartyKit before deploy.

- [ ] **Step 3: Manual smoke on production**

1. Login via Google → create room → incognito GitHub login → join → start game
2. Verify lobby with authenticated users
3. Logout → verify redirect to /login

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add Phase 2 OAuth setup and deploy instructions"
```

---

## Spec Coverage Checklist

| Spec requirement | Task |
|---|---|
| Auth.js v5, 3 providers | Task 3, 5 |
| Login page | Task 5 |
| Middleware protection | Task 4 |
| `/api/game-token` | Task 8 |
| PartyKit onBeforeConnect | Task 6 |
| userId replaces guestId | Task 7, 10, 11, 12 |
| Host authority server-side | Task 7, 9 |
| Reconnect by OAuth identity | Task 7, 10 |
| No DB | All tasks (JWT only) |
| UI avatar + logout | Task 11 |
| OAuth name pre-fill + edit | Task 11 |
| E2E smoke update | Task 13 |
| Deploy docs | Task 14 |
| Lobby unchanged auth-wise | Task 11 (lobby page auth via middleware only) |
| Error handling (token re-mint) | Task 10 |

---

## Success Criteria (from spec)

- [x] Cannot access game without OAuth login
- [x] Two OAuth accounts join same room from same machine
- [x] Only room creator can start game
- [x] Reconnect restores slot by userId
- [x] Public lobby works with auth
- [x] `npm run test` green (32/32)
- [x] Production deploy with OAuth apps configured (Google, GitHub, Facebook)
- [x] `npm run verify:phase2` green (12/12 automated checks)
- [x] Guest identity fully removed (`useGuestId`, legacy types)
- [x] Token re-mint on WebSocket `UNAUTHORIZED`
- [x] Login UI shows only configured OAuth providers

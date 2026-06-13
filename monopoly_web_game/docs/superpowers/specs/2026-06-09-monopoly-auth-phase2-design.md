# Monopoly Web Game — Phase 2: Authentication Design Spec

**Date:** 2026-06-09  
**Status:** Approved (brainstorming session)  
**Depends on:** [MVP Design Spec](./2026-06-09-monopoly-web-game-design.md)  
**Goal:** Replace guest identity with mandatory OAuth login to fix join room, host authority, and reconnect mechanics.

---

## 1. Executive Summary

Phase 2 adds **mandatory OAuth authentication** (Google, GitHub, Facebook) via **Auth.js v5**, replacing the MVP `guestId` localStorage approach. Players receive a **short-lived WebSocket JWT** minted by Next.js and verified by PartyKit on every connection.

No database in Phase 2 — identity and session come entirely from OAuth + JWT.

### Key Decisions

| Topic | Decision |
|---|---|
| Auth method | OAuth only — no email/password |
| Providers | Google + GitHub + Facebook |
| Auth stack | Auth.js v5 (NextAuth) |
| Database | None — JWT/session only |
| Guest mode | Removed — login required to play |
| Display name | OAuth name as default; user can edit name + color before joining |
| WS auth | Approach 1 — short-lived JWT via `/api/game-token` |
| Player identity | `userId` = OAuth `sub` (stable per provider account) |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel — Next.js                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │ /login   │  │ Home     │  │ /game/[roomId]           │  │
│  │ OAuth btns│  │ (auth)   │  │ edit name/color → token  │  │
│  └────┬─────┘  └────┬─────┘  └────────────┬─────────────┘  │
│       │             │                      │                 │
│  Auth.js v5 (JWT session, httpOnly cookie)  │                 │
│  POST /api/game-token → WS JWT (5 min)  ◄─┘                 │
└───────────────────────────┬─────────────────────────────────┘
                            │ WebSocket ?token=<jwt>
┌───────────────────────────▼─────────────────────────────────┐
│  PartyKit                                                   │
│  onBeforeConnect: verify JWT (AUTH_SECRET shared)           │
│  GameServer: player.id = userId (OAuth sub)                 │
│  LobbyServer: unchanged (read-only public room list)        │
└─────────────────────────────────────────────────────────────┘
```

### Identity Migration

| MVP (guest) | Phase 2 (auth) |
|---|---|
| `guestId` = UUID in localStorage | `userId` = OAuth `sub` |
| No verification | JWT required on every WS connection |
| sessionStorage for name/color/host | Name/color embedded in JWT at mint time |
| Host = first connect + roomCode guard | Host = room creator (`hostUserId` in DO storage) |

### Auth Flow

1. User visits any protected route → middleware redirects to `/login`
2. User clicks Google / GitHub / Facebook → Auth.js OAuth callback
3. Auth.js sets JWT session cookie (httpOnly, 7-day expiry)
4. Redirect to original URL or `/`

### Create Room Flow

1. Authenticated user fills name (default OAuth), color, visibility
2. `POST /api/rooms` (auth required) → `{ roomId, roomCode }`
3. Server pre-registers room via PartyKit internal fetch with `hostUserId`
4. Client calls `POST /api/game-token` with `{ roomId, displayName, color, isHost: true }`
5. WebSocket connects with `?token=<jwt>`

### Join Room Flow

1. Authenticated user enters room code or clicks lobby entry
2. Edits name/color (defaults from OAuth profile)
3. Client calls `POST /api/game-token` with `{ roomId, displayName, color }`
4. WebSocket connects with `?token=<jwt>`
5. GameServer recognizes existing `userId` → reconnect; new `userId` → join

### Reconnect

- Same OAuth account = same `userId` across devices and browsers
- Existing player slot restored on reconnect (within 3-minute disconnect window)
- Bot takeover logic unchanged from MVP
- Token expiry handled by client auto re-mint + reconnect

---

## 3. JWT Schema

### WebSocket Token Payload

```typescript
type GameTokenPayload = {
  sub: string;          // userId — OAuth subject
  roomId: string;       // scoped to this room only
  displayName: string;
  color: string;        // hex
  isHost?: boolean;     // true only for room creator's first connect
  iat: number;
  exp: number;          // now + 5 minutes
};
```

- Algorithm: HS256
- Secret: `AUTH_SECRET` (shared between Vercel and PartyKit)
- Library: `jose` (works in Node.js and Cloudflare Workers)

### Auth.js Session

- Strategy: JWT (no database adapter)
- Session fields: `user.id` (OAuth sub), `user.name`, `user.email`, `user.image`
- Cookie: httpOnly, secure, sameSite=lax

---

## 4. PartyKit Changes

### `onBeforeConnect` (GameServer static method)

```typescript
static onBeforeConnect(req: Request, lobby: Lobby): Request | Response {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) return new Response('Unauthorized', { status: 401 });

  const payload = await verifyGameToken(token, env.AUTH_SECRET);
  if (!payload) return new Response('Invalid token', { status: 401 });

  const roomId = extractRoomIdFromUrl(req.url);
  if (payload.roomId !== roomId)
    return new Response('Token/room mismatch', { status: 403 });

  // Forward verified claims to onConnect via headers
  const headers = new Headers(req.headers);
  headers.set('X-User-Id', payload.sub);
  headers.set('X-Display-Name', payload.displayName);
  headers.set('X-Color', payload.color);
  if (payload.isHost) headers.set('X-Is-Host', 'true');
  return new Request(req.url, { headers });
}
```

LobbyServer does **not** require auth — read-only public room listing.

### GameServer `onConnect`

- Read `userId`, `displayName`, `color`, `isHost` from verified headers (not query params)
- Remove all guestId / roomCode query param logic

**Room initialization:**
```typescript
if (!this.state) {
  if (!isHost) {
    sendError(conn, 'ROOM_NOT_READY', 'Đang chờ host vào phòng...');
    conn.close();
    return;
  }
  this.state = createWaitingState(roomId, userId, settings);
  await this.room.storage.put('hostUserId', userId);
}
```

**Player identity:** `player.id = userId` (OAuth sub)

**onClose (waiting room):** Only remove player if no other connection shares the same `userId` (keep MVP fix).

### New file: `partykit/src/utils/verifyToken.ts`

- `verifyGameToken(token, secret): GameTokenPayload | null`
- Validates signature, expiry, required fields

---

## 5. Next.js API Changes

### `POST /api/rooms` (auth required)

```typescript
// Requires Auth.js session
Body: { visibility: 'private' | 'public', maxPlayers: number, roundLimit?: number }
Response: { roomId, roomCode, wsUrl }

Side effect: PartyKit internal fetch to pre-register hostUserId:
  parties.game.get(roomId).fetch('/init', { hostUserId, visibility, maxPlayers, roundLimit })
```

### `POST /api/game-token` (auth required)

```typescript
Body: { roomId, displayName, color, isHost?: boolean }
Response: { token, expiresAt }

Validation:
- Session must exist
- displayName: 1–20 chars
- color: valid hex
- If isHost: userId must match stored hostUserId (or room just created by this user)
- Mint JWT with 5-minute expiry scoped to roomId
```

### Auth.js route: `/api/auth/[...nextauth]`

Providers: Google, GitHub, Facebook  
Session strategy: JWT  
Callbacks: map OAuth profile to session user object

---

## 6. Route Protection

### Middleware (`src/middleware.ts`)

| Route | Access |
|---|---|
| `/login` | Public |
| `/rules` | Public |
| `/api/auth/*` | Public |
| `/`, `/lobby`, `/game/*`, `/api/rooms`, `/api/game-token` | Auth required |

Unauthenticated requests to protected routes → redirect `/login?callbackUrl=<original>`.

---

## 7. UI Changes

### New: `/login`

- Three OAuth buttons: Google, GitHub, Facebook
- Link to `/rules`
- Vietnamese copy: "Đăng nhập để chơi"
- No email/password form

### Header (all authenticated pages)

- OAuth avatar + display name
- Logout button
- Remove guest-related UI

### Home `/`

- Pre-fill display name from OAuth session
- Color picker unchanged
- Remove `useGuestId` dependency

### Game `/game/[roomId]`

- Remove sessionStorage (`room_*`, `join_*`)
- Mint token before WebSocket connect
- `isHost = session.user.id === gameState.hostId`
- `isMyTurn = current.id === session.user.id`

### Lobby `/lobby`

- Auth required
- Join: prompt name/color → mint token → navigate to game

### Removed

- `src/hooks/useGuestId.ts`
- All `localStorage.monopoly_guest_id` usage
- All sessionStorage room/join keys
- WebSocket query params: `guestId`, `hostId`, `roomCode`, `displayName`, `color`

---

## 8. Error Handling

| Error | Client behavior |
|---|---|
| 401 not logged in | Redirect `/login` |
| Token expired | Auto re-mint via `/api/game-token` + reconnect |
| `ROOM_NOT_READY` | Toast + retry connect every 2s |
| `NOT_HOST` | Toast: "Chỉ host mới bắt đầu được" |
| `NOT_ENOUGH_PLAYERS` | Toast: "Cần ít nhất 2 người chơi" |
| OAuth failure | Toast: "Đăng nhập thất bại, thử lại" |
| WS disconnect | Auto reconnect with fresh token (max 15 retries) |

---

## 9. Environment Variables

### Vercel

```
AUTH_SECRET=<random-32+-chars>
AUTH_URL=https://monopolywebgame.vercel.app
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
AUTH_FACEBOOK_ID=...
AUTH_FACEBOOK_SECRET=...
```

### PartyKit (`partykit.json` vars)

```
AUTH_SECRET=<same-as-vercel>
```

### OAuth Redirect URIs (register in each provider console)

```
https://monopolywebgame.vercel.app/api/auth/callback/google
https://monopolywebgame.vercel.app/api/auth/callback/github
https://monopolywebgame.vercel.app/api/auth/callback/facebook
```

---

## 10. Files to Create / Modify

| File | Action |
|---|---|
| `src/auth.ts` | Create — Auth.js config |
| `src/middleware.ts` | Create — route protection |
| `src/app/login/page.tsx` | Create — OAuth login UI |
| `src/app/api/auth/[...nextauth]/route.ts` | Create |
| `src/app/api/game-token/route.ts` | Create — mint WS JWT |
| `src/app/api/rooms/route.ts` | Modify — auth required + pre-init |
| `src/hooks/usePartySocket.ts` | Modify — token-based connect |
| `src/hooks/useGuestId.ts` | Delete |
| `src/components/Home/CreateRoomForm.tsx` | Modify — useSession |
| `src/components/Home/JoinRoomForm.tsx` | Modify — remove sessionStorage |
| `src/app/game/[roomId]/page.tsx` | Modify — token flow |
| `src/app/lobby/page.tsx` | Modify — auth + token join |
| `src/components/Game/WaitingRoom.tsx` | Modify — userId identity |
| `src/components/Game/ActionBar.tsx` | Modify — userId identity |
| `src/components/Header/Header.tsx` | Modify — avatar + logout |
| `partykit/src/utils/verifyToken.ts` | Create |
| `partykit/src/game.ts` | Modify — onBeforeConnect + userId |
| `partykit.json` | Modify — AUTH_SECRET var |
| `scripts/e2e-smoke.mjs` | Modify — auth-aware smoke test |

---

## 11. Testing

### Unit Tests (Vitest)

- `verifyToken.ts`: valid token, expired, wrong secret, wrong roomId, missing fields
- `/api/game-token`: mock session, isHost validation
- Game engine tests: unchanged

### Manual Smoke Test

1. Login Google → create private room
2. Incognito → login GitHub → join by room code
3. Host starts game → roll dice → buy property
4. Host disconnect → reconnect within 3 min → slot restored
5. Public lobby → create → join from lobby
6. Token expiry → auto re-mint
7. Logout → cannot access `/game`

### E2E Script Update

`scripts/e2e-smoke.mjs` updated to mint test tokens (dev helper or direct JWT sign with test secret).

---

## 12. Scope

### In Scope

- Auth.js v5 with Google, GitHub, Facebook
- Login page + middleware
- JWT game token endpoint
- PartyKit JWT verification
- userId replaces guestId throughout
- Server-side host authority
- UI: avatar, logout, OAuth name pre-fill
- Updated smoke test + deploy docs

### Out of Scope

- Database / user profile persistence
- Email/password login
- Guest mode
- Ranking / game history
- English UI
- Playwright E2E
- Account linking across providers

---

## 13. Migration & Breaking Changes

- All MVP guest rooms become invalid after deploy (acceptable — no production users)
- `localStorage.monopoly_guest_id` no longer read
- Two-tab same-browser testing now works with different OAuth accounts (incognito + different provider)

---

## 14. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---|---|
| Facebook OAuth app review delay | Medium | Ship Google + GitHub first; add Facebook when approved |
| Token in WebSocket URL logged | Low | 5-min TTL; scoped to roomId |
| Auth.js v5 + Next.js 16 compat | Medium | Pin versions; test early |
| Breaking guest rooms on deploy | Low | Accept; document in release notes |

---

## 15. Estimate

| Task | Days |
|---|---|
| Auth.js setup + login UI | 1 |
| `/api/game-token` + middleware | 0.5 |
| PartyKit JWT verify + identity | 1 |
| UI updates (Home, Game, Header) | 1 |
| Testing + deploy + OAuth apps | 1 |
| **Total** | **~4–5 days** |

---

## 16. Success Criteria

| # | Criterion |
|---|---|
| 1 | Cannot access game without OAuth login |
| 2 | Two different OAuth accounts can join same room from same machine |
| 3 | Host authority stable — only room creator can start game |
| 4 | Reconnect restores player slot by OAuth identity |
| 5 | Public lobby works with authenticated users |
| 6 | All existing engine tests pass |
| 7 | Production deploy with all 3 OAuth providers configured |

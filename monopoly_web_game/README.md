# Cờ Tỷ Phú Online

Game Cờ Tỷ Phú trên trình duyệt — 2–4 người chơi online realtime.

**Phase 2:** Bắt buộc đăng nhập OAuth (Google, GitHub, Facebook). Chế độ guest đã bỏ.

## Tech Stack

- Next.js 16 + TypeScript + Tailwind CSS
- Auth.js v5 + jose (OAuth + WebSocket JWT)
- Zustand + Framer Motion
- PartyKit (WebSocket game server)
- Vitest (game engine tests)

## Development

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — PartyKit
npm run partykit:dev

# Terminal 3 — Tests
npm run test
```

Copy `.env.local.example` to `.env.local` and fill in OAuth credentials.

## Authentication (Phase 2)

Login required via OAuth. Configure in `.env.local`:

```
AUTH_SECRET=<random-32+-chars>
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
AUTH_FACEBOOK_ID=...
AUTH_FACEBOOK_SECRET=...
```

OAuth redirect URIs (production):
- `https://monopolywebgame.vercel.app/api/auth/callback/google`
- `https://monopolywebgame.vercel.app/api/auth/callback/github`
- `https://monopolywebgame.vercel.app/api/auth/callback/facebook`

`AUTH_SECRET` must match on **Vercel** and **PartyKit**.

## E2E Smoke Test

With PartyKit dev server running:

```bash
npm run e2e:smoke
```

Smoke test bypasses OAuth by signing JWTs directly (uses `AUTH_SECRET`).

Production:

```bash
AUTH_SECRET=<prod-secret> NEXT_PUBLIC_PARTYKIT_HOST=monopoly-game.<user>.partykit.dev npm run e2e:smoke
```

## Deploy

### 1. PartyKit (game server)

```bash
npx partykit login          # first time only
npm run partykit:deploy
# Note the deployed host, e.g. monopoly-game.<user>.partykit.dev
```

**Important:** `partykit.json` vars are for local dev only. Push secrets to PartyKit Cloud:

```bash
# Set AUTH_SECRET in partykit.json (or edit after pull), then:
npx partykit env push
npm run partykit:deploy
```

Verify: `npx partykit env list`

### 2. Vercel (frontend)

```bash
npx vercel login            # first time only
npx vercel --cwd monopoly_web_game
```

Set environment variables in Vercel dashboard:

| Variable | Example |
|---|---|
| `AUTH_SECRET` | `<same-as-partykit>` |
| `AUTH_URL` | `https://your-app.vercel.app` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | OAuth credentials |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | OAuth credentials |
| `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET` | OAuth credentials |
| `NEXT_PUBLIC_PARTYKIT_HOST` | `monopoly-game.username.partykit.dev` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

### 3. Production smoke test

1. Login via OAuth → create room
2. Incognito / second browser with different OAuth account → join
3. Host starts game → roll dice
4. Public lobby: create public room → verify on `/lobby`
5. Logout → redirect to `/login`

## Production URLs

| Service | URL |
|---|---|
| **App (Vercel)** | https://monopolywebgame.vercel.app |
| **Game server (PartyKit)** | `monopoly-game.trangduynguyen.partykit.dev` |

## Docs

- Design spec: `docs/superpowers/specs/2026-06-09-monopoly-web-game-design.md`
- Phase 2 auth spec: `docs/superpowers/specs/2026-06-09-monopoly-auth-phase2-design.md`
- Implementation plan: `docs/superpowers/plans/2026-06-09-monopoly-web-game.md`
- Phase 2 plan: `docs/superpowers/plans/2026-06-09-monopoly-auth-phase2.md`

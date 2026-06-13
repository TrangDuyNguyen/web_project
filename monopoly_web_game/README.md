# Cờ Tỷ Phú Online

Game Cờ Tỷ Phú trên trình duyệt — 2–4 người chơi online realtime.

## Tech Stack

- Next.js 16 + TypeScript + Tailwind CSS
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

Copy `.env.local.example` to `.env.local`.

## E2E Smoke Test

With both dev servers running:

```bash
npm run e2e:smoke
```

## Deploy

### 1. PartyKit (game server)

```bash
npx partykit login          # first time only
npm run partykit:deploy
# Note the deployed host, e.g. monopoly-game.<user>.partykit.dev
```

### 2. Vercel (frontend)

```bash
npx vercel login            # first time only
npx vercel --cwd monopoly_web_game
```

Set environment variables in Vercel dashboard:

| Variable | Example |
|---|---|
| `NEXT_PUBLIC_PARTYKIT_HOST` | `monopoly-game.username.partykit.dev` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

### 3. Production smoke test

1. Open deployed URL
2. Create room → join from second browser/incognito
3. Start game → roll dice

## Production URLs

| Service | URL |
|---|---|
| **App (Vercel)** | https://monopolywebgame.vercel.app |
| **Game server (PartyKit)** | `monopoly-game.trangduynguyen.partykit.dev` |

## Docs

- Design spec: `docs/superpowers/specs/2026-06-09-monopoly-web-game-design.md`
- Implementation plan: `docs/superpowers/plans/2026-06-09-monopoly-web-game.md`

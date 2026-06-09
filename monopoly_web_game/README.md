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

## Deploy

1. **PartyKit:** `npm run partykit:deploy`
2. **Vercel:** Connect repo, set `NEXT_PUBLIC_PARTYKIT_HOST` to your PartyKit host

## Docs

- Design spec: `docs/superpowers/specs/2026-06-09-monopoly-web-game-design.md`
- Implementation plan: `docs/superpowers/plans/2026-06-09-monopoly-web-game.md`

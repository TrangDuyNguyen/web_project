# Monopoly Web Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based Vietnamese Monopoly game with 2–4 player online realtime multiplayer, authoritative game engine, and deploy on Vercel + PartyKit.

**Architecture:** Next.js 15 frontend mirrors state from PartyKit GameServer (one Durable Object per room). Pure TypeScript game engine in `src/game/engine/` is shared between client and server. LobbyServer tracks public waiting rooms.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Zustand, Framer Motion, PartyKit, Vitest

**Spec:** `docs/superpowers/specs/2026-06-09-monopoly-web-game-design.md`

---

## File Map

| Path | Responsibility |
|---|---|
| `src/types/game.ts` | Player, GameState, Card, BoardTile types |
| `src/types/room.ts` | ClientMessage, ServerMessage, RoomSummary |
| `src/data/board.ts` | 40 tiles + 22 properties |
| `src/data/cards.ts` | Chance + Community Chest decks |
| `src/game/rules/constants.ts` | STARTING_MONEY, GO_BONUS, JAIL_FINE, etc. |
| `src/game/engine/*.ts` | Pure game logic modules |
| `partykit/src/game.ts` | Authoritative room server |
| `partykit/src/lobby.ts` | Public room listing |
| `src/store/gameStore.ts` | Zustand mirror of server state |
| `src/hooks/usePartySocket.ts` | WebSocket connection lifecycle |
| `src/app/api/rooms/route.ts` | Room creation endpoint |
| `src/app/page.tsx` | Home — create/join |
| `src/app/lobby/page.tsx` | Public lobby |
| `src/app/game/[roomId]/page.tsx` | Game screen |
| `tests/engine/*.test.ts` | Engine unit tests |

---

## Phase 1: Project Setup

### Task 1: Scaffold Next.js 15 project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`
- Create: `.env.local.example`, `.gitignore`

- [ ] **Step 1: Initialize project in `monopoly_web_game/`**

Run from parent directory:
```bash
cd /Users/nguyenduytrang/web_project/monopoly_web_game
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```
Expected: Next.js app scaffolded (may warn about non-empty dir due to `docs/` — proceed).

- [ ] **Step 2: Install dependencies**

```bash
npm install zustand framer-motion partykit partysocket
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react partykit@latest
```

- [ ] **Step 3: Add npm scripts to `package.json`**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "partykit:dev": "partykit dev",
    "partykit:deploy": "partykit deploy"
  }
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 5: Create `.env.local.example`**

```bash
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
PARTYKIT_HOST=localhost:1999
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: scaffold Next.js 15 project with Vitest and PartyKit deps"
```

---

### Task 2: Configure PartyKit + shared path aliases

**Files:**
- Create: `partykit.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: Create `partykit.json`**

```json
{
  "name": "monopoly-game",
  "main": "partykit/src/game.ts",
  "compatibilityDate": "2024-01-01",
  "parties": {
    "game": "partykit/src/game.ts",
    "lobby": "partykit/src/lobby.ts"
  }
}
```

- [ ] **Step 2: Extend `tsconfig.json` paths**

Add to `compilerOptions.paths`:
```json
{
  "@/*": ["./src/*"],
  "@engine/*": ["./src/game/engine/*"]
}
```

- [ ] **Step 3: Create stub PartyKit servers**

Create `partykit/src/game.ts`:
```typescript
import type * as Party from 'partykit/server';

export default class GameServer implements Party.Server {
  constructor(readonly room: Party.Room) {}
  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: 'state_sync', state: null }));
  }
}
```

Create `partykit/src/lobby.ts`:
```typescript
import type * as Party from 'partykit/server';

export default class LobbyServer implements Party.Server {
  constructor(readonly room: Party.Room) {}
  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: 'lobby_sync', rooms: [] }));
  }
}
```

- [ ] **Step 4: Verify PartyKit starts**

```bash
npm run partykit:dev
```
Expected: PartyKit dev server on port 1999.

- [ ] **Step 5: Commit**

```bash
git add partykit.json partykit/ tsconfig.json
git commit -m "chore: configure PartyKit with game and lobby parties"
```

---

### Task 3: Global styles and layout shell

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/layout/Header.tsx`

- [ ] **Step 1: Update `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: #1b5e20;
  --accent: #ffd700;
  --background: #f5f0e8;
}

body {
  background-color: var(--background);
  color: #1a1a1a;
}
```

- [ ] **Step 2: Create `src/components/layout/Header.tsx`**

```tsx
import Link from 'next/link';

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#1B5E20] text-white">
      <Link href="/" className="text-xl font-bold">🎩 Cờ Tỷ Phú Online</Link>
      <nav className="flex gap-4 text-sm">
        <Link href="/lobby">Phòng công khai</Link>
        <Link href="/rules">Luật chơi</Link>
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Update `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'Cờ Tỷ Phú Online',
  description: 'Chơi Cờ Tỷ Phú online cùng bạn bè',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify dev server**

```bash
npm run dev
```
Expected: Header visible at `http://localhost:3000`.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/layout/Header.tsx
git commit -m "feat: add app shell with Vietnamese header and theme colors"
```

---

## Phase 2: Types, Constants & Board Data

### Task 4: Game and room types

**Files:**
- Create: `src/types/game.ts`
- Create: `src/types/room.ts`

- [ ] **Step 1: Create `src/types/game.ts`**

Copy all types from spec section 3.1 exactly:
`GameStatus`, `PlayerConnection`, `WinMode`, `RoomVisibility`, `Player`, `Property`, `TileType`, `BoardTile`, `Card`, `CardAction`, `DiceResult`, `RoomSettings`, `TurnPhase`, `GameState`, `GameEvent`.

Also add:
```typescript
export type GameError = {
  code: string;
  message: string;
};

export type EngineResult =
  | { ok: true; state: GameState }
  | { ok: false; error: GameError };

export type EngineAction =
  | { type: 'roll_dice' }
  | { type: 'buy_property' }
  | { type: 'skip_buy' }
  | { type: 'pay_jail_fine' }
  | { type: 'use_jail_card' }
  | { type: 'roll_for_doubles' }
  | { type: 'start_game' }
  | { type: 'end_game' };
```

- [ ] **Step 2: Create `src/types/room.ts`**

Copy types from spec section 3.2: `RoomSummary`, `ClientMessage`, `ServerMessage`, `PlayerRanking`.

Add:
```typescript
export type GuestInfo = {
  guestId: string;
  displayName: string;
  color: string;
};

export type CreateRoomRequest = {
  visibility: 'private' | 'public';
  maxPlayers: number;
  roundLimit?: number;
};

export type CreateRoomResponse = {
  roomId: string;
  roomCode: string;
  wsUrl: string;
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/
git commit -m "feat: add game and room TypeScript types"
```

---

### Task 5: Game constants and utilities

**Files:**
- Create: `src/game/rules/constants.ts`
- Create: `src/utils/formatMoney.ts`
- Create: `src/utils/generateRoomCode.ts`
- Create: `src/utils/createEvent.ts`

- [ ] **Step 1: Create `src/game/rules/constants.ts`**

```typescript
export const STARTING_MONEY = 1500;
export const GO_BONUS = 200;
export const JAIL_FINE = 50;
export const MAX_JAIL_TURNS = 3;
export const BOARD_SIZE = 40;
export const JAIL_POSITION = 10;
export const GO_POSITION = 0;
export const DISCONNECT_TIMEOUT_MS = 180_000;
export const MAX_EVENT_LOG = 50;
export const PLAYER_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#EAB308'] as const;
export const MAX_DOUBLES_BEFORE_JAIL = 3;
```

- [ ] **Step 2: Create `src/utils/formatMoney.ts`**

```typescript
export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}
```

- [ ] **Step 3: Create `src/utils/generateRoomCode.ts`**

```typescript
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length = 6): string {
  return Array.from({ length }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}
```

- [ ] **Step 4: Create `src/utils/createEvent.ts`**

```typescript
import type { GameEvent } from '@/types/game';

let counter = 0;

export function createEvent(
  message: string,
  type: GameEvent['type'] = 'info'
): GameEvent {
  return {
    id: `evt-${Date.now()}-${counter++}`,
    timestamp: Date.now(),
    message,
    type,
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/game/rules/constants.ts src/utils/
git commit -m "feat: add game constants and utility helpers"
```

---

### Task 6: Board and property data

**Files:**
- Create: `src/data/board.ts`
- Create: `src/data/properties.ts`

- [ ] **Step 1: Create `src/data/properties.ts` with all 22 properties**

```typescript
import type { Property } from '@/types/game';

export const PROPERTIES: Property[] = [
  { id: 'mediterranean', name: 'Địa Trung Hải', position: 1, price: 60, rent: 2, colorGroup: 'brown' },
  { id: 'baltic', name: 'Ban-tic', position: 3, price: 60, rent: 4, colorGroup: 'brown' },
  { id: 'oriental', name: 'Phương Đông', position: 6, price: 100, rent: 6, colorGroup: 'light_blue' },
  { id: 'vermont', name: 'Vermont', position: 8, price: 100, rent: 6, colorGroup: 'light_blue' },
  { id: 'connecticut', name: 'Connecticut', position: 9, price: 120, rent: 8, colorGroup: 'light_blue' },
  { id: 'st_charles', name: 'St. Charles', position: 11, price: 140, rent: 10, colorGroup: 'pink' },
  { id: 'states', name: 'Bang', position: 13, price: 140, rent: 10, colorGroup: 'pink' },
  { id: 'virginia', name: 'Virginia', position: 14, price: 160, rent: 12, colorGroup: 'pink' },
  { id: 'st_james', name: 'St. James', position: 16, price: 180, rent: 14, colorGroup: 'orange' },
  { id: 'tennessee', name: 'Tennessee', position: 18, price: 180, rent: 14, colorGroup: 'orange' },
  { id: 'new_york', name: 'New York', position: 19, price: 200, rent: 16, colorGroup: 'orange' },
  { id: 'kentucky', name: 'Kentucky', position: 21, price: 220, rent: 18, colorGroup: 'red' },
  { id: 'indiana', name: 'Indiana', position: 23, price: 220, rent: 18, colorGroup: 'red' },
  { id: 'illinois', name: 'Illinois', position: 24, price: 240, rent: 20, colorGroup: 'red' },
  { id: 'atlantic', name: 'Đại Tây Dương', position: 26, price: 260, rent: 22, colorGroup: 'yellow' },
  { id: 'ventnor', name: 'Ventnor', position: 27, price: 260, rent: 22, colorGroup: 'yellow' },
  { id: 'marvin', name: 'Marvin Gardens', position: 28, price: 280, rent: 24, colorGroup: 'yellow' },
  { id: 'pacific', name: 'Thái Bình Dương', position: 31, price: 300, rent: 26, colorGroup: 'green' },
  { id: 'nc_avenue', name: 'Bắc Carolina', position: 32, price: 300, rent: 26, colorGroup: 'green' },
  { id: 'pennsylvania', name: 'Pennsylvania', position: 34, price: 320, rent: 28, colorGroup: 'green' },
  { id: 'park_place', name: 'Park Place', position: 37, price: 350, rent: 35, colorGroup: 'dark_blue' },
  { id: 'boardwalk', name: 'Boardwalk', position: 39, price: 400, rent: 50, colorGroup: 'dark_blue' },
];

export const PROPERTY_BY_ID = Object.fromEntries(PROPERTIES.map((p) => [p.id, p]));
export const PROPERTY_BY_POSITION = Object.fromEntries(PROPERTIES.map((p) => [p.position, p]));
```

- [ ] **Step 2: Create `src/data/board.ts` with 40 tiles**

```typescript
import type { BoardTile } from '@/types/game';
import { PROPERTIES } from './properties';

const propertyTile = (position: number, propertyId: string): BoardTile => {
  const prop = PROPERTIES.find((p) => p.id === propertyId)!;
  return { position, type: 'property', name: prop.name, propertyId };
};

export const BOARD_TILES: BoardTile[] = [
  { position: 0, type: 'go', name: 'XUẤT PHÁT' },
  propertyTile(1, 'mediterranean'),
  { position: 2, type: 'community_chest', name: 'Quỹ Cộng Đồng' },
  propertyTile(3, 'baltic'),
  { position: 4, type: 'tax', name: 'Thuế Thu Nhập', taxAmount: 200 },
  propertyTile(6, 'oriental'),
  { position: 7, type: 'chance', name: 'Cơ Hội' },
  propertyTile(8, 'vermont'),
  propertyTile(9, 'connecticut'),
  { position: 10, type: 'jail', name: 'Thăm Tù' },
  propertyTile(11, 'st_charles'),
  { position: 12, type: 'chance', name: 'Cơ Hội' },
  propertyTile(13, 'states'),
  propertyTile(14, 'virginia'),
  propertyTile(16, 'st_james'),
  { position: 17, type: 'community_chest', name: 'Quỹ Cộng Đồng' },
  propertyTile(18, 'tennessee'),
  propertyTile(19, 'new_york'),
  { position: 20, type: 'free_parking', name: 'Bãi Đỗ Miễn Phí' },
  propertyTile(21, 'kentucky'),
  { position: 22, type: 'chance', name: 'Cơ Hội' },
  propertyTile(23, 'indiana'),
  propertyTile(24, 'illinois'),
  { position: 25, type: 'tax', name: 'Thuế Xa Xỉ', taxAmount: 100 },
  propertyTile(26, 'atlantic'),
  propertyTile(27, 'ventnor'),
  propertyTile(28, 'marvin'),
  propertyTile(31, 'pacific'),
  propertyTile(32, 'nc_avenue'),
  { position: 33, type: 'community_chest', name: 'Quỹ Cộng Đồng' },
  propertyTile(34, 'pennsylvania'),
  { position: 30, type: 'go_to_jail', name: 'Vào Tù' },
  propertyTile(37, 'park_place'),
  { position: 35, type: 'chance', name: 'Cơ Hội' },
  { position: 36, type: 'community_chest', name: 'Quỹ Cộng Đồng' },
  propertyTile(39, 'boardwalk'),
];
// After creating array, export sorted version and verify all positions 0–39 exist.
// Add railroad tiles at 5, 15, 25, 35 and utilities at 12, 28 as properties with colorGroup 'railroad'/'utility'.

export const TILE_BY_POSITION = Object.fromEntries(BOARD_TILES.map((t) => [t.position, t]));
```

Note: Sort `BOARD_TILES` by position before export if needed:
```typescript
export const BOARD_TILES_SORTED = [...BOARD_TILES].sort((a, b) => a.position - b.position);
```

- [ ] **Step 3: Commit**

```bash
git add src/data/
git commit -m "feat: add Monopoly board tiles and property data"
```

---

### Task 7: Card deck data

**Files:**
- Create: `src/data/cards.ts`

- [ ] **Step 1: Create `src/data/cards.ts` with 12 Chance + 12 Community Chest cards (Vietnamese)**

```typescript
import type { Card } from '@/types/game';

export const CHANCE_CARDS: Card[] = [
  { id: 'ch1', deck: 'chance', text: 'Tiến tới XUẤT PHÁT. Nhận $200.', action: { type: 'move', targetPosition: 0, collectGo: true } },
  { id: 'ch2', deck: 'chance', text: 'Tiến tới Illinois.', action: { type: 'move', targetPosition: 24 } },
  { id: 'ch3', deck: 'chance', text: 'Tiến tới St. Charles.', action: { type: 'move', targetPosition: 11 } },
  { id: 'ch4', deck: 'chance', text: 'Lùi lại 3 ô.', action: { type: 'move_relative', steps: -3 } },
  { id: 'ch5', deck: 'chance', text: 'Vào tù. Đi thẳng tù. Không qua XUẤT PHÁT.', action: { type: 'go_to_jail' } },
  { id: 'ch6', deck: 'chance', text: 'Thẻ ra tù miễn phí. Giữ lại.', action: { type: 'get_out_of_jail_free' } },
  { id: 'ch7', deck: 'chance', text: 'Nhận $50.', action: { type: 'collect', amount: 50 } },
  { id: 'ch8', deck: 'chance', text: 'Nhận $100.', action: { type: 'collect', amount: 100 } },
  { id: 'ch9', deck: 'chance', text: 'Nhận $150.', action: { type: 'collect', amount: 150 } },
  { id: 'ch10', deck: 'chance', text: 'Trả $15.', action: { type: 'pay', amount: 15 } },
  { id: 'ch11', deck: 'chance', text: 'Trả $50.', action: { type: 'pay', amount: 50 } },
  { id: 'ch12', deck: 'chance', text: 'Sửa nhà: trả $25 mỗi nhà.', action: { type: 'repairs', perHouse: 25, perHotel: 100 } },
];

export const COMMUNITY_CARDS: Card[] = [
  { id: 'cc1', deck: 'community_chest', text: 'Ngân hàng nhầm. Nhận $200.', action: { type: 'collect', amount: 200 } },
  { id: 'cc2', deck: 'community_chest', text: 'Hoàn thuế. Nhận $100.', action: { type: 'collect', amount: 100 } },
  { id: 'cc3', deck: 'community_chest', text: 'Phí bác sĩ. Trả $50.', action: { type: 'pay', amount: 50 } },
  { id: 'cc4', deck: 'community_chest', text: 'Phí bảo hiểm. Trả $100.', action: { type: 'pay', amount: 100 } },
  { id: 'cc5', deck: 'community_chest', text: 'Thẻ ra tù miễn phí. Giữ lại.', action: { type: 'get_out_of_jail_free' } },
  { id: 'cc6', deck: 'community_chest', text: 'Vào tù. Đi thẳng tù.', action: { type: 'go_to_jail' } },
  { id: 'cc7', deck: 'community_chest', text: 'Nhận $10.', action: { type: 'collect', amount: 10 } },
  { id: 'cc8', deck: 'community_chest', text: 'Nhận $25.', action: { type: 'collect', amount: 25 } },
  { id: 'cc9', deck: 'community_chest', text: 'Nhận $50.', action: { type: 'collect', amount: 50 } },
  { id: 'cc10', deck: 'community_chest', text: 'Trả $50.', action: { type: 'pay', amount: 50 } },
  { id: 'cc11', deck: 'community_chest', text: 'Trả $100.', action: { type: 'pay', amount: 100 } },
  { id: 'cc12', deck: 'community_chest', text: 'Nhận $20.', action: { type: 'collect', amount: 20 } },
];

export const CARD_BY_ID = Object.fromEntries(
  [...CHANCE_CARDS, ...COMMUNITY_CARDS].map((c) => [c.id, c])
);
```

- [ ] **Step 2: Commit**

```bash
git add src/data/cards.ts
git commit -m "feat: add Vietnamese Chance and Community Chest card decks"
```

---

## Phase 3: Game Engine (TDD)

### Task 8: Dice module

**Files:**
- Create: `src/game/engine/dice.ts`
- Create: `tests/engine/dice.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/engine/dice.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { rollDice } from '@/game/engine/dice';

describe('rollDice', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns two dice between 1 and 6', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = rollDice();
    expect(result.die1).toBeGreaterThanOrEqual(1);
    expect(result.die1).toBeLessThanOrEqual(6);
    expect(result.die2).toBeGreaterThanOrEqual(1);
    expect(result.die2).toBeLessThanOrEqual(6);
    expect(result.total).toBe(result.die1 + result.die2);
  });

  it('detects doubles', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const result = rollDice();
    expect(result.isDouble).toBe(result.die1 === result.die2);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm run test -- tests/engine/dice.test.ts
```

- [ ] **Step 3: Implement `src/game/engine/dice.ts`**

```typescript
import type { DiceResult } from '@/types/game';

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollDice(): DiceResult {
  const die1 = rollDie();
  const die2 = rollDie();
  return { die1, die2, total: die1 + die2, isDouble: die1 === die2 };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm run test -- tests/engine/dice.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/dice.ts tests/engine/dice.test.ts
git commit -m "feat: add dice roll engine with tests"
```

---

### Task 9: Economy module

**Files:**
- Create: `src/game/engine/economy.ts`
- Create: `tests/engine/economy.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { canAfford, pay, collect } from '@/game/engine/economy';
import type { Player } from '@/types/game';

const basePlayer = (): Player => ({
  id: 'p1', displayName: 'Test', color: '#EF4444', money: 1500,
  position: 0, properties: [], isBankrupt: false, isJailed: false,
  jailTurns: 0, getOutOfJailFreeCards: 0, connection: 'online',
});

describe('economy', () => {
  it('canAfford returns true when enough money', () => {
    expect(canAfford(basePlayer(), 200)).toBe(true);
  });
  it('pay deducts money', () => {
    const result = pay(basePlayer(), 200);
    expect(result.money).toBe(1300);
  });
  it('collect adds money', () => {
    const result = collect(basePlayer(), 200);
    expect(result.money).toBe(1700);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `src/game/engine/economy.ts`**

```typescript
import type { Player } from '@/types/game';

export function canAfford(player: Player, amount: number): boolean {
  return player.money >= amount;
}

export function pay(player: Player, amount: number): Player {
  return { ...player, money: player.money - amount };
}

export function collect(player: Player, amount: number): Player {
  return { ...player, money: player.money + amount };
}

export function transfer(from: Player, to: Player, amount: number): { from: Player; to: Player } {
  return { from: pay(from, amount), to: collect(to, amount) };
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/economy.ts tests/engine/economy.test.ts
git commit -m "feat: add economy helpers with tests"
```

---

### Task 10: Movement module

**Files:**
- Create: `src/game/engine/movement.ts`
- Create: `tests/engine/movement.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { movePlayer, passedGo } from '@/game/engine/movement';
import { GO_BONUS, BOARD_SIZE } from '@/game/rules/constants';

describe('movement', () => {
  it('moves player forward', () => {
    const pos = movePlayer(5, 7);
    expect(pos).toBe(12);
  });
  it('wraps around board', () => {
    const pos = movePlayer(38, 4);
    expect(pos).toBe(2);
  });
  it('detects passing GO', () => {
    expect(passedGo(38, 4)).toBe(true);
    expect(passedGo(10, 5)).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `src/game/engine/movement.ts`**

```typescript
import { BOARD_SIZE, GO_POSITION } from '@/game/rules/constants';

export function movePlayer(current: number, steps: number): number {
  return (current + steps + BOARD_SIZE) % BOARD_SIZE;
}

export function passedGo(from: number, steps: number): boolean {
  if (steps <= 0) return false;
  return from + steps >= BOARD_SIZE;
}

export function moveTo(playerPosition: number, target: number): number {
  return ((target % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/movement.ts tests/engine/movement.test.ts
git commit -m "feat: add board movement logic with tests"
```

---

### Task 11: Property module

**Files:**
- Create: `src/game/engine/property.ts`
- Create: `tests/engine/property.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { buyProperty, payRent, liquidateToBank } from '@/game/engine/property';
import { PROPERTIES } from '@/data/properties';
import type { Player } from '@/types/game';

const player = (): Player => ({
  id: 'p1', displayName: 'A', color: '#EF4444', money: 1500,
  position: 1, properties: [], isBankrupt: false, isJailed: false,
  jailTurns: 0, getOutOfJailFreeCards: 0, connection: 'online',
});

describe('property', () => {
  it('buyProperty deducts price and adds property', () => {
    const prop = { ...PROPERTIES[0], ownerId: undefined };
    const result = buyProperty(player(), prop);
    expect(result.player.money).toBe(1500 - prop.price);
    expect(result.player.properties).toContain(prop.id);
    expect(result.property.ownerId).toBe('p1');
  });

  it('payRent transfers money', () => {
    const prop = { ...PROPERTIES[0], ownerId: 'p2' };
    const result = payRent(player(), prop, { ...player(), id: 'p2' });
    expect(result.payer.money).toBe(1500 - prop.rent);
    expect(result.owner.money).toBe(1500 + prop.rent);
  });

  it('liquidateToBank clears owner', () => {
    const owned = { ...PROPERTIES[0], ownerId: 'p1' };
    const result = liquidateToBank(owned);
    expect(result.ownerId).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `src/game/engine/property.ts`**

```typescript
import type { Player, Property } from '@/types/game';
import { pay, collect, canAfford } from './economy';

export function buyProperty(player: Player, property: Property) {
  if (property.ownerId) throw new Error('ALREADY_OWNED');
  if (!canAfford(player, property.price)) throw new Error('INSUFFICIENT_FUNDS');
  return {
    player: { ...player, money: player.money - property.price, properties: [...player.properties, property.id] },
    property: { ...property, ownerId: player.id },
  };
}

export function payRent(payer: Player, property: Property, owner: Player) {
  return { payer: pay(payer, property.rent), owner: collect(owner, property.rent) };
}

export function liquidateToBank(property: Property): Property {
  return { ...property, ownerId: undefined };
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/property.ts tests/engine/property.test.ts
git commit -m "feat: add property buy and rent logic with tests"
```

---

### Task 12: Jail module

**Files:**
- Create: `src/game/engine/jail.ts`
- Create: `tests/engine/jail.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { sendToJail, payJailFine, releaseFromJail, incrementJailTurn } from '@/game/engine/jail';
import { JAIL_FINE, JAIL_POSITION } from '@/game/rules/constants';
import type { Player } from '@/types/game';

const p = (): Player => ({
  id: 'p1', displayName: 'A', color: '#EF4444', money: 1500,
  position: 20, properties: [], isBankrupt: false, isJailed: false,
  jailTurns: 0, getOutOfJailFreeCards: 0, connection: 'online',
});

describe('jail', () => {
  it('sendToJail moves to jail position', () => {
    const result = sendToJail(p());
    expect(result.position).toBe(JAIL_POSITION);
    expect(result.isJailed).toBe(true);
    expect(result.jailTurns).toBe(0);
  });
  it('payJailFine costs $50 and releases', () => {
    const jailed = sendToJail(p());
    const result = payJailFine(jailed);
    expect(result.money).toBe(1500 - JAIL_FINE);
    expect(result.isJailed).toBe(false);
  });
  it('releaseFromJail on doubles', () => {
    const jailed = sendToJail(p());
    const result = releaseFromJail(jailed);
    expect(result.isJailed).toBe(false);
    expect(result.jailTurns).toBe(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `src/game/engine/jail.ts`**

```typescript
import type { Player } from '@/types/game';
import { JAIL_FINE, JAIL_POSITION } from '@/game/rules/constants';
import { pay } from './economy';

export function sendToJail(player: Player): Player {
  return { ...player, position: JAIL_POSITION, isJailed: true, jailTurns: 0 };
}

export function payJailFine(player: Player): Player {
  const paid = pay(player, JAIL_FINE);
  return releaseFromJail(paid);
}

export function releaseFromJail(player: Player): Player {
  return { ...player, isJailed: false, jailTurns: 0 };
}

export function incrementJailTurn(player: Player): Player {
  return { ...player, jailTurns: player.jailTurns + 1 };
}

export function useJailCard(player: Player): Player {
  if (player.getOutOfJailFreeCards <= 0) throw new Error('NO_JAIL_CARD');
  return releaseFromJail({ ...player, getOutOfJailFreeCards: player.getOutOfJailFreeCards - 1 });
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/jail.ts tests/engine/jail.test.ts
git commit -m "feat: add jail rules with tests"
```

---

### Task 13: Cards engine module

**Files:**
- Create: `src/game/engine/cards.ts`
- Create: `tests/engine/cards.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { shuffleDeck, drawCard, applyCardAction } from '@/game/engine/cards';
import { CHANCE_CARDS } from '@/data/cards';
import type { Player } from '@/types/game';

const player = (): Player => ({
  id: 'p1', displayName: 'A', color: '#EF4444', money: 1500,
  position: 10, properties: [], isBankrupt: false, isJailed: false,
  jailTurns: 0, getOutOfJailFreeCards: 0, connection: 'online',
});

describe('cards', () => {
  it('shuffleDeck returns all card ids', () => {
    const ids = CHANCE_CARDS.map((c) => c.id);
    const shuffled = shuffleDeck(ids);
    expect(shuffled.sort()).toEqual(ids.sort());
  });
  it('drawCard removes top card and moves to bottom', () => {
    const deck = ['a', 'b', 'c'];
    const { cardId, deck: newDeck } = drawCard(deck);
    expect(cardId).toBe('a');
    expect(newDeck).toEqual(['b', 'c', 'a']);
  });
  it('applyCardAction collect adds money', () => {
    const result = applyCardAction(player(), { type: 'collect', amount: 50 });
    expect(result.player.money).toBe(1550);
  });
  it('applyCardAction go_to_jail jails player', () => {
    const result = applyCardAction(player(), { type: 'go_to_jail' });
    expect(result.player.isJailed).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `src/game/engine/cards.ts`**

```typescript
import type { CardAction, Player } from '@/types/game';
import { collect, pay } from './economy';
import { sendToJail } from './jail';
import { movePlayer, passedGo } from './movement';
import { GO_BONUS, GO_POSITION } from '@/game/rules/constants';

export function shuffleDeck(deck: string[]): string[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function drawCard(deck: string[]): { cardId: string; deck: string[] } {
  const [cardId, ...rest] = deck;
  return { cardId, deck: [...rest, cardId] };
}

export function applyCardAction(player: Player, action: CardAction): { player: Player } {
  switch (action.type) {
    case 'collect':
      return { player: collect(player, action.amount) };
    case 'pay':
      return { player: pay(player, action.amount) };
    case 'go_to_jail':
      return { player: sendToJail(player) };
    case 'get_out_of_jail_free':
      return { player: { ...player, getOutOfJailFreeCards: player.getOutOfJailFreeCards + 1 } };
    case 'move': {
      let updated = { ...player, position: action.targetPosition };
      if (action.collectGo && action.targetPosition !== GO_POSITION) {
        updated = collect(updated, GO_BONUS);
      }
      return { player: updated };
    }
    case 'move_relative': {
      const newPos = movePlayer(player.position, action.steps);
      let updated = { ...player, position: newPos };
      if (action.steps > 0 && passedGo(player.position, action.steps)) {
        updated = collect(updated, GO_BONUS);
      }
      return { player: updated };
    }
    case 'repairs':
      return { player }; // MVP: no houses, no-op
    default:
      return { player };
  }
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/cards.ts tests/engine/cards.test.ts
git commit -m "feat: add card deck and card action engine with tests"
```

---

### Task 14: Bankruptcy, turn, and win modules

**Files:**
- Create: `src/game/engine/bankruptcy.ts`
- Create: `src/game/engine/turn.ts`
- Create: `src/game/engine/win.ts`
- Create: `tests/engine/bankruptcy.test.ts`
- Create: `tests/engine/win.test.ts`

- [ ] **Step 1: Write failing tests for bankruptcy and win**

```typescript
// tests/engine/bankruptcy.test.ts
import { describe, it, expect } from 'vitest';
import { declareBankrupt } from '@/game/engine/bankruptcy';

const player = () => ({
  id: 'p1', displayName: 'A', color: '#EF4444', money: -50,
  position: 0, properties: ['mediterranean'], isBankrupt: false,
  isJailed: false, jailTurns: 0, getOutOfJailFreeCards: 0, connection: 'online' as const,
});

describe('bankruptcy', () => {
  it('marks player bankrupt and clears properties', () => {
    const result = declareBankrupt(player());
    expect(result.isBankrupt).toBe(true);
    expect(result.properties).toEqual([]);
  });
});
```

```typescript
// tests/engine/win.test.ts
import { describe, it, expect } from 'vitest';
import { checkLastStanding, calculateRankings } from '@/game/engine/win';
import type { GameState, Player } from '@/types/game';

const mkPlayer = (id: string, money: number, bankrupt = false): Player => ({
  id, displayName: id, color: '#EF4444', money, position: 0, properties: [],
  isBankrupt: bankrupt, isJailed: false, jailTurns: 0, getOutOfJailFreeCards: 0, connection: 'online',
});

describe('win', () => {
  it('detects last player standing', () => {
    const players = [mkPlayer('p1', 100), mkPlayer('p2', 0, true), mkPlayer('p3', 0, true)];
    expect(checkLastStanding(players)).toBe('p1');
  });
  it('calculateRankings sorts by total assets', () => {
    const players = [mkPlayer('p1', 100), mkPlayer('p2', 500)];
    const rankings = calculateRankings(players, {});
    expect(rankings[0].playerId).toBe('p2');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement modules**

`src/game/engine/bankruptcy.ts`:
```typescript
import type { Player } from '@/types/game';

export function declareBankrupt(player: Player): Player {
  return { ...player, isBankrupt: true, money: 0, properties: [] };
}

export function isBankrupt(player: Player): boolean {
  return player.money < 0 || player.isBankrupt;
}
```

`src/game/engine/turn.ts`:
```typescript
import type { GameState } from '@/types/game';

export function nextPlayerIndex(state: GameState): number {
  const total = state.players.length;
  let idx = state.currentPlayerIndex;
  for (let i = 0; i < total; i++) {
    idx = (idx + 1) % total;
    if (!state.players[idx].isBankrupt) return idx;
  }
  return state.currentPlayerIndex;
}

export function getCurrentPlayer(state: GameState) {
  return state.players[state.currentPlayerIndex];
}
```

`src/game/engine/win.ts`:
```typescript
import type { GameState, Player } from '@/types/game';
import { PROPERTY_BY_ID } from '@/data/properties';
import type { PlayerRanking } from '@/types/room';

export function totalAssets(player: Player): number {
  const propertyValue = player.properties.reduce(
    (sum, id) => sum + (PROPERTY_BY_ID[id]?.price ?? 0), 0
  );
  return player.money + propertyValue;
}

export function checkLastStanding(players: Player[]): string | null {
  const active = players.filter((p) => !p.isBankrupt);
  return active.length === 1 ? active[0].id : null;
}

export function calculateRankings(
  players: Player[],
  propertyOwners: Record<string, string | undefined>
): PlayerRanking[] {
  return players
    .map((p) => ({ playerId: p.id, displayName: p.displayName, totalAssets: totalAssets(p), rank: 0 }))
    .sort((a, b) => b.totalAssets - a.totalAssets)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/bankruptcy.ts src/game/engine/turn.ts src/game/engine/win.ts tests/engine/
git commit -m "feat: add bankruptcy, turn, and win condition modules"
```

---

### Task 15: Bot module

**Files:**
- Create: `src/game/engine/bot.ts`
- Create: `tests/engine/bot.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { getBotAction } from '@/game/engine/bot';
import type { GameState, Player } from '@/types/game';

const mkState = (phase: GameState['phase'], money = 1500): GameState => ({
  roomId: 'r1', hostId: 'p1', currentPlayerIndex: 0, dice: null,
  gameStatus: 'playing', currentRound: 1, eventLog: [],
  chanceDeck: [], communityDeck: [], phase,
  settings: { visibility: 'private', maxPlayers: 4, disconnectTimeoutMs: 180000, startingMoney: 1500, goBonus: 200 },
  players: [{
    id: 'p1', displayName: 'Bot', color: '#EF4444', money, position: 1,
    properties: [], isBankrupt: false, isJailed: false, jailTurns: 0,
    getOutOfJailFreeCards: 0, connection: 'bot',
  }],
});

describe('bot', () => {
  it('rolls when waiting_for_roll', () => {
    expect(getBotAction(mkState('waiting_for_roll')).type).toBe('roll_dice');
  });
  it('buys when affordable buffer', () => {
    expect(getBotAction(mkState('buy_decision', 500)).type).toBe('buy_property');
  });
  it('skips buy when poor', () => {
    expect(getBotAction(mkState('buy_decision', 50)).type).toBe('skip_buy');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `src/game/engine/bot.ts`**

```typescript
import type { GameState, EngineAction } from '@/types/game';
import { JAIL_FINE } from '@/game/rules/constants';
import { getCurrentPlayer } from './turn';

export function getBotAction(state: GameState): EngineAction {
  const player = getCurrentPlayer(state);
  switch (state.phase) {
    case 'waiting_for_roll':
      return { type: 'roll_dice' };
    case 'buy_decision':
      return player.money > 200 ? { type: 'buy_property' } : { type: 'skip_buy' };
    case 'jail_decision':
      return player.money >= JAIL_FINE ? { type: 'pay_jail_fine' } : { type: 'roll_for_doubles' };
    default:
      return { type: 'skip_buy' };
  }
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/game/engine/bot.ts tests/engine/bot.test.ts
git commit -m "feat: add bot decision logic with tests"
```

---

### Task 16: Validators and applyAction orchestrator

**Files:**
- Create: `src/game/engine/validators.ts`
- Create: `src/game/engine/applyAction.ts`
- Create: `src/game/engine/createInitialState.ts`
- Create: `tests/engine/applyAction.test.ts`
- Create: `tests/engine/validators.test.ts`

- [ ] **Step 1: Create `src/game/engine/createInitialState.ts`**

```typescript
import type { GameState, Player, RoomSettings } from '@/types/game';
import { CHANCE_CARDS, COMMUNITY_CARDS } from '@/data/cards';
import { shuffleDeck } from './cards';
import { STARTING_MONEY } from '@/game/rules/constants';

export function createWaitingState(
  roomId: string,
  hostId: string,
  settings: RoomSettings
): GameState {
  return {
    roomId, hostId, settings, players: [], currentPlayerIndex: 0,
    dice: null, gameStatus: 'waiting', currentRound: 0, eventLog: [],
    chanceDeck: shuffleDeck(CHANCE_CARDS.map((c) => c.id)),
    communityDeck: shuffleDeck(COMMUNITY_CARDS.map((c) => c.id)),
    phase: 'waiting_for_roll',
  };
}

export function createPlayer(guestId: string, displayName: string, color: string): Player {
  return {
    id: guestId, displayName, color, money: STARTING_MONEY, position: 0,
    properties: [], isBankrupt: false, isJailed: false, jailTurns: 0,
    getOutOfJailFreeCards: 0, connection: 'online',
  };
}
```

- [ ] **Step 2: Create `src/game/engine/validators.ts`**

```typescript
import type { GameState, EngineAction, GameError } from '@/types/game';
import { getCurrentPlayer } from './turn';

export function validateAction(
  state: GameState,
  action: EngineAction,
  playerId: string
): GameError | null {
  if (state.gameStatus === 'finished') return { code: 'GAME_FINISHED', message: 'Ván đã kết thúc' };
  if (action.type === 'start_game') {
    if (state.hostId !== playerId) return { code: 'NOT_HOST', message: 'Chỉ host mới bắt đầu được' };
    if (state.players.length < 2) return { code: 'NOT_ENOUGH_PLAYERS', message: 'Cần ít nhất 2 người chơi' };
    return null;
  }
  if (action.type === 'end_game') {
    if (state.hostId !== playerId) return { code: 'NOT_HOST', message: 'Chỉ host mới kết thúc được' };
    return null;
  }
  const current = getCurrentPlayer(state);
  if (current.id !== playerId) return { code: 'NOT_YOUR_TURN', message: 'Không phải lượt của bạn' };
  if (current.connection === 'bot') return { code: 'BOT_TURN', message: 'Đang do bot điều khiển' };
  const phaseMap: Record<string, EngineAction['type'][]> = {
    waiting_for_roll: ['roll_dice'],
    buy_decision: ['buy_property', 'skip_buy'],
    jail_decision: ['pay_jail_fine', 'use_jail_card', 'roll_for_doubles'],
  };
  const allowed = phaseMap[state.phase] ?? [];
  if (!allowed.includes(action.type)) return { code: 'INVALID_PHASE', message: 'Hành động không hợp lệ' };
  return null;
}
```

- [ ] **Step 3: Create `src/game/engine/applyAction.ts`** — orchestrates roll → tile effect → phase transitions. Implement `handleTileLanding`, `handleRollDice`, and main `applyAction(state, action, playerId): EngineResult`.

Key logic for `handleRollDice`:
- Roll dice, move player (skip movement if jailed unless doubles on roll_for_doubles path)
- If passed GO → collect GO_BONUS
- Handle tile: property (buy_decision or rent), tax, chance/chest (draw card), go_to_jail
- Track consecutive doubles on state (add `consecutiveDoubles: number` to GameState type)
- 3 doubles → sendToJail

- [ ] **Step 4: Write integration test `tests/engine/applyAction.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createWaitingState, createPlayer } from '@/game/engine/createInitialState';
import { applyAction } from '@/game/engine/applyAction';

describe('applyAction', () => {
  it('start_game transitions to playing', () => {
    let state = createWaitingState('r1', 'p1', {
      visibility: 'private', maxPlayers: 4, disconnectTimeoutMs: 180000, startingMoney: 1500, goBonus: 200,
    });
    state = { ...state, players: [createPlayer('p1', 'A', '#EF4444'), createPlayer('p2', 'B', '#3B82F6')] };
    const result = applyAction(state, { type: 'start_game' }, 'p1');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.gameStatus).toBe('playing');
  });
});
```

- [ ] **Step 5: Run all engine tests**

```bash
npm run test
```
Expected: All pass, coverage ≥ 80% for `src/game/engine/`.

- [ ] **Step 6: Commit**

```bash
git add src/game/engine/ tests/engine/ src/types/game.ts
git commit -m "feat: add applyAction orchestrator with validators and integration test"
```

---

## Phase 4: PartyKit Server

### Task 17: GameServer implementation

**Files:**
- Modify: `partykit/src/game.ts`
- Create: `partykit/src/utils/broadcast.ts`
- Create: `partykit/src/utils/connection.ts`

- [ ] **Step 1: Implement broadcast helper**

```typescript
// partykit/src/utils/broadcast.ts
import type * as Party from 'partykit/server';
import type { GameState } from '../../src/types/game';

export function broadcastState(room: Party.Room, state: GameState) {
  room.broadcast(JSON.stringify({ type: 'state_sync', state }));
}

export function sendError(conn: Party.Connection, code: string, message: string) {
  conn.send(JSON.stringify({ type: 'error', code, message }));
}
```

- [ ] **Step 2: Implement full `partykit/src/game.ts`**

Must handle:
- `onStart`: load state from `room.storage`
- `onConnect`: parse query params `guestId`, `displayName`, `color`; join or reconnect
- `onMessage`: parse `ClientMessage`, call `applyAction`, save state, broadcast
- `onClose`: mark disconnected, start 3-min alarm via `room.storage.setAlarm`
- `onAlarm`: convert disconnected → bot; run bot turn if needed
- `start_game`: register/unregister with lobby via `fetch` to lobby party

Import engine from `../../src/game/engine/applyAction` etc.

- [ ] **Step 3: Manual test**

```bash
# Terminal 1
npm run partykit:dev
# Terminal 2
npm run dev
# Open two browser tabs at /game/test-room
```

- [ ] **Step 4: Commit**

```bash
git add partykit/
git commit -m "feat: implement PartyKit GameServer with reconnect and bot alarm"
```

---

### Task 18: LobbyServer implementation

**Files:**
- Modify: `partykit/src/lobby.ts`

- [ ] **Step 1: Implement lobby room registry**

```typescript
// partykit/src/lobby.ts — key structure
type LobbyState = { rooms: RoomSummary[] };

// onConnect: send current rooms
// onMessage: handle { type: 'register', room: RoomSummary } and { type: 'unregister', roomId }
// onAlarm (30s): ping registered rooms, remove stale
```

- [ ] **Step 2: Wire GameServer to register public rooms on host connect with visibility public**

- [ ] **Step 3: Manual test lobby sync with two terminals**

- [ ] **Step 4: Commit**

```bash
git add partykit/src/lobby.ts partykit/src/game.ts
git commit -m "feat: implement LobbyServer with room registry and heartbeat"
```

---

### Task 19: Room creation API

**Files:**
- Create: `src/app/api/rooms/route.ts`

- [ ] **Step 1: Implement POST handler**

```typescript
import { NextResponse } from 'next/server';
import { generateRoomCode } from '@/utils/generateRoomCode';
import type { CreateRoomRequest, CreateRoomResponse } from '@/types/room';

export async function POST(request: Request) {
  const body: CreateRoomRequest = await request.json();
  const roomId = crypto.randomUUID();
  const roomCode = generateRoomCode();
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
  const protocol = host.startsWith('localhost') ? 'ws' : 'wss';
  const wsUrl = `${protocol}://${host}/parties/game/${roomId}`;
  const response: CreateRoomResponse = { roomId, roomCode, wsUrl };
  return NextResponse.json(response);
}
```

- [ ] **Step 2: Test with curl**

```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"visibility":"private","maxPlayers":4}'
```
Expected: JSON with `roomId`, `roomCode`, `wsUrl`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/rooms/route.ts
git commit -m "feat: add room creation API endpoint"
```

---

## Phase 5: Client State & Hooks

### Task 20: Guest ID and PartySocket hooks

**Files:**
- Create: `src/hooks/useGuestId.ts`
- Create: `src/hooks/usePartySocket.ts`

- [ ] **Step 1: Implement `useGuestId.ts`**

```typescript
'use client';
import { useEffect, useState } from 'react';

export function useGuestId(): string {
  const [guestId, setGuestId] = useState('');
  useEffect(() => {
    let id = localStorage.getItem('monopoly_guest_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('monopoly_guest_id', id);
    }
    setGuestId(id);
  }, []);
  return guestId;
}
```

- [ ] **Step 2: Implement `usePartySocket.ts`**

Uses `PartySocket` from `partysocket`:
- Connect to `wsUrl` with query params
- On message: parse `ServerMessage`, call `setGameState` for `state_sync`
- Expose `sendAction`, `connectionStatus`
- Auto-reconnect on disconnect

- [ ] **Step 3: Commit**

```bash
git add src/hooks/
git commit -m "feat: add guest ID and PartySocket hooks"
```

---

### Task 21: Zustand game store

**Files:**
- Create: `src/store/gameStore.ts`

- [ ] **Step 1: Implement store**

```typescript
import { create } from 'zustand';
import type { GameState } from '@/types/game';
import type { ClientMessage } from '@/types/room';

type Toast = { id: string; message: string; type: 'error' | 'info' };

type GameStore = {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  guestId: string;
  roomId: string | null;
  gameState: GameState | null;
  selectedTile: number | null;
  isEventLogExpanded: boolean;
  toasts: Toast[];
  socket: WebSocket | null;
  setGuestId: (id: string) => void;
  setConnectionStatus: (s: GameStore['connectionStatus']) => void;
  setGameState: (state: GameState) => void;
  setSocket: (ws: WebSocket | null) => void;
  selectTile: (position: number | null) => void;
  toggleEventLog: () => void;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  sendAction: (action: ClientMessage) => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  connectionStatus: 'disconnected',
  guestId: '',
  roomId: null,
  gameState: null,
  selectedTile: null,
  isEventLogExpanded: false,
  toasts: [],
  socket: null,
  setGuestId: (id) => set({ guestId: id }),
  setConnectionStatus: (s) => set({ connectionStatus: s }),
  setGameState: (state) => set({ gameState: state }),
  setSocket: (ws) => set({ socket: ws }),
  selectTile: (position) => set({ selectedTile: position }),
  toggleEventLog: () => set((s) => ({ isEventLogExpanded: !s.isEventLogExpanded })),
  addToast: (message, type = 'info') =>
    set((s) => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  sendAction: (action) => {
    const ws = get().socket;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(action));
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/store/gameStore.ts
git commit -m "feat: add Zustand game store"
```

---

## Phase 6: UI — Home & Lobby

### Task 22: Home page with create/join forms

**Files:**
- Create: `src/components/Home/CreateRoomForm.tsx`
- Create: `src/components/Home/JoinRoomForm.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create `CreateRoomForm.tsx`**

Fields: displayName, color picker (4 colors), visibility radio, optional round limit checkbox.
On submit: `POST /api/rooms` → `router.push(/game/${roomId}?name=...&color=...)`.

- [ ] **Step 2: Create `JoinRoomForm.tsx`**

Field: 6-char room code. Lookup via API `GET /api/rooms?code=ABC123` (add this route) or navigate with code stored in session.

Add `src/app/api/rooms/lookup/route.ts`:
```typescript
// Maps roomCode → roomId via PartyKit storage fetch or in-memory map on API
```

- [ ] **Step 3: Update `src/app/page.tsx`** to render both forms + link to `/lobby`.

- [ ] **Step 4: Verify create room flow navigates to game page**

- [ ] **Step 5: Commit**

```bash
git add src/components/Home/ src/app/page.tsx src/app/api/
git commit -m "feat: add home page with create and join room forms"
```

---

### Task 23: Lobby page

**Files:**
- Create: `src/app/lobby/page.tsx`
- Create: `src/components/Lobby/RoomList.tsx`
- Create: `src/components/Lobby/RoomCard.tsx`

- [ ] **Step 1: Connect to LobbyServer via PartySocket** (`parties/lobby/lobby`)

- [ ] **Step 2: Render room cards** with host name, player count, Join button

- [ ] **Step 3: Join navigates to `/game/[roomId]`**

- [ ] **Step 4: Commit**

```bash
git add src/app/lobby/ src/components/Lobby/
git commit -m "feat: add public lobby page with realtime room list"
```

---

### Task 24: Rules page

**Files:**
- Create: `src/app/rules/page.tsx`

- [ ] **Step 1: Static Vietnamese rules** covering: starting money, GO bonus, buy/rent, jail, win conditions, disconnect bot.

- [ ] **Step 2: Commit**

```bash
git add src/app/rules/page.tsx
git commit -m "feat: add Vietnamese rules page"
```

---

## Phase 7: Game UI

### Task 25: UI primitives

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Modal.tsx`
- Create: `src/components/ui/Toast.tsx`
- Create: `src/components/ui/Badge.tsx`

- [ ] **Step 1: Implement minimal styled components** using Tailwind + primary/accent colors.

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add UI primitive components"
```

---

### Task 26: Board rendering

**Files:**
- Create: `src/components/Board/MonopolyBoard.tsx`
- Create: `src/components/Board/BoardTile.tsx`
- Create: `src/components/Board/BoardCenter.tsx`
- Create: `src/components/Board/PlayerToken.tsx`

- [ ] **Step 1: `MonopolyBoard`** — CSS Grid 11×11 with corners and sides; 40 tiles positioned around perimeter.

- [ ] **Step 2: `BoardTile`** — color by type; property shows colorGroup bar; click selects tile.

- [ ] **Step 3: `PlayerToken`** — colored circle positioned on tile; Framer Motion animate position changes.

- [ ] **Step 4: Test responsive** at 375px and 1280px viewports.

- [ ] **Step 5: Commit**

```bash
git add src/components/Board/
git commit -m "feat: add Monopoly board rendering with player tokens"
```

---

### Task 27: Player list and waiting room

**Files:**
- Create: `src/components/Player/PlayerList.tsx`
- Create: `src/components/Player/PlayerCard.tsx`
- Create: `src/components/Game/WaitingRoom.tsx`

- [ ] **Step 1: `WaitingRoom`** — shows players, copy link button, host Start button (calls `start_game`).

- [ ] **Step 2: `PlayerCard`** — name, money, color dot, connection badge (online/disconnected/bot).

- [ ] **Step 3: Commit**

```bash
git add src/components/Player/ src/components/Game/WaitingRoom.tsx
git commit -m "feat: add player list and waiting room UI"
```

---

### Task 28: Dice, ActionBar, and modals

**Files:**
- Create: `src/components/Dice/DiceRoller.tsx`
- Create: `src/components/Dice/DiceAnimation.tsx`
- Create: `src/components/Game/ActionBar.tsx`
- Create: `src/components/Property/BuyPropertyModal.tsx`
- Create: `src/components/Modal/CardModal.tsx`
- Create: `src/components/Modal/JailModal.tsx`
- Create: `src/components/Modal/GameOverModal.tsx`

- [ ] **Step 1: `DiceAnimation`** — Framer Motion spin 1s; display `die1` + `die2` from `gameState.dice`.

- [ ] **Step 2: `ActionBar`** — show buttons based on `phase` and whether current player is local guest:
  - `waiting_for_roll` → "Tung xúc xắc"
  - `buy_decision` → "Mua $X" / "Bỏ qua"
  - `jail_decision` → "Trả $50" / "Dùng thẻ" / "Tung đôi"

- [ ] **Step 3: Modals** triggered by `gameState.phase`.

- [ ] **Step 4: Commit**

```bash
git add src/components/Dice/ src/components/Game/ActionBar.tsx src/components/Property/ src/components/Modal/
git commit -m "feat: add dice animation, action bar, and game modals"
```

---

### Task 29: Game page assembly

**Files:**
- Create: `src/app/game/[roomId]/page.tsx`
- Create: `src/components/Game/GameLayout.tsx`
- Create: `src/components/Game/EventLog.tsx`
- Create: `src/components/Game/ConnectionStatus.tsx`
- Create: `src/components/Property/PropertyPanel.tsx`

- [ ] **Step 1: Game page** connects PartySocket on mount with guest info from URL params or local state.

- [ ] **Step 2: `GameLayout`** — responsive grid per spec (desktop 2-col, mobile stacked).

- [ ] **Step 3: `EventLog`** — scrollable list from `gameState.eventLog`.

- [ ] **Step 4: `ConnectionStatus`** — banner on disconnect, auto-reconnect.

- [ ] **Step 5: Render `WaitingRoom` when `gameStatus === 'waiting'`, board when `playing'`.

- [ ] **Step 6: Commit**

```bash
git add src/app/game/ src/components/Game/ src/components/Property/PropertyPanel.tsx
git commit -m "feat: assemble game page with layout, event log, and connection status"
```

---

## Phase 8: Integration, Polish & Deploy

### Task 30: End-to-end manual test checklist

- [ ] **Step 1: Run full dev stack**

```bash
npm run partykit:dev   # Terminal 1
npm run dev            # Terminal 2
```

- [ ] **Step 2: Test private room flow**

1. Tab A: Create private room (2 players)
2. Tab B: Join via link
3. Host starts game
4. Play 5+ turns: roll, buy, land on owned property (rent), draw chance card
5. Host ends game → rankings modal

- [ ] **Step 3: Test public lobby flow**

1. Tab A: Create public room
2. Tab B: Join from `/lobby`
3. Verify room disappears from lobby when game starts

- [ ] **Step 4: Test disconnect**

1. Tab A disconnects (close tab) during their turn
2. Verify bot plays within 2s
3. Tab A reopens within 3 min → regains control

- [ ] **Step 5: Fix any bugs found**

- [ ] **Step 6: Commit**

```bash
git commit -m "fix: address issues found in end-to-end manual testing"
```

---

### Task 31: README and deployment

**Files:**
- Create: `README.md`
- Create: `.github/workflows/ci.yml` (optional)

- [ ] **Step 1: Write `README.md`** with:
  - Dev setup (2 terminals)
  - Env vars
  - Deploy steps: Vercel + `npx partykit deploy`
  - Architecture diagram (link to spec)

- [ ] **Step 2: Deploy PartyKit**

```bash
npm run partykit:deploy
```
Set `NEXT_PUBLIC_PARTYKIT_HOST` to deployed host in Vercel env.

- [ ] **Step 3: Deploy Vercel** — connect repo, set env vars, deploy.

- [ ] **Step 4: Production smoke test** — create room, play one turn on production URL.

- [ ] **Step 5: Run final test suite**

```bash
npm run test
npm run build
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add README.md .github/
git commit -m "docs: add README and deployment instructions"
```

---

## Spec Coverage Checklist

| Spec Requirement | Task |
|---|---|
| Online realtime multiplayer | Task 17–18 |
| Private rooms + invite code | Task 19, 22 |
| Public lobby | Task 18, 23 |
| Guest identity localStorage | Task 20 |
| Bot on disconnect (3 min) | Task 15, 17 |
| Win: last standing | Task 14, 16 |
| Win: round limit | Task 16, 22 |
| Win: host end game | Task 16, 28 |
| Chance/Community Chest cards | Task 7, 13, 16 |
| Full jail rules | Task 12, 16 |
| Fixed tax tiles | Task 6, 16 |
| Vietnamese UI | All UI tasks |
| Game engine ≥ 80% coverage | Task 8–16 |
| Responsive mobile/desktop | Task 26, 29 |
| Vercel + PartyKit deploy | Task 31 |
| No auth screens (MVP) | — (out of scope) |
| Event log | Task 29 |
| Zustand mirror only | Task 21 |

---

## Execution Notes

- Run `npm run test` after every engine task before committing.
- Keep `partykit:dev` running when testing game pages.
- Add `consecutiveDoubles: number` to `GameState` in Task 16 (needed for 3-doubles jail rule).
- Board tile array in Task 6 must be sorted by position before use — verify all 40 positions 0–39 present.
- Repairs card is no-op in MVP (no houses) — documented in Task 13.

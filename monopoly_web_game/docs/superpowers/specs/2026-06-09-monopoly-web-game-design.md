# Monopoly Web Game — Design Spec

**Date:** 2026-06-09  
**Status:** Approved  
**Source:** BRD `Monopoly Web Game - Project Requirements.docx` + brainstorming session

---

## 1. Executive Summary

Xây dựng game Cờ Tỷ Phú chạy trên trình duyệt web, hỗ trợ **2–4 người chơi online realtime**, giao diện hiện đại tiếng Việt, deploy trên Vercel + PartyKit.

MVP mở rộng phạm vi BRD gốc: multiplayer online (BRD ghi V2) được đưa vào MVP; auth và tiếng Anh để V2.

### Key Decisions

| Topic | Decision |
|---|---|
| Multiplayer | Online realtime via PartyKit (WebSocket) |
| Room access | Private rooms (invite code/link) + public lobby |
| Authentication | Guest only in MVP; architecture ready for auth V2 |
| Disconnect handling | Bot takes over after disconnect; 3-minute reconnect window |
| Win conditions | Last player standing (default); optional round limit; host manual end |
| Special tiles | Basic Chance/Community Chest decks (~12 cards each); fixed tax; full jail rules |
| Language | Vietnamese UI in MVP; English in V2 |
| Architecture | Next.js 15 (Vercel) + PartyKit (Durable Objects) |

### Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, Zustand, Framer Motion
- **Realtime server:** PartyKit (Cloudflare Durable Objects)
- **Testing:** Vitest (game engine unit tests)
- **Deploy:** Vercel (frontend) + PartyKit Cloud (game server)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Vercel — Next.js 15 (Frontend)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Home    │  │  Lobby   │  │  Game    │              │
│  │  Screen  │  │  Screen  │  │  Screen  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       └─────────────┴─────────────┘                       │
│            Zustand (UI state mirror)                      │
│            PartySocket client                           │
└─────────────────────┬───────────────────────────────────┘
                      │ WebSocket
┌─────────────────────▼───────────────────────────────────┐
│  PartyKit (Cloudflare Durable Objects)                  │
│  ┌─────────────────┐  ┌─────────────────────────────┐    │
│  │  LobbyServer    │  │  GameServer (per room)      │    │
│  │  - public rooms │  │  - authoritative game state │    │
│  │  - room listing │  │  - turn/dice/property logic │    │
│  └─────────────────┘  │  - bot on disconnect        │    │
│                         │  - broadcast state          │    │
│                         └─────────────────────────────┘    │
│  Shared: src/game/engine (pure TypeScript)                │
└───────────────────────────────────────────────────────────┘
```

### Components

| Layer | Role |
|---|---|
| **Next.js (Vercel)** | UI, routing, SSR for Home/Lobby; client components for Game |
| **PartyKit GameServer** | One Party per `roomId`; single source of truth for game state |
| **PartyKit LobbyServer** | Single global Party; tracks public rooms in `waiting` status |
| **`src/game/engine`** | Pure logic (roll, move, buy, rent, jail, cards, bankruptcy); shared by client and server |
| **Zustand** | Mirrors server state for UI rendering; never mutates game rules locally |

### Room Flows

**Private room:**
1. Host clicks "Tạo phòng" → `POST /api/rooms` → receives `roomId` + 6-char `roomCode`.
2. Host connects WebSocket to `GameServer/{roomId}`.
3. Others enter code or open `/game/{roomId}` → join same Party.

**Public lobby:**
1. Host creates room with `visibility: 'public'`.
2. `GameServer` registers room with `LobbyServer`.
3. Lobby screen subscribes to `LobbyServer` for realtime room list.
4. Room removed from lobby when game starts or room is full.

### Guest Identity (MVP)

- First visit: generate `guestId` (UUID) stored in `localStorage`.
- On join: send `{ guestId, displayName, color }`.
- Reconnect with same `guestId` restores player slot within 3-minute timeout.
- After timeout: bot takes over permanently; slot treated as exited.

### Deploy Topology

| Service | Host |
|---|---|
| Frontend | Vercel (`npm run build`) |
| Game + Lobby server | PartyKit Cloud (`npx partykit deploy`) |
| Shared game engine | Monorepo: `src/game/` imported by Next.js and PartyKit |

---

## 3. Data Models

### 3.1 Core Game Types

```typescript
type GameStatus = 'waiting' | 'playing' | 'finished';
type PlayerConnection = 'online' | 'disconnected' | 'bot';
type WinMode = 'last_standing' | 'round_limit' | 'host_ended';
type RoomVisibility = 'private' | 'public';

type Player = {
  id: string;              // guestId
  displayName: string;
  color: string;
  money: number;
  position: number;        // 0-39
  properties: string[];
  isBankrupt: boolean;
  isJailed: boolean;
  jailTurns: number;       // 0-3
  getOutOfJailFreeCards: number;
  connection: PlayerConnection;
  disconnectedAt?: number;
};

type Property = {
  id: string;
  name: string;
  position: number;
  price: number;
  rent: number;
  ownerId?: string;
  colorGroup: string;      // reserved for V2 house/hotel monopoly bonus
};

type TileType =
  | 'go' | 'property' | 'chance' | 'community_chest'
  | 'tax' | 'jail' | 'go_to_jail' | 'free_parking';

type BoardTile = {
  position: number;
  type: TileType;
  name: string;
  propertyId?: string;
  taxAmount?: number;
};

type Card = {
  id: string;
  deck: 'chance' | 'community_chest';
  text: string;            // Vietnamese
  action: CardAction;
};

type CardAction =
  | { type: 'move'; targetPosition: number; collectGo?: boolean }
  | { type: 'move_relative'; steps: number }
  | { type: 'pay'; amount: number }
  | { type: 'collect'; amount: number }
  | { type: 'go_to_jail' }
  | { type: 'get_out_of_jail_free' }
  | { type: 'repairs'; perHouse: number; perHotel: number }; // V2 stub, unused in MVP

type DiceResult = {
  die1: number;
  die2: number;
  total: number;
  isDouble: boolean;
};

type RoomSettings = {
  visibility: RoomVisibility;
  maxPlayers: number;          // 2-4
  roundLimit?: number;
  disconnectTimeoutMs: number; // default 180_000 (3 min)
  startingMoney: number;       // default 1500
  goBonus: number;             // default 200
};

type TurnPhase =
  | 'waiting_for_roll'
  | 'rolled'
  | 'buy_decision'
  | 'card_drawn'
  | 'jail_decision'
  | 'turn_end';

type GameState = {
  roomId: string;
  hostId: string;
  settings: RoomSettings;
  players: Player[];
  currentPlayerIndex: number;
  dice: DiceResult | null;
  gameStatus: GameStatus;
  currentRound: number;
  winMode?: WinMode;
  winnerId?: string;
  eventLog: GameEvent[];
  chanceDeck: string[];
  communityDeck: string[];
  phase: TurnPhase;
};

type GameEvent = {
  id: string;
  timestamp: number;
  message: string;     // Vietnamese
  type: 'info' | 'money' | 'property' | 'jail' | 'card' | 'system';
};
```

### 3.2 Room & Messaging Types

```typescript
type RoomSummary = {
  roomId: string;
  roomCode: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  visibility: RoomVisibility;
  gameStatus: GameStatus;
  createdAt: number;
};

type ClientMessage =
  | { type: 'join'; guestId: string; displayName: string; color: string }
  | { type: 'start_game' }
  | { type: 'roll_dice' }
  | { type: 'buy_property' }
  | { type: 'skip_buy' }
  | { type: 'pay_jail_fine' }
  | { type: 'use_jail_card' }
  | { type: 'roll_for_doubles' }
  | { type: 'end_game' }
  | { type: 'leave' };

type ServerMessage =
  | { type: 'state_sync'; state: GameState }
  | { type: 'error'; code: string; message: string }
  | { type: 'player_joined'; player: Player }
  | { type: 'game_started' }
  | { type: 'game_ended'; rankings: PlayerRanking[] };

type PlayerRanking = {
  playerId: string;
  displayName: string;
  totalAssets: number;   // money + sum(property.price)
  rank: number;
};
```

---

## 4. Board & Card Data

### 4.1 Board (40 tiles)

| Tile type | Count | Notes |
|---|---|---|
| GO | 1 | position 0 |
| Property | 22 | price $60–$400, flat rent |
| Chance | 3 | draw from chance deck |
| Community Chest | 3 | draw from community deck |
| Tax | 2 | Income Tax $200, Luxury Tax $100 |
| Jail (visiting) | 1 | position 10 |
| Go To Jail | 1 | position 30 |
| Free Parking | 1 | no effect in MVP |

Each property includes `colorGroup` for future V2 monopoly bonuses.

### 4.2 Card Decks (~12 per deck, Vietnamese text)

**Chance examples:**
- Advance to GO, collect $200
- Advance to [street name]
- Advance to nearest Utility/Railroad
- Go back 3 spaces
- Go to jail
- Get Out of Jail Free (keep card)
- Collect $50 / $100 / $150
- Pay $15 / $50

**Community Chest examples:**
- Bank error in your favor: collect $200
- Tax refund: collect $100
- Doctor's fee: pay $50; Insurance: pay $100
- Get Out of Jail Free
- Go to jail
- Collect $10 / $25 from each player

Used cards go to bottom of deck (standard Monopoly rules).

---

## 5. Game Engine

### 5.1 Module Structure

```
src/game/engine/
├── index.ts
├── dice.ts            # rollDice(): DiceResult
├── movement.ts        # movePlayer(), passGo detection
├── property.ts        # buyProperty(), payRent(), transferOwnership()
├── economy.ts         # pay(), collect(), canAfford(), transfer()
├── jail.ts            # sendToJail(), payFine(), rollForDoubles(), useCard()
├── cards.ts           # drawCard(), applyCardAction()
├── bankruptcy.ts      # declareBankrupt(), liquidateAssets()
├── turn.ts            # nextTurn(), canRollAgain() (doubles)
├── bot.ts             # getBotAction() for disconnected players
├── win.ts             # checkWinCondition(), calculateRankings()
└── validators.ts      # isValidAction(state, action, playerId)
```

### 5.2 Principles

- All mutations go through `applyAction(state, action)` → `Result<GameState, GameError>`.
- `validators.ts` checks: correct turn, correct phase, sufficient funds, host-only actions.
- Engine is pure TypeScript with no side effects — used identically on client (read-only preview) and PartyKit server (authoritative).

### 5.3 Game Rules (MVP)

| Rule | Value |
|---|---|
| Starting money | $1,500 |
| Pass GO | +$200 |
| Dice | 2 dice (1–6 each) |
| Doubles | Extra turn; 3 consecutive doubles → go to jail |
| Jail fine | $50 |
| Max jail turns | 3 (turn 3 must pay $50 to leave) |
| Rent | `property.rent` (flat, no house bonus) |
| Bankruptcy | `money < 0` after transaction → eliminated; properties return to bank (unowned) |
| Win — default | Last non-bankrupt player |
| Win — round limit | After `roundLimit` rounds → rank by total assets |
| Win — host end | Host calls `end_game` → rank by total assets |

**Total assets** = `money + sum(property.price)` (purchase price, no house value in MVP).

### 5.4 Bot Logic

Simple server-side bot for `connection === 'bot'` or during disconnect timeout at bot's turn:

- Roll when `phase === 'waiting_for_roll'`
- Buy if `money > price * 1.5` (keep buffer)
- Jail: pay $50 if affordable, else roll for doubles
- Skip buy if insufficient funds
- 1.5s delay before each action (simulated thinking)

---

## 6. PartyKit Server

### 6.1 File Structure

```
partykit/
├── partykit.json
└── src/
    ├── game.ts          # GameServer — one instance per room
    ├── lobby.ts         # LobbyServer — singleton global
    └── utils/
        ├── connection.ts
        └── broadcast.ts
```

### 6.2 GameServer Lifecycle

**onConnect:**
- Parse `{ guestId, displayName, color }` from query string.
- If `gameStatus === 'waiting'`: add new player or reconnect existing; broadcast `state_sync`.
- If `gameStatus === 'playing'`: matching `guestId` reconnects (`bot`/`disconnected` → `online`); unknown guest receives error and connection closes.

**onMessage:**
- Validate sender (guestId, turn, phase).
- `applyAction(state, action)` via engine.
- Append to `eventLog` (ring buffer, max 50 events).
- `checkWinCondition()`.
- Broadcast `state_sync`.

**onClose:**
- If `waiting`: remove player from room.
- If `playing`: set `connection = 'disconnected'`, `disconnectedAt = now`, start 3-minute timer, broadcast `state_sync`.

### 6.3 Disconnect & Bot States

| State | Controller | UI |
|---|---|---|
| `online` | Player | Normal name display |
| `disconnected` | Awaiting reconnect | "Đang mất kết nối..." (yellow) |
| `bot` | Server bot | "🤖 Bot" (gray) |

After 3-minute timeout without reconnect: `disconnected` → `bot` permanently.

### 6.4 Host Privileges

| Action | Allowed by |
|---|---|
| `start_game` | Host when `waiting` and ≥ 2 players |
| `end_game` | Host when `playing` |
| `roll_dice`, buy, jail actions | Current player (must be `online`) |
| Room settings at creation | Host |

**Host disconnect during play:** wait 3 minutes for reconnect. After timeout, transfer host to next `online` player by join order.

### 6.5 LobbyServer

- Global Party ID: `"lobby"`.
- Public rooms register on create; unregister when game starts.
- 30-second heartbeat: ping rooms; remove unresponsive entries (prevent ghost rooms).
- Private rooms never register with lobby.

### 6.6 Room Creation API

`POST /api/rooms` with `{ visibility, maxPlayers, roundLimit? }`:
- Generates `roomId` (UUID) and `roomCode` (6 chars).
- Returns `{ roomId, roomCode, wsUrl }`.
- Invite link: `https://domain.com/game/{roomId}`.
- `roomCode → roomId` mapping stored in GameServer Durable Object storage.

### 6.7 State Persistence

| Data | Storage | Lifetime |
|---|---|---|
| Active game state | Durable Object memory + `storage.put()` | Duration of game; deleted 1h after `finished` |
| roomCode mapping | Durable Object storage | Duration of game |
| Lobby list | LobbyServer memory | Ephemeral; rebuilt from registrations |
| guestId | Client localStorage | Persistent per browser |

No external database in MVP.

### 6.8 Error Codes

| Situation | Code |
|---|---|
| Room full | `ROOM_FULL` |
| Not player's turn | `NOT_YOUR_TURN` |
| Wrong phase | `INVALID_PHASE` |
| Insufficient funds | `INSUFFICIENT_FUNDS` |
| Non-host host action | `NOT_HOST` |
| Room not found | `ROOM_NOT_FOUND` |
| Game finished | `GAME_FINISHED` |

Client shows Vietnamese toast; UI does not crash.

### 6.9 Sync Strategy

- Full `state_sync` on every action (MVP; state ~5KB).
- Client updates Zustand on `state_sync`; no optimistic updates for money/position.
- Dice animation triggers on new `dice` in `state_sync`; values come from server.

---

## 7. UI Design

### 7.1 Routes

| Route | Screen |
|---|---|
| `/` | Home — create/join room |
| `/lobby` | Public room list |
| `/game/[roomId]` | Waiting room + game board |
| `/rules` | Static rules page |

No separate `/settings` in MVP; room settings are in create-room form.

### 7.2 Component Structure

```
src/components/
├── layout/       Header, MobileNav
├── Home/         HeroSection, CreateRoomForm, JoinRoomForm
├── Lobby/        RoomList, RoomCard, LobbyEmpty
├── Board/        MonopolyBoard, BoardTile, BoardCenter, PlayerToken
├── Dice/         DiceRoller, DiceAnimation
├── Player/       PlayerList, PlayerCard, PlayerSetup
├── Property/     PropertyPanel, BuyPropertyModal
├── Modal/        CardModal, JailModal, GameOverModal, ConfirmModal
├── Game/         GameLayout, EventLog, ActionBar, WaitingRoom, ConnectionStatus
└── ui/           Button, Modal, Toast, Badge
```

### 7.3 Layout

**Desktop:** CSS Grid `1fr 320px` — board left, sidebar (players, property detail, event log) right. Sticky ActionBar at bottom.

**Mobile:**
- Board scaled/scrollable
- PlayerList as horizontal scroll chips
- PropertyPanel + EventLog in bottom sheet
- Sticky ActionBar at bottom

**Breakpoints:**
- `< 640px`: mobile layout
- `640–1024px`: board 80% width, sidebar below
- `> 1024px`: two-column desktop layout

### 7.4 Zustand Store

```typescript
type GameStore = {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  guestId: string;
  roomId: string | null;
  gameState: GameState | null;       // mirror from server only
  selectedTile: number | null;       // UI-only
  isEventLogExpanded: boolean;       // UI-only
  toasts: Toast[];                   // UI-only
  connect: (roomId: string, guestInfo: GuestInfo) => void;
  disconnect: () => void;
  sendAction: (action: ClientMessage) => void;
  setGameState: (state: GameState) => void;
  selectTile: (position: number) => void;
};
```

`gameState` is updated only from server `state_sync` messages.

### 7.5 Visual Style

| Token | Value |
|---|---|
| Primary | `#1B5E20` |
| Accent | `#FFD700` |
| Background | `#F5F0E8` |
| Font | Inter (UI) |
| Tone | Modern, clean; standard Monopoly property group colors on board |

### 7.6 Animations (Framer Motion)

| Element | Animation |
|---|---|
| Dice | 2 dice spin ~1s, land on server values |
| Player token | Move step-by-step, 300ms per tile |
| Buy modal | Slide up |
| Card modal | Flip reveal |
| Toast | Slide in from right, auto-dismiss 3s |
| Game over | Confetti + ranking slide in |

Animations run after receiving `state_sync` — never predict outcomes.

### 7.7 UX Rules

- ActionBar shows only valid buttons for current `phase` and `currentPlayer`.
- Non-current players see disabled buttons with tooltip "Đang chờ [tên]".
- `ConnectionStatus` banner on disconnect; auto-reconnect.
- Copy room link via clipboard + toast "Đã copy!".
- Colors already taken by other players are disabled in picker.

---

## 8. Project Structure

```
monopoly_web_game/
├── partykit/
│   ├── partykit.json
│   └── src/
│       ├── game.ts
│       ├── lobby.ts
│       └── utils/
├── src/
│   ├── app/
│   ├── components/
│   ├── game/engine/
│   ├── game/rules/
│   ├── store/gameStore.ts
│   ├── data/board.ts
│   ├── data/cards.ts
│   ├── hooks/
│   ├── types/
│   └── utils/
├── tests/
│   ├── engine/
│   └── integration/
├── docs/superpowers/specs/
├── .env.local.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

Path alias: `@/` → `src/`. Engine importable from both Next.js and PartyKit via `tsconfig` paths.

---

## 9. Testing

| Layer | Tool | Scope | Priority |
|---|---|---|---|
| Game engine | Vitest | All rules: dice, move, buy, rent, jail, cards, bankruptcy, win | Highest |
| Validators | Vitest | `isValidAction` edge cases | High |
| Bot logic | Vitest | Valid actions in all phases | Medium |
| Integration | Vitest | Simulate 2-player game via engine | Medium |
| PartyKit server | Manual | WS connect, disconnect, bot | MVP manual |
| UI E2E | — | Deferred to V2 (Playwright) | Low |

Target: **≥ 80% coverage** for `src/game/engine/`.

### Critical Test Cases

- Roll dice → correct tile movement
- Pass GO → +$200
- Buy property → deduct money, set ownerId
- Land on owned property → pay rent
- Insufficient funds → bankruptcy, properties return to bank
- 3 consecutive doubles → jail
- Jail: pay $50 / use card / roll doubles → release
- Chance card "Go to jail" → `isJailed = true`
- Last player standing → `gameStatus = 'finished'`
- Round limit reached → rank by total assets
- Bot buys when affordable; skips when not

---

## 10. Environment & Deployment

### 10.1 Environment Variables

```bash
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999        # dev
PARTYKIT_HOST=your-project.partykit.dev         # prod
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 10.2 Deploy Commands

```bash
# Frontend
vercel deploy          # or GitHub auto-deploy

# Game server
npx partykit deploy
```

### 10.3 Development

```bash
npm run dev            # Terminal 1: Next.js
npx partykit dev       # Terminal 2: PartyKit
npm run test:watch     # Terminal 3: Vitest
```

### 10.4 CI (optional MVP)

```yaml
- npm run lint
- npm run test
- npm run build
```

---

## 11. Roadmap

| Phase | Content | Estimate |
|---|---|---|
| 1. Setup | Next.js 15 + PartyKit + Tailwind + Zustand + Vitest scaffold | 1–2 days |
| 2. Game Engine | Board data, all rules + unit tests | 3–4 days |
| 3. PartyKit Server | GameServer, LobbyServer, WS flow, disconnect/bot | 2–3 days |
| 4. UI — Home & Lobby | Create/join room, lobby list, guest ID | 1–2 days |
| 5. UI — Game Board | Board render, dice animation, tokens, responsive | 3–4 days |
| 6. UI — Game Actions | Buy/card/jail modals, action bar, event log | 2–3 days |
| 7. Integration & Polish | End-to-end flow, game over, connection handling | 2–3 days |
| 8. Deploy | Vercel + PartyKit Cloud, production smoke test | 1 day |

**Total estimate: ~15–22 days** (1 developer).

### Deferred to V2

- User authentication (email/OAuth)
- English language support
- House/Hotel system
- Save game / replay
- Ranking leaderboard
- E2E tests (Playwright)

---

## 12. Success Criteria

| # | Criterion | Measurement |
|---|---|---|
| 1 | Complete 2–4 player online game | Manual: create room → play full game |
| 2 | No page reload during play | SPA navigation + persistent WebSocket |
| 3 | Mobile responsive | Test iPhone/Android viewport |
| 4 | Successful deploy | Vercel + PartyKit Cloud live |
| 5 | Page load < 3 seconds | Lighthouse performance |
| 6 | Disconnect → bot takeover | Close tab, reopen within/after timeout |
| 7 | Public lobby works | Two tabs: create public room + join from lobby |
| 8 | Engine tests pass | `npm run test` green, ≥ 80% engine coverage |

---

## 13. Risks & Mitigations

| Risk | Level | Mitigation |
|---|---|---|
| PartyKit cold start latency | Medium | Durable Object holds state; lobby heartbeat |
| Board render on mobile | High | Scale + scroll early; test mobile from Phase 5 |
| Ghost rooms in lobby | Low | 30s heartbeat + auto cleanup |
| Bot logic too simple | Low | Acceptable for MVP; improve in V2 |
| Shared engine path alias | Medium | Verify imports in Phase 1 |
| Two deploy targets (Vercel + PartyKit) | Medium | Document clearly in README |

---

## 14. Out of Scope (MVP)

- User registration/login screens
- English UI
- House/Hotel upgrades
- Property monopoly rent multipliers
- Online matchmaking (only manual lobby browse)
- Persistent game history or statistics
- Payment or monetization
- AI opponents for empty slots (only disconnect replacement bot)

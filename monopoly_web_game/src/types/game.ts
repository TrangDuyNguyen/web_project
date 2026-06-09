export type GameStatus = 'waiting' | 'playing' | 'finished';
export type PlayerConnection = 'online' | 'disconnected' | 'bot';
export type WinMode = 'last_standing' | 'round_limit' | 'host_ended';
export type RoomVisibility = 'private' | 'public';

export type Player = {
  id: string;
  displayName: string;
  color: string;
  money: number;
  position: number;
  properties: string[];
  isBankrupt: boolean;
  isJailed: boolean;
  jailTurns: number;
  getOutOfJailFreeCards: number;
  connection: PlayerConnection;
  disconnectedAt?: number;
};

export type Property = {
  id: string;
  name: string;
  position: number;
  price: number;
  rent: number;
  ownerId?: string;
  colorGroup: string;
};

export type TileType =
  | 'go'
  | 'property'
  | 'chance'
  | 'community_chest'
  | 'tax'
  | 'jail'
  | 'go_to_jail'
  | 'free_parking';

export type BoardTile = {
  position: number;
  type: TileType;
  name: string;
  propertyId?: string;
  taxAmount?: number;
};

export type CardAction =
  | { type: 'move'; targetPosition: number; collectGo?: boolean }
  | { type: 'move_relative'; steps: number }
  | { type: 'pay'; amount: number }
  | { type: 'collect'; amount: number }
  | { type: 'go_to_jail' }
  | { type: 'get_out_of_jail_free' }
  | { type: 'repairs'; perHouse: number; perHotel: number };

export type Card = {
  id: string;
  deck: 'chance' | 'community_chest';
  text: string;
  action: CardAction;
};

export type DiceResult = {
  die1: number;
  die2: number;
  total: number;
  isDouble: boolean;
};

export type RoomSettings = {
  visibility: RoomVisibility;
  maxPlayers: number;
  roundLimit?: number;
  disconnectTimeoutMs: number;
  startingMoney: number;
  goBonus: number;
};

export type TurnPhase =
  | 'waiting_for_roll'
  | 'rolled'
  | 'buy_decision'
  | 'card_drawn'
  | 'jail_decision'
  | 'turn_end';

export type GameEvent = {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'money' | 'property' | 'jail' | 'card' | 'system';
};

export type GameState = {
  roomId: string;
  hostId: string;
  settings: RoomSettings;
  players: Player[];
  currentPlayerIndex: number;
  dice: DiceResult | null;
  gameStatus: GameStatus;
  currentRound: number;
  consecutiveDoubles: number;
  winMode?: WinMode;
  winnerId?: string;
  eventLog: GameEvent[];
  chanceDeck: string[];
  communityDeck: string[];
  phase: TurnPhase;
  propertyOwners: Record<string, string | undefined>;
  lastCard?: Card;
};

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

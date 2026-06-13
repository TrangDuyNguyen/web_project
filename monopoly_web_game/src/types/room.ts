import type { GameState, Player, RoomVisibility } from './game';

export type RoomSummary = {
  roomId: string;
  roomCode: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  visibility: RoomVisibility;
  gameStatus: 'waiting' | 'playing' | 'finished';
  createdAt: number;
};

export type ClientMessage =
  | { type: 'start_game' }
  | { type: 'roll_dice' }
  | { type: 'buy_property' }
  | { type: 'skip_buy' }
  | { type: 'pay_jail_fine' }
  | { type: 'use_jail_card' }
  | { type: 'roll_for_doubles' }
  | { type: 'end_game' }
  | { type: 'leave' };

export type PlayerRanking = {
  playerId: string;
  displayName: string;
  totalAssets: number;
  rank: number;
};

export type ServerMessage =
  | { type: 'state_sync'; state: GameState }
  | { type: 'error'; code: string; message: string }
  | { type: 'player_joined'; player: Player }
  | { type: 'game_started' }
  | { type: 'game_ended'; rankings: PlayerRanking[] }
  | { type: 'lobby_sync'; rooms: RoomSummary[] };

export type CreateRoomRequest = {
  visibility: RoomVisibility;
  maxPlayers: number;
  roundLimit?: number;
};

export type CreateRoomResponse = {
  roomId: string;
  roomCode: string;
  wsUrl: string;
};

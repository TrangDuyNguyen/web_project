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
    roomId,
    hostId,
    settings,
    players: [],
    currentPlayerIndex: 0,
    dice: null,
    gameStatus: 'waiting',
    currentRound: 0,
    consecutiveDoubles: 0,
    eventLog: [],
    chanceDeck: shuffleDeck(CHANCE_CARDS.map((c) => c.id)),
    communityDeck: shuffleDeck(COMMUNITY_CARDS.map((c) => c.id)),
    phase: 'waiting_for_roll',
    propertyOwners: {},
  };
}

export function createPlayer(userId: string, displayName: string, color: string): Player {
  return {
    id: userId,
    displayName,
    color,
    money: STARTING_MONEY,
    position: 0,
    properties: [],
    isBankrupt: false,
    isJailed: false,
    jailTurns: 0,
    getOutOfJailFreeCards: 0,
    connection: 'online',
  };
}

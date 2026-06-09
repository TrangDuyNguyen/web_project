import { describe, it, expect } from 'vitest';
import { getBotAction } from '@/game/engine/bot';
import type { GameState } from '@/types/game';

const mkState = (phase: GameState['phase'], money = 1500): GameState => ({
  roomId: 'r1', hostId: 'p1', currentPlayerIndex: 0, dice: null,
  gameStatus: 'playing', currentRound: 1, consecutiveDoubles: 0, eventLog: [],
  chanceDeck: [], communityDeck: [], phase, propertyOwners: {},
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

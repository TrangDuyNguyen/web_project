import { describe, it, expect } from 'vitest';
import { checkLastStanding, calculateRankings } from '@/game/engine/win';
import type { Player } from '@/types/game';

const mkPlayer = (id: string, money: number, bankrupt = false): Player => ({
  id, displayName: id, color: '#EF4444', money, position: 0, properties: [],
  isBankrupt: bankrupt, isJailed: false, jailTurns: 0, getOutOfJailFreeCards: 0, connection: 'online',
});

describe('win', () => {
  it('detects last player standing', () => {
    expect(checkLastStanding([mkPlayer('p1', 100), mkPlayer('p2', 0, true)])).toBe('p1');
  });
  it('calculateRankings sorts by total assets', () => {
    expect(calculateRankings([mkPlayer('p1', 100), mkPlayer('p2', 500)])[0].playerId).toBe('p2');
  });
});

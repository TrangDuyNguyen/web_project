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
    expect(pay(basePlayer(), 200).money).toBe(1300);
  });
  it('collect adds money', () => {
    expect(collect(basePlayer(), 200).money).toBe(1700);
  });
});

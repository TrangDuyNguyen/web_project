import { describe, it, expect, vi, afterEach } from 'vitest';
import { rollDice } from '@/game/engine/dice';

describe('rollDice', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns two dice between 1 and 6', () => {
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

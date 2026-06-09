import { describe, it, expect } from 'vitest';
import { movePlayer, passedGo } from '@/game/engine/movement';

describe('movement', () => {
  it('moves player forward', () => {
    expect(movePlayer(5, 7)).toBe(12);
  });
  it('wraps around board', () => {
    expect(movePlayer(38, 4)).toBe(2);
  });
  it('detects passing GO', () => {
    expect(passedGo(38, 4)).toBe(true);
    expect(passedGo(10, 5)).toBe(false);
  });
});

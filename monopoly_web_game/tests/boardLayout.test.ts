import { describe, it, expect } from 'vitest';
import { BOARD_CELL_PLACEMENTS } from '@/data/boardLayout';
import { BOARD_TILES } from '@/data/board';

describe('board layout', () => {
  it('places all 40 tiles exactly once on the perimeter', () => {
    expect(BOARD_CELL_PLACEMENTS).toHaveLength(40);
    const positions = BOARD_CELL_PLACEMENTS.map((c) => c.position);
    expect(new Set(positions).size).toBe(40);
    for (const tile of BOARD_TILES) {
      expect(positions).toContain(tile.position);
    }
  });

  it('places Vào Tù at top-right and Free Parking at top-left', () => {
    const goToJail = BOARD_CELL_PLACEMENTS.find((c) => c.position === 30);
    const freeParking = BOARD_CELL_PLACEMENTS.find((c) => c.position === 20);
    expect(goToJail).toEqual({ position: 30, col: 11, row: 1 });
    expect(freeParking).toEqual({ position: 20, col: 1, row: 1 });
  });

  it('places New York above Jail visiting', () => {
    const jail = BOARD_CELL_PLACEMENTS.find((c) => c.position === 10);
    const newYork = BOARD_CELL_PLACEMENTS.find((c) => c.position === 19);
    expect(jail).toEqual({ position: 10, col: 1, row: 11 });
    expect(newYork).toEqual({ position: 19, col: 1, row: 10 });
  });
});

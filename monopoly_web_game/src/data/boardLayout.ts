import { TILE_BY_POSITION } from '@/data/board';

/** Vị trí 40 ô trên lưới 11×11 (col/row 1-indexed, theo chiều kim đồng hồ từ XUẤT PHÁT) */
export const BOARD_CELL_PLACEMENTS: { position: number; col: number; row: number }[] = (() => {
  const cells: { position: number; col: number; row: number }[] = [];

  // Hàng dưới (trái → phải): 10 … 0
  for (let col = 1; col <= 11; col++) {
    cells.push({ position: 11 - col, col, row: 11 });
  }
  // Hàng trên (trái → phải): 20 … 30
  for (let col = 1; col <= 11; col++) {
    cells.push({ position: 19 + col, col, row: 1 });
  }
  // Cột trái (dưới → lên): 19 … 11 — hàng 10 gần Thăm Tù, hàng 2 gần Bãi Đỗ
  for (let row = 2; row <= 10; row++) {
    cells.push({ position: row + 9, col: 1, row });
  }
  // Cột phải (trên → dưới): 39 … 31
  for (let row = 2; row <= 10; row++) {
    cells.push({ position: 41 - row, col: 11, row });
  }

  return cells;
})();

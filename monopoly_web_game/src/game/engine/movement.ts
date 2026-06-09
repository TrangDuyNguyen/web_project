import { BOARD_SIZE } from '@/game/rules/constants';

export function movePlayer(current: number, steps: number): number {
  return (current + steps + BOARD_SIZE) % BOARD_SIZE;
}

export function passedGo(from: number, steps: number): boolean {
  if (steps <= 0) return false;
  return from + steps >= BOARD_SIZE;
}

import type { DiceResult } from '@/types/game';

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollDice(): DiceResult {
  const die1 = rollDie();
  const die2 = rollDie();
  return { die1, die2, total: die1 + die2, isDouble: die1 === die2 };
}

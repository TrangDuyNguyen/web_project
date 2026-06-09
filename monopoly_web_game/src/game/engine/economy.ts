import type { Player } from '@/types/game';

export function canAfford(player: Player, amount: number): boolean {
  return player.money >= amount;
}

export function pay(player: Player, amount: number): Player {
  return { ...player, money: player.money - amount };
}

export function collect(player: Player, amount: number): Player {
  return { ...player, money: player.money + amount };
}

export function transfer(from: Player, to: Player, amount: number): { from: Player; to: Player } {
  return { from: pay(from, amount), to: collect(to, amount) };
}

import type { Player } from '@/types/game';

export function declareBankrupt(player: Player): Player {
  return { ...player, isBankrupt: true, money: 0, properties: [] };
}

export function isBankrupt(player: Player): boolean {
  return player.money < 0 || player.isBankrupt;
}

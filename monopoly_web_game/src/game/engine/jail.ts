import type { Player } from '@/types/game';
import { JAIL_FINE, JAIL_POSITION } from '@/game/rules/constants';
import { pay } from './economy';

export function sendToJail(player: Player): Player {
  return { ...player, position: JAIL_POSITION, isJailed: true, jailTurns: 0 };
}

export function payJailFine(player: Player): Player {
  return releaseFromJail(pay(player, JAIL_FINE));
}

export function releaseFromJail(player: Player): Player {
  return { ...player, isJailed: false, jailTurns: 0 };
}

export function incrementJailTurn(player: Player): Player {
  return { ...player, jailTurns: player.jailTurns + 1 };
}

export function useJailCard(player: Player): Player {
  if (player.getOutOfJailFreeCards <= 0) throw new Error('NO_JAIL_CARD');
  return releaseFromJail({ ...player, getOutOfJailFreeCards: player.getOutOfJailFreeCards - 1 });
}

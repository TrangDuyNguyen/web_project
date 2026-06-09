import type { CardAction, Player } from '@/types/game';
import { GO_BONUS, GO_POSITION } from '@/game/rules/constants';
import { collect, pay } from './economy';
import { sendToJail } from './jail';
import { movePlayer, passedGo } from './movement';

export function shuffleDeck(deck: string[]): string[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function drawCard(deck: string[]): { cardId: string; deck: string[] } {
  const [cardId, ...rest] = deck;
  return { cardId, deck: [...rest, cardId] };
}

export function applyCardAction(player: Player, action: CardAction): { player: Player } {
  switch (action.type) {
    case 'collect':
      return { player: collect(player, action.amount) };
    case 'pay':
      return { player: pay(player, action.amount) };
    case 'go_to_jail':
      return { player: sendToJail(player) };
    case 'get_out_of_jail_free':
      return { player: { ...player, getOutOfJailFreeCards: player.getOutOfJailFreeCards + 1 } };
    case 'move': {
      const crossedGo = player.position > action.targetPosition && action.targetPosition !== GO_POSITION;
      let updated = { ...player, position: action.targetPosition };
      if (action.collectGo || crossedGo) {
        updated = collect(updated, GO_BONUS);
      }
      return { player: updated };
    }
    case 'move_relative': {
      const newPos = movePlayer(player.position, action.steps);
      let updated = { ...player, position: newPos };
      if (action.steps > 0 && passedGo(player.position, action.steps)) {
        updated = collect(updated, GO_BONUS);
      }
      return { player: updated };
    }
    case 'repairs':
      return { player };
    default:
      return { player };
  }
}

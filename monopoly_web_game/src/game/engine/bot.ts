import type { EngineAction, GameState } from '@/types/game';
import { JAIL_FINE } from '@/game/rules/constants';
import { getCurrentPlayer } from './turn';

export function getBotAction(state: GameState): EngineAction {
  const player = getCurrentPlayer(state);
  switch (state.phase) {
    case 'waiting_for_roll':
      return { type: 'roll_dice' };
    case 'buy_decision':
      return player.money > 200 ? { type: 'buy_property' } : { type: 'skip_buy' };
    case 'jail_decision':
      return player.money >= JAIL_FINE ? { type: 'pay_jail_fine' } : { type: 'roll_for_doubles' };
    default:
      return { type: 'skip_buy' };
  }
}

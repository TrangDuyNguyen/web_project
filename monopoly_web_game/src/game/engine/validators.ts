import type { EngineAction, GameError, GameState } from '@/types/game';
import { getCurrentPlayer } from './turn';

export function validateAction(
  state: GameState,
  action: EngineAction,
  playerId: string
): GameError | null {
  if (state.gameStatus === 'finished') {
    return { code: 'GAME_FINISHED', message: 'Ván đã kết thúc' };
  }

  if (action.type === 'start_game') {
    if (state.hostId !== playerId) return { code: 'NOT_HOST', message: 'Chỉ host mới bắt đầu được' };
    if (state.players.length < 2) return { code: 'NOT_ENOUGH_PLAYERS', message: 'Cần ít nhất 2 người chơi' };
    return null;
  }

  if (action.type === 'end_game') {
    if (state.hostId !== playerId) return { code: 'NOT_HOST', message: 'Chỉ host mới kết thúc được' };
    return null;
  }

  if (state.gameStatus !== 'playing') {
    return { code: 'INVALID_PHASE', message: 'Ván chưa bắt đầu' };
  }

  const current = getCurrentPlayer(state);
  if (current.id !== playerId) return { code: 'NOT_YOUR_TURN', message: 'Không phải lượt của bạn' };
  if (current.connection === 'bot') return { code: 'BOT_TURN', message: 'Đang do bot điều khiển' };

  const phaseMap: Record<string, EngineAction['type'][]> = {
    waiting_for_roll: ['roll_dice'],
    buy_decision: ['buy_property', 'skip_buy'],
    jail_decision: ['pay_jail_fine', 'use_jail_card', 'roll_for_doubles'],
    card_drawn: ['skip_buy'],
  };

  const allowed = phaseMap[state.phase] ?? [];
  if (!allowed.includes(action.type)) {
    return { code: 'INVALID_PHASE', message: 'Hành động không hợp lệ' };
  }

  return null;
}

import { describe, it, expect } from 'vitest';
import { applyAction } from '@/game/engine/applyAction';
import { createWaitingState, createPlayer } from '@/game/engine/createInitialState';

const settings = {
  visibility: 'private' as const,
  maxPlayers: 4,
  disconnectTimeoutMs: 180000,
  startingMoney: 1500,
  goBonus: 200,
};

describe('applyAction', () => {
  it('start_game transitions to playing', () => {
    let state = createWaitingState('r1', 'p1', settings);
    state = {
      ...state,
      players: [createPlayer('p1', 'A', '#EF4444'), createPlayer('p2', 'B', '#3B82F6')],
    };
    const result = applyAction(state, { type: 'start_game' }, 'p1');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.gameStatus).toBe('playing');
  });

  it('rejects start from non-host', () => {
    let state = createWaitingState('r1', 'p1', settings);
    state = { ...state, players: [createPlayer('p1', 'A', '#EF4444'), createPlayer('p2', 'B', '#3B82F6')] };
    const result = applyAction(state, { type: 'start_game' }, 'p2');
    expect(result.ok).toBe(false);
  });
});

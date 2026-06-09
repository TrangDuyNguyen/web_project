import type { GameState } from '@/types/game';

export function nextPlayerIndex(state: GameState): number {
  const total = state.players.length;
  let idx = state.currentPlayerIndex;
  for (let i = 0; i < total; i++) {
    idx = (idx + 1) % total;
    if (!state.players[idx].isBankrupt) return idx;
  }
  return state.currentPlayerIndex;
}

export function getCurrentPlayer(state: GameState) {
  return state.players[state.currentPlayerIndex];
}

export function updatePlayer(state: GameState, playerId: string, updater: (p: GameState['players'][0]) => GameState['players'][0]) {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? updater(p) : p)),
  };
}

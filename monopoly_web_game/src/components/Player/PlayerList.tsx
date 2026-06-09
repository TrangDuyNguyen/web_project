import type { GameState } from '@/types/game';
import { PlayerCard } from './PlayerCard';

type Props = { state: GameState };

export function PlayerList({ state }: Props) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-gray-700">Người chơi</h3>
      {state.players.map((p, i) => (
        <PlayerCard
          key={p.id}
          player={p}
          isCurrent={i === state.currentPlayerIndex && state.gameStatus === 'playing'}
          isHost={p.id === state.hostId}
        />
      ))}
    </div>
  );
}

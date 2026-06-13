import type { GameState } from '@/types/game';
import { PlayerCard } from './PlayerCard';
import { Panel } from '@/components/ui/Panel';

type Props = { state: GameState };

export function PlayerList({ state }: Props) {
  return (
    <Panel title="Người chơi" icon="👥" bodyClassName="space-y-2">
      {state.players.map((p, i) => (
        <PlayerCard
          key={p.id}
          player={p}
          isCurrent={i === state.currentPlayerIndex && state.gameStatus === 'playing'}
          isHost={p.id === state.hostId}
        />
      ))}
    </Panel>
  );
}

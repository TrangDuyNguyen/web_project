'use client';

import { TILE_BY_POSITION } from '@/data/board';
import { BOARD_CELL_PLACEMENTS } from '@/data/boardLayout';
import { BoardTile } from './BoardTile';
import { PlayerToken } from './PlayerToken';
import { DiceAnimation } from '@/components/Dice/DiceAnimation';
import type { DiceResult, Player } from '@/types/game';

type Props = {
  players: Player[];
  selectedTile: number | null;
  onSelectTile: (position: number) => void;
  dice: DiceResult | null;
};

export function MonopolyBoard({ players, selectedTile, onSelectTile, dice }: Props) {
  function tokensOnTile(position: number) {
    return players.filter((p) => !p.isBankrupt && p.position === position);
  }

  function TileCell({ position }: { position: number }) {
    const tile = TILE_BY_POSITION[position];
    if (!tile) return null;
    const tokens = tokensOnTile(position);
    return (
      <div className="relative h-full w-full min-h-0 min-w-0 bg-white">
        <BoardTile
          tile={tile}
          selected={selectedTile === position}
          onClick={() => onSelectTile(position)}
        />
        {tokens.map((p, i) => (
          <PlayerToken key={p.id} color={p.color} name={p.displayName} offset={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[720px] mx-auto">
      <div className="rounded-xl border-[4px] border-[#1B5E20] shadow-2xl shadow-[#1B5E20]/20 overflow-hidden">
        <div
          className="grid gap-px bg-[#1B5E20] aspect-square w-full"
          style={{ gridTemplateColumns: 'repeat(11, 1fr)', gridTemplateRows: 'repeat(11, 1fr)' }}
        >
          {BOARD_CELL_PLACEMENTS.map(({ position, col, row }) => (
            <div
              key={position}
              className="min-h-0 min-w-0"
              style={{ gridColumn: col, gridRow: row }}
            >
              <TileCell position={position} />
            </div>
          ))}

          {/* Ô giữa */}
          <div className="col-start-2 col-end-11 row-start-2 row-end-11 flex flex-col items-center justify-center min-h-0 bg-gradient-to-br from-[#1B5E20] via-[#256d29] to-[#145214]">
            <div className="text-center text-white px-3 flex flex-col items-center gap-2 sm:gap-3">
              <div className="text-2xl sm:text-3xl leading-none">🎩</div>
              <div className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-[#FFD700]">
                CỜ TỶ PHÚ
              </div>
              <DiceAnimation dice={dice} embedded />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

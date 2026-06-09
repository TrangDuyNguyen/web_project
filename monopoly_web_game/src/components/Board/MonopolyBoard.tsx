'use client';

import { BOARD_TILES } from '@/data/board';
import { BoardTile } from './BoardTile';
import { PlayerToken } from './PlayerToken';
import type { Player } from '@/types/game';

type Props = {
  players: Player[];
  selectedTile: number | null;
  onSelectTile: (position: number) => void;
};

export function MonopolyBoard({ players, selectedTile, onSelectTile }: Props) {
  const bottom = BOARD_TILES.filter((t) => t.position >= 0 && t.position <= 10).reverse();
  const left = BOARD_TILES.filter((t) => t.position > 10 && t.position <= 20).reverse();
  const top = BOARD_TILES.filter((t) => t.position > 20 && t.position <= 30);
  const right = BOARD_TILES.filter((t) => t.position > 30 && t.position <= 39).reverse();

  function tokensOnTile(position: number) {
    return players.filter((p) => !p.isBankrupt && p.position === position);
  }

  function TileCell({ tile }: { tile: typeof BOARD_TILES[0] }) {
    const tokens = tokensOnTile(tile.position);
    return (
      <div className="relative">
        <BoardTile
          tile={tile}
          selected={selectedTile === tile.position}
          onClick={() => onSelectTile(tile.position)}
        />
        {tokens.map((p, i) => (
          <PlayerToken key={p.id} color={p.color} name={p.displayName} offset={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[700px] mx-auto">
      <div className="grid gap-0" style={{ gridTemplateColumns: 'repeat(11, 1fr)', gridTemplateRows: 'repeat(11, 1fr)' }}>
        <div className="col-start-1 row-start-11"><TileCell tile={bottom[0]} /></div>
        {bottom.slice(1, -1).map((t) => (
          <div key={t.position} className="col-span-1 row-start-11" style={{ gridColumn: `${11 - (bottom.indexOf(t))} / span 1` }}>
            <TileCell tile={t} />
          </div>
        ))}
        <div className="col-start-11 row-start-11"><TileCell tile={bottom[bottom.length - 1]} /></div>

        {left.map((t, i) => (
          <div key={t.position} className="col-start-1" style={{ gridRow: `${10 - i} / span 1` }}>
            <TileCell tile={t} />
          </div>
        ))}

        <div className="col-start-2 col-end-11 row-start-2 row-end-11 flex items-center justify-center bg-[#1B5E20] text-white rounded-lg m-1">
          <div className="text-center">
            <div className="text-2xl font-bold">🎩</div>
            <div className="text-sm font-semibold">CỜ TỶ PHÚ</div>
          </div>
        </div>

        {right.map((t, i) => (
          <div key={t.position} className="col-start-11" style={{ gridRow: `${2 + i} / span 1` }}>
            <TileCell tile={t} />
          </div>
        ))}

        <div className="col-start-1 row-start-1"><TileCell tile={top[0]} /></div>
        {top.slice(1, -1).map((t, i) => (
          <div key={t.position} className="row-start-1" style={{ gridColumn: `${2 + i} / span 1` }}>
            <TileCell tile={t} />
          </div>
        ))}
        <div className="col-start-11 row-start-1"><TileCell tile={top[top.length - 1]} /></div>
      </div>
    </div>
  );
}

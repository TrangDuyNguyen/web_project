import type { BoardTile as BoardTileType } from '@/types/game';
import { PROPERTY_BY_ID } from '@/data/properties';

const GROUP_COLORS: Record<string, string> = {
  brown: '#8B4513',
  light_blue: '#87CEEB',
  pink: '#FF69B4',
  orange: '#FF8C00',
  red: '#DC143C',
  yellow: '#FFD700',
  green: '#228B22',
  dark_blue: '#00008B',
  railroad: '#333',
  utility: '#666',
};

type Props = {
  tile: BoardTileType;
  selected?: boolean;
  onClick?: () => void;
};

export function BoardTile({ tile, selected, onClick }: Props) {
  const prop = tile.propertyId ? PROPERTY_BY_ID[tile.propertyId] : null;
  const barColor = prop ? (GROUP_COLORS[prop.colorGroup] ?? '#ccc') : '#ccc';
  const isCorner = [0, 10, 20, 30].includes(tile.position);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-end h-full w-full p-0.5 sm:p-1 text-[7px] sm:text-[9px] bg-white transition-colors duration-150 hover:bg-[#fffef8] ${
        isCorner ? 'bg-[#faf8f3]' : ''
      } ${selected ? 'ring-2 ring-inset ring-[#FFD700] z-10 bg-[#fffde7]' : ''}`}
    >
      {prop && (
        <div
          className="absolute top-0 left-0 right-0 h-2 sm:h-2.5"
          style={{ backgroundColor: barColor }}
        />
      )}
      {tile.type === 'chance' && (
        <div className="absolute top-0.5 text-[9px] sm:text-[10px]">❓</div>
      )}
      {tile.type === 'community_chest' && (
        <div className="absolute top-0.5 text-[9px] sm:text-[10px]">📦</div>
      )}
      {tile.type === 'go' && (
        <div className="absolute top-0.5 text-[9px] sm:text-[10px]">→</div>
      )}
      {tile.type === 'jail' && (
        <div className="absolute top-0.5 text-[9px] sm:text-[10px]">🔒</div>
      )}
      <span className="text-center leading-tight font-semibold text-gray-800 px-0.5 mt-auto">
        {tile.name}
      </span>
      {prop && <span className="text-gray-500 font-medium mb-0.5">${prop.price}</span>}
      {tile.type === 'tax' && <span className="text-red-600 font-medium mb-0.5">${tile.taxAmount}</span>}
    </button>
  );
}

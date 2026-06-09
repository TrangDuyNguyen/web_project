import type { BoardTile as BoardTileType } from '@/types/game';
import { PROPERTY_BY_ID } from '@/data/properties';

const GROUP_COLORS: Record<string, string> = {
  brown: '#8B4513', light_blue: '#87CEEB', pink: '#FF69B4', orange: '#FF8C00',
  red: '#DC143C', yellow: '#FFD700', green: '#228B22', dark_blue: '#00008B',
  railroad: '#333', utility: '#666',
};

type Props = {
  tile: BoardTileType;
  selected?: boolean;
  onClick?: () => void;
};

export function BoardTile({ tile, selected, onClick }: Props) {
  const prop = tile.propertyId ? PROPERTY_BY_ID[tile.propertyId] : null;
  const barColor = prop ? GROUP_COLORS[prop.colorGroup] ?? '#ccc' : '#ccc';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-end p-1 text-[8px] sm:text-[10px] border border-gray-400 bg-white min-h-[48px] sm:min-h-[64px] ${selected ? 'ring-2 ring-[#FFD700]' : ''}`}
    >
      {prop && <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: barColor }} />}
      <span className="text-center leading-tight font-medium">{tile.name}</span>
      {prop && <span className="text-gray-500">${prop.price}</span>}
      {tile.type === 'tax' && <span className="text-red-600">${tile.taxAmount}</span>}
    </button>
  );
}

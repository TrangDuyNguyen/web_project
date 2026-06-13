import { TILE_BY_POSITION } from '@/data/board';
import { PROPERTY_BY_ID } from '@/data/properties';
import type { GameState } from '@/types/game';
import { Panel } from '@/components/ui/Panel';

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
  state: GameState;
  position: number | null;
};

export function PropertyPanel({ state, position }: Props) {
  if (position === null) return null;
  const tile = TILE_BY_POSITION[position];
  if (!tile) return null;

  const prop = tile.propertyId ? PROPERTY_BY_ID[tile.propertyId] : null;
  const ownerId = prop ? state.propertyOwners[prop.id] : undefined;
  const owner = ownerId ? state.players.find((p) => p.id === ownerId) : null;
  const barColor = prop ? (GROUP_COLORS[prop.colorGroup] ?? '#ccc') : undefined;

  return (
    <Panel title="Thông tin ô" icon="🏠" bodyClassName="space-y-3">
      {barColor && <div className="h-2 rounded-full" style={{ backgroundColor: barColor }} />}
      <h4 className="font-bold text-base text-gray-900">{tile.name}</h4>

      {prop && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <div className="text-xs text-gray-500">Giá mua</div>
            <div className="font-semibold text-gray-900">${prop.price}</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <div className="text-xs text-gray-500">Tiền thuê</div>
            <div className="font-semibold text-gray-900">${prop.rent}</div>
          </div>
          <div className="col-span-2 rounded-lg bg-gray-50 px-3 py-2">
            <div className="text-xs text-gray-500">Chủ sở hữu</div>
            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
              {owner ? (
                <>
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: owner.color }}
                  />
                  {owner.displayName}
                </>
              ) : (
                <span className="text-gray-400">Chưa có</span>
              )}
            </div>
          </div>
        </div>
      )}

      {tile.type === 'tax' && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm">
          <div className="text-xs text-red-500">Thuế</div>
          <div className="font-semibold text-red-700">${tile.taxAmount}</div>
        </div>
      )}

      {!prop && tile.type !== 'tax' && (
        <p className="text-sm text-gray-500">Ô đặc biệt — không thể mua.</p>
      )}
    </Panel>
  );
}

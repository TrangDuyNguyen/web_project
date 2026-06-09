import { TILE_BY_POSITION } from '@/data/board';
import { PROPERTY_BY_ID } from '@/data/properties';
import type { GameState } from '@/types/game';

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

  return (
    <div className="bg-white rounded-xl p-4 shadow-md text-sm space-y-1">
      <h3 className="font-semibold">{tile.name}</h3>
      {prop && (
        <>
          <p>Giá: ${prop.price}</p>
          <p>Thuê: ${prop.rent}</p>
          <p>Chủ: {owner?.displayName ?? 'Chưa có'}</p>
        </>
      )}
      {tile.type === 'tax' && <p>Thuế: ${tile.taxAmount}</p>}
    </div>
  );
}

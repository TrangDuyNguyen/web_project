'use client';

import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';
import { PROPERTY_BY_POSITION } from '@/data/properties';
import { TILE_BY_POSITION } from '@/data/board';

export function ActionBar() {
  const { gameState, userId, sendAction } = useGameStore();
  if (!gameState || gameState.gameStatus !== 'playing') return null;

  const current = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = current?.id === userId && current?.connection === 'online';

  const tile = current ? TILE_BY_POSITION[current.position] : null;
  const prop = tile?.propertyId ? PROPERTY_BY_POSITION[current.position] : null;

  return (
    <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#1B5E20]/10 shadow-[0_-4px_24px_rgba(27,94,32,0.08)] px-4 py-4">
      <div className="max-w-4xl mx-auto flex flex-wrap gap-2 justify-center items-center">
        {!isMyTurn && (
          <p className="text-sm text-gray-500 w-full text-center py-1">
            ⏳ Đang chờ <span className="font-semibold text-gray-700">{current?.displayName}</span>...
          </p>
        )}
        {isMyTurn && gameState.phase === 'waiting_for_roll' && (
          <Button
            onClick={() => sendAction({ type: 'roll_dice' })}
            className="px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-shadow"
          >
            🎲 Tung xúc xắc
          </Button>
        )}
        {isMyTurn && gameState.phase === 'buy_decision' && prop && (
          <>
            <Button
              onClick={() => sendAction({ type: 'buy_property' })}
              className="px-5 py-3 rounded-xl font-semibold shadow-md"
            >
              🏠 Mua ${prop.price}
            </Button>
            <Button
              variant="secondary"
              onClick={() => sendAction({ type: 'skip_buy' })}
              className="px-5 py-3 rounded-xl font-semibold"
            >
              Bỏ qua
            </Button>
          </>
        )}
        {isMyTurn && gameState.phase === 'jail_decision' && (
          <>
            <Button
              onClick={() => sendAction({ type: 'pay_jail_fine' })}
              className="px-4 py-3 rounded-xl font-semibold"
            >
              💵 Trả $50
            </Button>
            <Button
              variant="secondary"
              onClick={() => sendAction({ type: 'use_jail_card' })}
              className="px-4 py-3 rounded-xl font-semibold"
            >
              🎫 Dùng thẻ
            </Button>
            <Button
              variant="secondary"
              onClick={() => sendAction({ type: 'roll_for_doubles' })}
              className="px-4 py-3 rounded-xl font-semibold"
            >
              🎲 Tung đôi
            </Button>
          </>
        )}
        {userId === gameState.hostId && (
          <Button
            variant="danger"
            onClick={() => sendAction({ type: 'end_game' })}
            className="px-4 py-3 rounded-xl font-semibold opacity-90 hover:opacity-100"
          >
            Kết thúc ván
          </Button>
        )}
      </div>
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';
import { PROPERTY_BY_POSITION } from '@/data/properties';
import { TILE_BY_POSITION } from '@/data/board';

export function ActionBar() {
  const { gameState, guestId, sendAction } = useGameStore();
  if (!gameState || gameState.gameStatus !== 'playing') return null;

  const current = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = current?.id === guestId && current?.connection === 'online';

  const tile = current ? TILE_BY_POSITION[current.position] : null;
  const prop = tile?.propertyId ? PROPERTY_BY_POSITION[current.position] : null;

  return (
    <div className="sticky bottom-0 bg-white border-t p-4 flex flex-wrap gap-2 justify-center">
      {!isMyTurn && (
        <p className="text-sm text-gray-500 w-full text-center">
          Đang chờ {current?.displayName}...
        </p>
      )}
      {isMyTurn && gameState.phase === 'waiting_for_roll' && (
        <Button onClick={() => sendAction({ type: 'roll_dice' })}>🎲 Tung xúc xắc</Button>
      )}
      {isMyTurn && gameState.phase === 'buy_decision' && prop && (
        <>
          <Button onClick={() => sendAction({ type: 'buy_property' })}>Mua ${prop.price}</Button>
          <Button variant="secondary" onClick={() => sendAction({ type: 'skip_buy' })}>Bỏ qua</Button>
        </>
      )}
      {isMyTurn && gameState.phase === 'jail_decision' && (
        <>
          <Button onClick={() => sendAction({ type: 'pay_jail_fine' })}>Trả $50</Button>
          <Button variant="secondary" onClick={() => sendAction({ type: 'use_jail_card' })}>Dùng thẻ</Button>
          <Button variant="secondary" onClick={() => sendAction({ type: 'roll_for_doubles' })}>Tung đôi</Button>
        </>
      )}
      {guestId === gameState.hostId && (
        <Button variant="danger" onClick={() => sendAction({ type: 'end_game' })}>Kết thúc ván</Button>
      )}
    </div>
  );
}

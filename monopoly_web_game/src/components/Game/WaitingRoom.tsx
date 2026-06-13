'use client';

import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';
import { GameCard } from '@/components/ui/GameCard';

export function WaitingRoom() {
  const { gameState, userId, sendAction, addToast } = useGameStore();
  if (!gameState) return null;

  const isHost = userId === gameState.hostId;
  const canStart = gameState.players.length >= 2;

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/game/${gameState!.roomId}`);
    addToast('Đã copy link phòng!');
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <GameCard icon="⏳" title="Phòng chờ" subtitle={`Mã phòng: ${gameState.roomId}`}>
        <div className="flex items-center justify-between rounded-xl bg-[#1B5E20]/5 px-4 py-3">
          <div>
            <div className="text-xs text-gray-500">Người chơi</div>
            <div className="text-lg font-bold text-[#1B5E20]">
              {gameState.players.length}/{gameState.settings.maxPlayers}
            </div>
          </div>
          <Button variant="secondary" onClick={copyLink} className="rounded-xl text-sm">
            📋 Copy link
          </Button>
        </div>

        <div className="space-y-2">
          {gameState.players.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80"
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: p.color }}
              />
              <div className="flex-1">
                <span className="font-medium text-sm">{p.displayName}</span>
                {p.id === gameState.hostId && <span className="ml-1">👑</span>}
              </div>
              {i === 0 && isHost && <span className="text-xs text-gray-400">Bạn</span>}
            </div>
          ))}
        </div>

        {isHost && !canStart && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Cần ít nhất 2 người chơi. Mời bạn bè qua link hoặc phòng công khai.
          </p>
        )}
        {!isHost && (
          <p className="text-sm text-gray-500 text-center py-2">Đang chờ host bắt đầu game...</p>
        )}
        {isHost && (
          <Button
            className="w-full mt-auto py-3 rounded-xl font-semibold"
            disabled={!canStart}
            onClick={() => sendAction({ type: 'start_game' })}
          >
            {canStart ? '🎲 Bắt đầu game' : 'Chờ thêm người chơi...'}
          </Button>
        )}
      </GameCard>
    </div>
  );
}

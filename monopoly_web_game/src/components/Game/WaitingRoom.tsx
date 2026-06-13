'use client';

import { Button } from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';
import { PlayerList } from '@/components/Player/PlayerList';

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
    <div className="max-w-md mx-auto bg-white rounded-xl p-6 shadow-md space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Phòng chờ</h2>
        <Button variant="secondary" onClick={copyLink}>📋 Copy link</Button>
      </div>
      <p className="text-sm text-gray-600">Đang chờ người chơi... ({gameState.players.length}/{gameState.settings.maxPlayers})</p>
      <PlayerList state={gameState} />
      {isHost && !canStart && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          Cần ít nhất 2 người chơi để bắt đầu. Mời bạn bè qua link hoặc phòng công khai.
        </p>
      )}
      {!isHost && (
        <p className="text-sm text-gray-500 text-center">Đang chờ host bắt đầu game...</p>
      )}
      {isHost && (
        <Button
          className="w-full"
          disabled={!canStart}
          onClick={() => sendAction({ type: 'start_game' })}
        >
          Bắt đầu game
        </Button>
      )}
    </div>
  );
}

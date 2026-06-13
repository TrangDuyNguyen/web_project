'use client';

import { use, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { usePartySocket } from '@/hooks/usePartySocket';
import { useGameStore } from '@/store/gameStore';
import { MonopolyBoard } from '@/components/Board/MonopolyBoard';
import { PlayerList } from '@/components/Player/PlayerList';
import { PropertyPanel } from '@/components/Property/PropertyPanel';
import { WaitingRoom } from '@/components/Game/WaitingRoom';
import { ActionBar } from '@/components/Game/ActionBar';
import { EventLog } from '@/components/Game/EventLog';
import { ConnectionStatus } from '@/components/Game/ConnectionStatus';
import { GameOverModal } from '@/components/Modal/GameOverModal';
import { ToastContainer } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { FieldLabel, GameCard, inputClassName } from '@/components/ui/GameCard';
import { BoardPattern } from '@/components/ui/BoardPattern';
import { PLAYER_COLORS } from '@/game/rules/constants';

type Props = { params: Promise<{ roomId: string }> };

export default function GamePageClient({ params }: Props) {
  const { roomId } = use(params);
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isHost = searchParams.get('isHost') === 'true';
  const { gameState, selectedTile, selectTile } = useGameStore();

  const defaultName = searchParams.get('name') ?? session?.user?.name ?? 'Khách';
  const defaultColor = searchParams.get('color') ?? PLAYER_COLORS[0];

  const [displayName, setDisplayName] = useState(defaultName);
  const [color, setColor] = useState(defaultColor);
  const [joined, setJoined] = useState(false);

  usePartySocket(
    joined && session?.user?.id
      ? {
          roomId,
          userId: session.user.id,
          displayName: displayName.trim(),
          color,
          isHost,
        }
      : null
  );

  if (!joined) {
    return (
      <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-10">
        <BoardPattern />
        <div className="relative w-full max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (displayName.trim()) setJoined(true);
            }}
          >
            <GameCard icon="🚪" title="Vào phòng" subtitle={`Mã phòng: ${roomId}`}>
              <div>
                <FieldLabel>Tên hiển thị</FieldLabel>
                <input
                  className={inputClassName}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tên của bạn trong ván"
                  required
                />
              </div>
              <ColorPicker colors={PLAYER_COLORS} value={color} onChange={setColor} />
              <Button
                type="submit"
                className="w-full mt-auto py-3 rounded-xl font-semibold"
                disabled={!displayName.trim()}
              >
                Vào phòng →
              </Button>
            </GameCard>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-28 min-h-[calc(100vh-3.5rem)]">
      <ConnectionStatus />
      <ToastContainer />

      {!gameState && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-2 border-[#1B5E20] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Đang kết nối phòng {roomId}...</p>
        </div>
      )}

      {gameState?.gameStatus === 'waiting' && <WaitingRoom />}

      {gameState?.gameStatus === 'playing' && (
        <div className="relative">
          <BoardPattern />
          <div className="relative max-w-7xl mx-auto px-4 py-5 lg:py-6">
            {/* Room header */}
            <div className="flex items-center justify-between mb-4 lg:mb-5">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Phòng {gameState.roomId}</h1>
                <p className="text-xs text-gray-500">
                  Lượt:{' '}
                  <span className="font-medium text-[#1B5E20]">
                    {gameState.players[gameState.currentPlayerIndex]?.displayName}
                  </span>
                </p>
              </div>
              <div className="text-xs font-mono bg-white/80 border border-[#1B5E20]/10 rounded-lg px-3 py-1.5 text-gray-500">
                Vòng {gameState.currentRound}
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-5 lg:gap-6 items-start">
              <MonopolyBoard
                players={gameState.players}
                selectedTile={selectedTile}
                onSelectTile={selectTile}
                dice={gameState.dice}
              />
              <aside className="space-y-4 lg:sticky lg:top-4">
                <PlayerList state={gameState} />
                <PropertyPanel
                  state={gameState}
                  position={
                    selectedTile ?? gameState.players[gameState.currentPlayerIndex]?.position ?? null
                  }
                />
                <EventLog />
              </aside>
            </div>
          </div>
        </div>
      )}

      {gameState?.gameStatus === 'finished' && <GameOverModal state={gameState} />}
      <ActionBar />
    </div>
  );
}

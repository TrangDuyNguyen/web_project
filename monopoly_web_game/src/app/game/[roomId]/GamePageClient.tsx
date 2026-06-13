'use client';

import { use, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { usePartySocket } from '@/hooks/usePartySocket';
import { useGameStore } from '@/store/gameStore';
import { MonopolyBoard } from '@/components/Board/MonopolyBoard';
import { DiceAnimation } from '@/components/Dice/DiceAnimation';
import { PlayerList } from '@/components/Player/PlayerList';
import { PropertyPanel } from '@/components/Property/PropertyPanel';
import { WaitingRoom } from '@/components/Game/WaitingRoom';
import { ActionBar } from '@/components/Game/ActionBar';
import { EventLog } from '@/components/Game/EventLog';
import { ConnectionStatus } from '@/components/Game/ConnectionStatus';
import { GameOverModal } from '@/components/Modal/GameOverModal';
import { ToastContainer } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
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
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-xl p-6 shadow-md space-y-4">
          <h2 className="text-lg font-semibold">Chuẩn bị vào phòng {roomId}</h2>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Tên hiển thị"
          />
          <div className="flex gap-2">
            {PLAYER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-black' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <Button className="w-full" onClick={() => setJoined(true)} disabled={!displayName.trim()}>
            Vào phòng
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <ConnectionStatus />
      <ToastContainer />

      {!gameState && (
        <div className="text-center py-20 text-gray-500">Đang kết nối phòng...</div>
      )}

      {gameState?.gameStatus === 'waiting' && <WaitingRoom />}

      {gameState?.gameStatus === 'playing' && (
        <div className="max-w-6xl mx-auto px-4 py-4 grid lg:grid-cols-[1fr_300px] gap-4">
          <div className="space-y-4 overflow-x-auto">
            <MonopolyBoard
              players={gameState.players}
              selectedTile={selectedTile}
              onSelectTile={selectTile}
            />
            <div className="flex justify-center">
              <DiceAnimation dice={gameState.dice} />
            </div>
          </div>
          <aside className="space-y-4">
            <PlayerList state={gameState} />
            <PropertyPanel state={gameState} position={selectedTile ?? gameState.players[gameState.currentPlayerIndex]?.position ?? null} />
            <EventLog />
          </aside>
        </div>
      )}

      {gameState?.gameStatus === 'finished' && <GameOverModal state={gameState} />}
      <ActionBar />
    </div>
  );
}

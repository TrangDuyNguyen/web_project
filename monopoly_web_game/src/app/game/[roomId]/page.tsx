'use client';

import { use, useMemo } from 'react';
import { useGuestId } from '@/hooks/useGuestId';
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
import { PLAYER_COLORS } from '@/game/rules/constants';

type Props = { params: Promise<{ roomId: string }> };

export default function GamePage({ params }: Props) {
  const { roomId } = use(params);
  const guestId = useGuestId();
  const { gameState, selectedTile, selectTile } = useGameStore();

  const session = useMemo(() => {
    if (typeof window === 'undefined' || !guestId) return null;
    const stored = sessionStorage.getItem(`room_${roomId}`);
    if (stored) return JSON.parse(stored);
    const joinStored = sessionStorage.getItem(`join_${roomId}`);
    if (joinStored) return JSON.parse(joinStored);
    return { displayName: 'Khách', color: PLAYER_COLORS[0], visibility: 'private' };
  }, [roomId, guestId]);

  usePartySocket(
    guestId && session
      ? {
          roomId,
          guestId,
          displayName: session.displayName,
          color: session.color,
          hostId: session.hostId ?? guestId,
          visibility: session.visibility,
          maxPlayers: 4,
          roundLimit: session.roundLimit,
          roomCode: session.roomCode,
        }
      : null
  );

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

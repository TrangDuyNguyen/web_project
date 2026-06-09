'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { ServerMessage } from '@/types/room';

type ConnectOptions = {
  roomId: string;
  guestId: string;
  displayName: string;
  color: string;
  hostId?: string;
  visibility?: string;
  maxPlayers?: number;
  roundLimit?: number;
  roomCode?: string;
};

export function usePartySocket(options: ConnectOptions | null) {
  const { setGameState, setConnectionStatus, setSocket, addToast, setGuestId } = useGameStore();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!options?.guestId) return;

    setGuestId(options.guestId);
    setConnectionStatus('connecting');

    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
    const protocol = host.startsWith('localhost') ? 'ws' : 'wss';
    const params = new URLSearchParams({
      guestId: options.guestId,
      displayName: options.displayName,
      color: options.color,
      hostId: options.hostId ?? options.guestId,
      visibility: options.visibility ?? 'private',
      maxPlayers: String(options.maxPlayers ?? 4),
      ...(options.roundLimit ? { roundLimit: String(options.roundLimit) } : {}),
      ...(options.roomCode ? { roomCode: options.roomCode } : {}),
    });

    const ws = new WebSocket(`${protocol}://${host}/parties/game/${options.roomId}?${params}`);
    wsRef.current = ws;
    setSocket(ws);

    ws.onopen = () => setConnectionStatus('connected');
    ws.onclose = () => setConnectionStatus('disconnected');
    ws.onerror = () => addToast('Lỗi kết nối', 'error');
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage;
      if (msg.type === 'state_sync' && msg.state) setGameState(msg.state);
      if (msg.type === 'error') addToast(msg.message, 'error');
    };

    return () => {
      ws.close();
      setSocket(null);
    };
  }, [options?.roomId, options?.guestId, options?.displayName, options?.color]);

  return wsRef;
}

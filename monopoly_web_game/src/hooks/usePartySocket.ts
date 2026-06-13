'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { ServerMessage } from '@/types/room';

export type ConnectOptions = {
  roomId: string;
  userId: string;
  displayName: string;
  color: string;
  isHost?: boolean;
};

const MAX_RECONNECTS = 15;
const RECONNECT_DELAY_MS = 2000;

async function fetchToken(options: ConnectOptions): Promise<string> {
  const res = await fetch('/api/game-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: options.roomId,
      displayName: options.displayName,
      color: options.color,
      isHost: options.isHost,
    }),
  });
  if (!res.ok) throw new Error('Failed to mint game token');
  const data = await res.json();
  return data.token as string;
}

export function usePartySocket(options: ConnectOptions | null) {
  const { setGameState, setConnectionStatus, setSocket, addToast, setUserId } = useGameStore();
  const wsRef = useRef<WebSocket | null>(null);
  const optionsRef = useRef(options);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const intentionalCloseRef = useRef(false);

  optionsRef.current = options;

  useEffect(() => {
    if (!options?.userId) return;

    intentionalCloseRef.current = false;
    reconnectCountRef.current = 0;

    async function connect() {
      const current = optionsRef.current;
      if (!current?.userId) return;

      setUserId(current.userId);
      setConnectionStatus('connecting');

      try {
        const token = await fetchToken(current);
        const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
        const protocol = host.startsWith('localhost') ? 'ws' : 'wss';
        const ws = new WebSocket(
          `${protocol}://${host}/parties/game/${current.roomId}?token=${encodeURIComponent(token)}`
        );
        wsRef.current = ws;
        setSocket(ws);

        ws.onopen = () => {
          reconnectCountRef.current = 0;
          setConnectionStatus('connected');
        };
        ws.onclose = () => {
          setConnectionStatus('disconnected');
          setSocket(null);
          if (intentionalCloseRef.current || reconnectCountRef.current >= MAX_RECONNECTS) return;
          reconnectCountRef.current += 1;
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        };
        ws.onerror = () => addToast('Lỗi kết nối', 'error');
        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data) as ServerMessage;
          if (msg.type === 'state_sync' && msg.state) setGameState(msg.state);
          if (msg.type === 'error') addToast(msg.message, 'error');
        };
      } catch {
        addToast('Không thể kết nối phòng', 'error');
        setConnectionStatus('disconnected');
      }
    }

    connect();

    return () => {
      intentionalCloseRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      setSocket(null);
    };
  }, [options?.roomId, options?.userId, options?.displayName, options?.color, options?.isHost]);

  return wsRef;
}

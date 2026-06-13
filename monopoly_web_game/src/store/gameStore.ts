import { create } from 'zustand';
import type { GameState } from '@/types/game';
import type { ClientMessage } from '@/types/room';

type Toast = { id: string; message: string; type: 'error' | 'info' };

type GameStore = {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  userId: string;
  roomId: string | null;
  gameState: GameState | null;
  selectedTile: number | null;
  isEventLogExpanded: boolean;
  toasts: Toast[];
  socket: WebSocket | null;
  setUserId: (id: string) => void;
  setConnectionStatus: (s: GameStore['connectionStatus']) => void;
  setGameState: (state: GameState) => void;
  setSocket: (ws: WebSocket | null) => void;
  selectTile: (position: number | null) => void;
  toggleEventLog: () => void;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  sendAction: (action: ClientMessage) => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  connectionStatus: 'disconnected',
  userId: '',
  roomId: null,
  gameState: null,
  selectedTile: null,
  isEventLogExpanded: false,
  toasts: [],
  socket: null,
  setUserId: (id) => set({ userId: id }),
  setConnectionStatus: (s) => set({ connectionStatus: s }),
  setGameState: (state) => set({ gameState: state }),
  setSocket: (ws) => set({ socket: ws }),
  selectTile: (position) => set({ selectedTile: position }),
  toggleEventLog: () => set((s) => ({ isEventLogExpanded: !s.isEventLogExpanded })),
  addToast: (message, type = 'info') =>
    set((s) => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), message, type }] })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  sendAction: (action) => {
    const ws = get().socket;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(action));
      return;
    }
    get().addToast('Mất kết nối — vui lòng tải lại trang', 'error');
  },
}));

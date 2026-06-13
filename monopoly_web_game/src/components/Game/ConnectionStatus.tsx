'use client';

import { useGameStore } from '@/store/gameStore';

export function ConnectionStatus() {
  const { connectionStatus } = useGameStore();
  if (connectionStatus === 'connected') return null;

  return (
    <div
      className={`text-center py-2.5 text-sm font-medium ${
        connectionStatus === 'connecting'
          ? 'bg-blue-50 text-blue-700 border-b border-blue-100'
          : 'bg-amber-50 text-amber-800 border-b border-amber-100'
      }`}
    >
      {connectionStatus === 'connecting'
        ? '🔄 Đang kết nối phòng...'
        : '⚠️ Mất kết nối — đang thử kết nối lại...'}
    </div>
  );
}

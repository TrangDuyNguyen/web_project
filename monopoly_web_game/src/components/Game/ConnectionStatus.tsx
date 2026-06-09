'use client';

import { useGameStore } from '@/store/gameStore';

export function ConnectionStatus() {
  const { connectionStatus } = useGameStore();
  if (connectionStatus === 'connected') return null;

  return (
    <div className={`text-center py-2 text-sm ${connectionStatus === 'connecting' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
      {connectionStatus === 'connecting' ? 'Đang kết nối...' : 'Mất kết nối — đang thử kết nối lại...'}
    </div>
  );
}

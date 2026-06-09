'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export function ToastContainer() {
  const { toasts, removeToast } = useGameStore();

  return (
    <div className="fixed top-16 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ message, type, onClose }: { message: string; type: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`px-4 py-2 rounded-lg shadow text-sm text-white ${type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}>
      {message}
    </div>
  );
}

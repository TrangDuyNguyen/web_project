'use client';

import { useGameStore } from '@/store/gameStore';

export function EventLog() {
  const { gameState, isEventLogExpanded, toggleEventLog } = useGameStore();
  if (!gameState) return null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-md">
      <button type="button" className="font-semibold text-sm w-full text-left" onClick={toggleEventLog}>
        Nhật ký {isEventLogExpanded ? '▼' : '▶'}
      </button>
      {isEventLogExpanded && (
        <ul className="mt-2 max-h-40 overflow-y-auto space-y-1 text-xs text-gray-700">
          {[...gameState.eventLog].reverse().map((e) => (
            <li key={e.id}>{e.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

'use client';

import { useGameStore } from '@/store/gameStore';
import { Panel } from '@/components/ui/Panel';

export function EventLog() {
  const { gameState, isEventLogExpanded, toggleEventLog } = useGameStore();
  if (!gameState) return null;

  const events = [...gameState.eventLog].reverse();

  return (
    <Panel
      title="Nhật ký"
      icon="📜"
      bodyClassName="!p-0"
    >
      <button
        type="button"
        className="w-full px-4 py-2.5 text-left text-xs text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-between"
        onClick={toggleEventLog}
      >
        <span>{events.length} sự kiện</span>
        <span>{isEventLogExpanded ? '▼ Thu gọn' : '▶ Mở rộng'}</span>
      </button>
      {isEventLogExpanded && (
        <ul className="px-4 pb-4 max-h-44 overflow-y-auto space-y-2 border-t border-gray-100 pt-3">
          {events.length === 0 ? (
            <li className="text-xs text-gray-400 text-center py-2">Chưa có sự kiện</li>
          ) : (
            events.map((e) => (
              <li
                key={e.id}
                className="text-xs text-gray-700 leading-relaxed pl-3 border-l-2 border-[#1B5E20]/30"
              >
                {e.message}
              </li>
            ))
          )}
        </ul>
      )}
    </Panel>
  );
}

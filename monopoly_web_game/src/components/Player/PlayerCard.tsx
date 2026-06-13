import type { Player } from '@/types/game';
import { formatMoney } from '@/utils/formatMoney';

type Props = {
  player: Player;
  isCurrent?: boolean;
  isHost?: boolean;
};

export function PlayerCard({ player, isCurrent, isHost }: Props) {
  const statusLabel =
    player.connection === 'bot'
      ? '🤖 Bot'
      : player.connection === 'disconnected'
        ? '⚠️ Mất kết nối'
        : null;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
        isCurrent
          ? 'bg-gradient-to-r from-[#FFD700]/25 to-[#FFD700]/10 ring-2 ring-[#FFD700]/60 shadow-sm'
          : 'bg-gray-50/80 hover:bg-gray-50'
      }`}
    >
      <div
        className="w-9 h-9 rounded-full shrink-0 border-2 border-white shadow-md ring-1 ring-black/10 flex items-center justify-center text-xs font-bold text-white"
        style={{ backgroundColor: player.color }}
      >
        {player.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate text-gray-900 flex items-center gap-1">
          {player.displayName}
          {isHost && <span title="Host">👑</span>}
          {isCurrent && <span title="Đang chơi">▶</span>}
        </div>
        <div className="text-xs font-medium text-[#1B5E20] mt-0.5">{formatMoney(player.money)}</div>
      </div>
      {statusLabel && (
        <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded-full border">
          {statusLabel}
        </span>
      )}
    </div>
  );
}

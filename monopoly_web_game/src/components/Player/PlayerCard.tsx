import type { Player } from '@/types/game';
import { formatMoney } from '@/utils/formatMoney';

type Props = {
  player: Player;
  isCurrent?: boolean;
  isHost?: boolean;
};

export function PlayerCard({ player, isCurrent, isHost }: Props) {
  const statusLabel =
    player.connection === 'bot' ? '🤖 Bot' :
    player.connection === 'disconnected' ? '⚠️ Mất kết nối' : '';

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${isCurrent ? 'bg-[#FFD700]/30 ring-1 ring-[#FFD700]' : 'bg-white'}`}>
      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: player.color }} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {player.displayName} {isHost && '👑'} {isCurrent && '▶'}
        </div>
        <div className="text-xs text-gray-600">{formatMoney(player.money)}</div>
      </div>
      {statusLabel && <span className="text-xs text-gray-500">{statusLabel}</span>}
    </div>
  );
}

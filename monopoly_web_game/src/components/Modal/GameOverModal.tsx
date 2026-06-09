'use client';

import { calculateRankings } from '@/game/engine/win';
import type { GameState } from '@/types/game';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

type Props = { state: GameState };

export function GameOverModal({ state }: Props) {
  const rankings = calculateRankings(state.players);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4">
        <h2 className="text-xl font-bold text-center">🎉 Kết thúc ván!</h2>
        <ol className="space-y-2">
          {rankings.map((r) => (
            <li key={r.playerId} className="flex justify-between text-sm">
              <span>#{r.rank} {r.displayName}</span>
              <span className="font-medium">${r.totalAssets}</span>
            </li>
          ))}
        </ol>
        <Link href="/"><Button className="w-full">Về trang chủ</Button></Link>
      </div>
    </div>
  );
}

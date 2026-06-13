'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { FieldLabel, GameCard, inputClassName } from '@/components/ui/GameCard';
import { PLAYER_COLORS } from '@/game/rules/constants';

export function JoinRoomForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [color, setColor] = useState<string>(PLAYER_COLORS[1]);

  useEffect(() => {
    if (session?.user?.name && !displayName) {
      setDisplayName(session.user.name);
    }
  }, [session?.user?.name, displayName]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomCode.trim() || !displayName.trim()) return;
    const code = roomCode.toUpperCase();
    const params = new URLSearchParams({ name: displayName.trim(), color });
    router.push(`/game/${code}?${params}`);
  }

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <GameCard icon="🚪" title="Vào phòng" subtitle="Nhập mã phòng từ bạn bè">
        <div>
          <FieldLabel>Mã phòng</FieldLabel>
          <input
            className={`${inputClassName} uppercase tracking-[0.2em] font-mono text-center text-base`}
            placeholder="ABC123"
            maxLength={6}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            required
          />
        </div>

        <div>
          <FieldLabel>Tên hiển thị</FieldLabel>
          <input
            className={inputClassName}
            placeholder="Tên của bạn trong ván"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <ColorPicker colors={PLAYER_COLORS} value={color} onChange={setColor} />

        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 px-4 py-3 text-xs text-gray-500 text-center">
          Hỏi host lấy mã 6 ký tự để tham gia
        </div>

        <Button type="submit" className="w-full mt-auto py-3 rounded-xl font-semibold">
          Tham gia phòng →
        </Button>
      </GameCard>
    </form>
  );
}

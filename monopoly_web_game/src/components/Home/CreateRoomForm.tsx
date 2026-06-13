'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { FieldLabel, GameCard, inputClassName } from '@/components/ui/GameCard';
import { PLAYER_COLORS } from '@/game/rules/constants';

export function CreateRoomForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [displayName, setDisplayName] = useState('');
  const [color, setColor] = useState<string>(PLAYER_COLORS[0]);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [useRoundLimit, setUseRoundLimit] = useState(false);
  const [roundLimit, setRoundLimit] = useState(20);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.name && !displayName) {
      setDisplayName(session.user.name);
    }
  }, [session?.user?.name, displayName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setLoading(true);
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visibility,
        maxPlayers: 4,
        roundLimit: useRoundLimit ? roundLimit : undefined,
      }),
    });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    const params = new URLSearchParams({
      isHost: 'true',
      name: displayName.trim(),
      color,
    });
    router.push(`/game/${data.roomId}?${params}`);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <GameCard icon="🏠" title="Tạo phòng" subtitle="Mời bạn bè vào phòng mới">
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

        <div>
          <FieldLabel>Loại phòng</FieldLabel>
          <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                visibility === 'private'
                  ? 'bg-white shadow-sm text-[#1B5E20]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🔒 Riêng tư
            </button>
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                visibility === 'public'
                  ? 'bg-white shadow-sm text-[#1B5E20]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🌐 Công khai
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useRoundLimit}
              onChange={(e) => setUseRoundLimit(e.target.checked)}
              className="rounded border-gray-300 text-[#1B5E20] focus:ring-[#1B5E20]"
            />
            <span className="font-medium text-gray-700">Giới hạn số vòng</span>
          </label>
          {useRoundLimit && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={100}
                value={roundLimit}
                onChange={(e) => setRoundLimit(Number(e.target.value))}
                className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/25"
              />
              <span className="text-sm text-gray-500">vòng</span>
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-auto py-3 rounded-xl font-semibold">
          {loading ? 'Đang tạo phòng...' : 'Tạo phòng →'}
        </Button>
      </GameCard>
    </form>
  );
}

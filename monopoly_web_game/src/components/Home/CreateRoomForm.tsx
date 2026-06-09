'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PLAYER_COLORS } from '@/game/rules/constants';
import { useGuestId } from '@/hooks/useGuestId';

export function CreateRoomForm() {
  const router = useRouter();
  const guestId = useGuestId();
  const [displayName, setDisplayName] = useState('');
  const [color, setColor] = useState<string>(PLAYER_COLORS[0]);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [useRoundLimit, setUseRoundLimit] = useState(false);
  const [roundLimit, setRoundLimit] = useState(20);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !guestId) return;
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
    const data = await res.json();
    sessionStorage.setItem(`room_${data.roomId}`, JSON.stringify({ displayName, color, roomCode: data.roomCode, visibility, roundLimit: useRoundLimit ? roundLimit : undefined }));
    router.push(`/game/${data.roomId}`);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-md space-y-4">
      <h2 className="text-lg font-semibold">Tạo phòng</h2>
      <input
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Tên của bạn"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
      />
      <div className="flex gap-2">
        {PLAYER_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-black' : 'border-transparent'}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input type="radio" checked={visibility === 'private'} onChange={() => setVisibility('private')} />
          Riêng
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={visibility === 'public'} onChange={() => setVisibility('public')} />
          Công khai
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={useRoundLimit} onChange={(e) => setUseRoundLimit(e.target.checked)} />
        Giới hạn vòng
        {useRoundLimit && (
          <input type="number" min={5} max={100} value={roundLimit} onChange={(e) => setRoundLimit(Number(e.target.value))} className="w-16 border rounded px-2" />
        )}
      </label>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Đang tạo...' : 'Tạo phòng'}
      </Button>
    </form>
  );
}

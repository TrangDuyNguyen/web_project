'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-md space-y-4">
      <h2 className="text-lg font-semibold">Vào phòng</h2>
      <input
        className="w-full border rounded-lg px-3 py-2 uppercase"
        placeholder="Mã phòng (6 ký tự)"
        maxLength={6}
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
        required
      />
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
      <Button type="submit" className="w-full">Tham gia</Button>
    </form>
  );
}

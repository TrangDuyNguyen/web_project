'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import type { RoomSummary } from '@/types/room';
import { PLAYER_COLORS } from '@/game/rules/constants';

export default function LobbyPage() {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
    const protocol = host.startsWith('localhost') ? 'ws' : 'wss';
    const ws = new WebSocket(`${protocol}://${host}/parties/lobby/lobby`);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'lobby_sync') setRooms(msg.rooms);
    };
    return () => ws.close();
  }, []);

  function joinRoom(roomId: string) {
    const name = session?.user?.name ?? prompt('Nhập tên của bạn:') ?? 'Khách';
    const params = new URLSearchParams({ name, color: PLAYER_COLORS[2] });
    router.push(`/game/${roomId}?${params}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Phòng công khai</h1>
        <Link href="/" className="text-sm text-[#1B5E20] hover:underline">← Trang chủ</Link>
      </div>
      <p className="text-sm text-gray-600">Đang chờ người chơi ({rooms.length})</p>
      {rooms.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Chưa có phòng nào. Hãy tạo phòng công khai!</p>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div key={room.roomId} className="bg-white rounded-xl p-4 shadow flex justify-between items-center">
              <div>
                <p className="font-medium">Phòng của {room.hostName}</p>
                <p className="text-sm text-gray-500">{room.playerCount}/{room.maxPlayers} người</p>
              </div>
              <Button onClick={() => joinRoom(room.roomId)}>Vào</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

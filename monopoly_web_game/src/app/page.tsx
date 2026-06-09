import Link from 'next/link';
import { CreateRoomForm } from '@/components/Home/CreateRoomForm';
import { JoinRoomForm } from '@/components/Home/JoinRoomForm';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Chơi Cờ Tỷ Phú Online</h1>
        <p className="text-gray-600">Cùng bạn bè, mọi nơi — 2 đến 4 người chơi</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <CreateRoomForm />
        <JoinRoomForm />
      </div>
      <div className="text-center">
        <Link href="/lobby" className="text-[#1B5E20] font-medium hover:underline">
          Xem phòng công khai →
        </Link>
      </div>
    </div>
  );
}

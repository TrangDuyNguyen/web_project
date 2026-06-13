import Link from 'next/link';
import { CreateRoomForm } from '@/components/Home/CreateRoomForm';
import { JoinRoomForm } from '@/components/Home/JoinRoomForm';
import { BoardPattern } from '@/components/ui/BoardPattern';

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      <BoardPattern />

      <div className="relative max-w-5xl mx-auto px-4 py-10 md:py-14">
        {/* Hero */}
        <div className="text-center mb-10 md:mb-12 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1B5E20]/10 text-3xl ring-2 ring-[#FFD700]/50">
            🎩
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            Chơi Cờ Tỷ Phú Online
          </h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Cùng bạn bè, mọi nơi — 2 đến 4 người chơi realtime
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <CreateRoomForm />
          <JoinRoomForm />
        </div>

        {/* Footer links */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <Link
            href="/lobby"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B5E20] hover:text-[#2E7D32] transition-colors"
          >
            <span aria-hidden>🌐</span>
            Xem phòng công khai
            <span aria-hidden>→</span>
          </Link>
          <span className="hidden sm:block text-gray-300">|</span>
          <Link
            href="/rules"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#1B5E20] transition-colors"
          >
            <span aria-hidden>📖</span>
            Luật chơi
          </Link>
        </div>
      </div>
    </div>
  );
}

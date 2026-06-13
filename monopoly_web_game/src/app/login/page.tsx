import Link from 'next/link';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { BoardPattern } from '@/components/ui/BoardPattern';

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-10">
      <BoardPattern />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl shadow-[#1B5E20]/10 border border-[#1B5E20]/10 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] px-8 pt-10 pb-8 text-center text-white">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-[#FFD700]" />
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm text-4xl mb-4 ring-2 ring-[#FFD700]/40">
              🎩
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Cờ Tỷ Phú Online</h1>
            <p className="mt-2 text-sm text-white/75">
              Mua đất, xây nhà, trở thành tỷ phú cùng bạn bè
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">Đăng nhập để chơi</h2>
              <p className="text-sm text-gray-500">Chọn tài khoản của bạn</p>
            </div>

            <OAuthButtons callbackUrl={callbackUrl ?? '/'} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">2–4 người chơi · Realtime</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              Chưa có tài khoản?{' '}
              <span className="text-gray-700">Đăng nhập bằng Google, GitHub hoặc Facebook.</span>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center">
          <Link
            href="/rules"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B5E20] hover:text-[#2E7D32] transition-colors"
          >
            <span aria-hidden>📖</span>
            Xem luật chơi trước khi bắt đầu
          </Link>
        </p>

        {/* Decorative dice */}
        <div className="absolute -left-6 top-1/3 hidden sm:flex flex-col gap-2 opacity-80 pointer-events-none">
          <span className="text-3xl rotate-[-12deg]">🎲</span>
          <span className="text-2xl rotate-[8deg] ml-3">🎲</span>
        </div>
        <div className="absolute -right-4 bottom-1/4 hidden sm:block text-3xl rotate-[15deg] opacity-80 pointer-events-none">
          💰
        </div>
      </div>
    </div>
  );
}

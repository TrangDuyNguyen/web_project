import Link from 'next/link';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-xl p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">🎩 Cờ Tỷ Phú Online</h1>
          <p className="text-gray-600">Đăng nhập để chơi</p>
        </div>
        <OAuthButtons callbackUrl={callbackUrl ?? '/'} />
        <p className="text-center text-sm">
          <Link href="/rules" className="text-[#1B5E20] hover:underline">
            ← Xem luật chơi
          </Link>
        </p>
      </div>
    </div>
  );
}

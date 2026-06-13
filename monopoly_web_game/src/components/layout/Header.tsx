'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#1B5E20] text-white">
      <Link href="/" className="text-xl font-bold">
        🎩 Cờ Tỷ Phú Online
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/lobby">Phòng công khai</Link>
        <Link href="/rules">Luật chơi</Link>
        {session?.user && (
          <div className="flex items-center gap-2">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
            )}
            <span className="hidden sm:inline max-w-[120px] truncate">{session.user.name}</span>
            <Button
              variant="secondary"
              className="text-xs py-1 px-2 text-gray-800"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Đăng xuất
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}

import Link from 'next/link';

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[#1B5E20] text-white">
      <Link href="/" className="text-xl font-bold">
        🎩 Cờ Tỷ Phú Online
      </Link>
      <nav className="flex gap-4 text-sm">
        <Link href="/lobby">Phòng công khai</Link>
        <Link href="/rules">Luật chơi</Link>
      </nav>
    </header>
  );
}

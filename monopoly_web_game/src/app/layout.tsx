import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'Cờ Tỷ Phú Online',
  description: 'Chơi Cờ Tỷ Phú online cùng bạn bè',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}

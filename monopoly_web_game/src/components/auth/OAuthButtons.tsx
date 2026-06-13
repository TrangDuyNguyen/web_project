'use client';

import { signIn } from 'next-auth/react';

type Props = { callbackUrl?: string };

export function OAuthButtons({ callbackUrl = '/' }: Props) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl })}
        className="w-full flex items-center justify-center gap-2 bg-white border rounded-lg px-4 py-3 font-medium hover:bg-gray-50"
      >
        🔵 Tiếp tục với Google
      </button>
      <button
        type="button"
        onClick={() => signIn('github', { callbackUrl })}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800"
      >
        ⚫ Tiếp tục với GitHub
      </button>
      <button
        type="button"
        onClick={() => signIn('facebook', { callbackUrl })}
        className="w-full flex items-center justify-center gap-2 bg-[#1877F2] text-white rounded-lg px-4 py-3 font-medium hover:bg-[#166FE5]"
      >
        🔵 Tiếp tục với Facebook
      </button>
    </div>
  );
}

import { auth } from '@/auth';
import { mintGameToken, isValidDisplayName, isValidColor } from '@/lib/gameToken';
import { getRoomHostInfo } from '@/lib/partykitAdmin';
import type { GameTokenRequest, GameTokenResponse } from '@/types/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as GameTokenRequest;
  const { roomId, displayName, color, isHost } = body;

  if (!roomId || !isValidDisplayName(displayName) || !isValidColor(color)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  if (isHost) {
    const { hostUserId } = await getRoomHostInfo(roomId);
    if (hostUserId !== session.user.id) {
      return NextResponse.json({ error: 'Not host' }, { status: 403 });
    }
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const expiresInSec = 5 * 60;
  const token = await mintGameToken(
    {
      sub: session.user.id,
      roomId,
      displayName: displayName.trim(),
      color,
      isHost,
    },
    secret
  );

  const response: GameTokenResponse = {
    token,
    expiresAt: Date.now() + expiresInSec * 1000,
  };
  return NextResponse.json(response);
}

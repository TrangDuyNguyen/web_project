import { auth } from '@/auth';
import { generateRoomCode } from '@/utils/generateRoomCode';
import { initRoom } from '@/lib/partykitAdmin';
import type { CreateRoomRequest, CreateRoomResponse } from '@/types/room';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as CreateRoomRequest;
  const roomCode = generateRoomCode();
  const roomId = roomCode;
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
  const protocol = host.startsWith('localhost') ? 'ws' : 'wss';
  const wsUrl = `${protocol}://${host}/parties/game/${roomId}`;

  const initialized = await initRoom(roomId, {
    hostUserId: session.user.id,
    visibility: body.visibility,
    maxPlayers: body.maxPlayers,
    roundLimit: body.roundLimit,
  });

  if (!initialized) {
    return NextResponse.json({ error: 'Failed to init room' }, { status: 500 });
  }

  const response: CreateRoomResponse = { roomId, roomCode, wsUrl };
  return NextResponse.json(response);
}

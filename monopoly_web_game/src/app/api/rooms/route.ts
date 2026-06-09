import { NextResponse } from 'next/server';
import { generateRoomCode } from '@/utils/generateRoomCode';
import type { CreateRoomRequest, CreateRoomResponse } from '@/types/room';

export async function POST(request: Request) {
  const body = (await request.json()) as CreateRoomRequest;
  const roomCode = generateRoomCode();
  const roomId = roomCode;
  const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
  const protocol = host.startsWith('localhost') ? 'ws' : 'wss';
  const wsUrl = `${protocol}://${host}/parties/game/${roomId}`;
  const response: CreateRoomResponse = { roomId, roomCode, wsUrl };
  return NextResponse.json({ ...response, ...body });
}

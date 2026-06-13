const PK_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';
const PK_PROTOCOL = PK_HOST.startsWith('localhost') ? 'http' : 'https';

export async function getRoomHostInfo(roomId: string): Promise<{ hostUserId: string | null }> {
  const res = await fetch(`${PK_PROTOCOL}://${PK_HOST}/parties/game/${roomId}/host`, {
    cache: 'no-store',
  });
  if (!res.ok) return { hostUserId: null };
  return res.json();
}

export async function initRoom(
  roomId: string,
  body: { hostUserId: string; visibility: string; maxPlayers: number; roundLimit?: number }
): Promise<boolean> {
  const res = await fetch(`${PK_PROTOCOL}://${PK_HOST}/parties/game/${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.ok;
}

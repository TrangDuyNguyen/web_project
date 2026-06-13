export function extractRoomIdFromUrl(url: string): string | null {
  const match = url.match(/\/parties\/game\/([^/?]+)/);
  return match?.[1] ?? null;
}

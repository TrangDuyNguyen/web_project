import { SignJWT, jwtVerify } from 'jose';
import type { GameTokenPayload, MintGameTokenInput } from '@/types/auth';

const DEFAULT_TTL_SEC = 5 * 60;

function secretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function mintGameToken(
  input: MintGameTokenInput,
  secret: string
): Promise<string> {
  const ttl = input.expiresInSec ?? DEFAULT_TTL_SEC;
  const now = Math.floor(Date.now() / 1000);
  const builder = new SignJWT({
    roomId: input.roomId,
    displayName: input.displayName,
    color: input.color,
    ...(input.isHost ? { isHost: true } : {}),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.sub)
    .setIssuedAt(now)
    .setExpirationTime(now + ttl);

  return builder.sign(secretKey(secret));
}

export async function verifyGameToken(
  token: string,
  secret: string
): Promise<GameTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.roomId !== 'string' ||
      typeof payload.displayName !== 'string' ||
      typeof payload.color !== 'string'
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      roomId: payload.roomId,
      displayName: payload.displayName,
      color: payload.color,
      isHost: payload.isHost === true,
      iat: payload.iat ?? 0,
      exp: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

export function isValidDisplayName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 20;
}

export function isValidColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

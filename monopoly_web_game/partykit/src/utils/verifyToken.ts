import { verifyGameToken } from '../../../src/lib/gameToken';
import type { GameTokenPayload } from '../../../src/types/auth';

export async function verifyWsToken(
  token: string,
  secret: string
): Promise<GameTokenPayload | null> {
  return verifyGameToken(token, secret);
}

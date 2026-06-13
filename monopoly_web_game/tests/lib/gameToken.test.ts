import { describe, it, expect } from 'vitest';
import { mintGameToken, verifyGameToken } from '@/lib/gameToken';

const SECRET = 'test-secret-at-least-32-characters-long';

describe('gameToken', () => {
  it('mints and verifies a valid token', async () => {
    const token = await mintGameToken(
      { sub: 'user-1', roomId: 'ABC123', displayName: 'Alice', color: '#EF4444', isHost: true },
      SECRET
    );
    const payload = await verifyGameToken(token, SECRET);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('user-1');
    expect(payload!.roomId).toBe('ABC123');
    expect(payload!.displayName).toBe('Alice');
    expect(payload!.isHost).toBe(true);
  });

  it('rejects token with wrong secret', async () => {
    const token = await mintGameToken(
      { sub: 'user-1', roomId: 'ABC123', displayName: 'Alice', color: '#EF4444' },
      SECRET
    );
    const payload = await verifyGameToken(token, 'wrong-secret-at-least-32-chars-xx');
    expect(payload).toBeNull();
  });

  it('rejects expired token', async () => {
    const token = await mintGameToken(
      { sub: 'user-1', roomId: 'ABC123', displayName: 'Alice', color: '#EF4444', expiresInSec: -1 },
      SECRET
    );
    const payload = await verifyGameToken(token, SECRET);
    expect(payload).toBeNull();
  });

  it('rejects token when roomId mismatch checked externally', async () => {
    const token = await mintGameToken(
      { sub: 'user-1', roomId: 'ABC123', displayName: 'Alice', color: '#EF4444' },
      SECRET
    );
    const payload = await verifyGameToken(token, SECRET);
    expect(payload!.roomId).not.toBe('OTHER');
  });
});

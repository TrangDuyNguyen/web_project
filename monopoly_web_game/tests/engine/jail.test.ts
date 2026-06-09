import { describe, it, expect } from 'vitest';
import { sendToJail, payJailFine, releaseFromJail } from '@/game/engine/jail';
import { JAIL_FINE, JAIL_POSITION } from '@/game/rules/constants';
import type { Player } from '@/types/game';

const p = (): Player => ({
  id: 'p1', displayName: 'A', color: '#EF4444', money: 1500,
  position: 20, properties: [], isBankrupt: false, isJailed: false,
  jailTurns: 0, getOutOfJailFreeCards: 0, connection: 'online',
});

describe('jail', () => {
  it('sendToJail moves to jail position', () => {
    const result = sendToJail(p());
    expect(result.position).toBe(JAIL_POSITION);
    expect(result.isJailed).toBe(true);
  });
  it('payJailFine costs $50 and releases', () => {
    const result = payJailFine(sendToJail(p()));
    expect(result.money).toBe(1500 - JAIL_FINE);
    expect(result.isJailed).toBe(false);
  });
  it('releaseFromJail on doubles', () => {
    expect(releaseFromJail(sendToJail(p())).isJailed).toBe(false);
  });
});

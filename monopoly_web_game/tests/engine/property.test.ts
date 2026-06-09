import { describe, it, expect } from 'vitest';
import { buyProperty, payRent, liquidateToBank } from '@/game/engine/property';
import { PROPERTIES } from '@/data/properties';
import type { Player } from '@/types/game';

const player = (): Player => ({
  id: 'p1', displayName: 'A', color: '#EF4444', money: 1500,
  position: 1, properties: [], isBankrupt: false, isJailed: false,
  jailTurns: 0, getOutOfJailFreeCards: 0, connection: 'online',
});

describe('property', () => {
  it('buyProperty deducts price and adds property', () => {
    const prop = { ...PROPERTIES[0], ownerId: undefined };
    const result = buyProperty(player(), prop);
    expect(result.player.money).toBe(1500 - prop.price);
    expect(result.player.properties).toContain(prop.id);
    expect(result.property.ownerId).toBe('p1');
  });
  it('payRent transfers money', () => {
    const prop = { ...PROPERTIES[0], ownerId: 'p2' };
    const result = payRent(player(), prop, { ...player(), id: 'p2' });
    expect(result.payer.money).toBe(1500 - prop.rent);
    expect(result.owner.money).toBe(1500 + prop.rent);
  });
  it('liquidateToBank clears owner', () => {
    expect(liquidateToBank({ ...PROPERTIES[0], ownerId: 'p1' }).ownerId).toBeUndefined();
  });
});

import { describe, it, expect } from 'vitest';
import { shuffleDeck, drawCard, applyCardAction } from '@/game/engine/cards';
import { CHANCE_CARDS } from '@/data/cards';
import type { Player } from '@/types/game';

const player = (): Player => ({
  id: 'p1', displayName: 'A', color: '#EF4444', money: 1500,
  position: 10, properties: [], isBankrupt: false, isJailed: false,
  jailTurns: 0, getOutOfJailFreeCards: 0, connection: 'online',
});

describe('cards', () => {
  it('shuffleDeck returns all card ids', () => {
    const ids = CHANCE_CARDS.map((c) => c.id);
    expect(shuffleDeck(ids).sort()).toEqual(ids.sort());
  });
  it('drawCard removes top card and moves to bottom', () => {
    const { cardId, deck } = drawCard(['a', 'b', 'c']);
    expect(cardId).toBe('a');
    expect(deck).toEqual(['b', 'c', 'a']);
  });
  it('applyCardAction collect adds money', () => {
    expect(applyCardAction(player(), { type: 'collect', amount: 50 }).player.money).toBe(1550);
  });
  it('applyCardAction go_to_jail jails player', () => {
    expect(applyCardAction(player(), { type: 'go_to_jail' }).player.isJailed).toBe(true);
  });
});

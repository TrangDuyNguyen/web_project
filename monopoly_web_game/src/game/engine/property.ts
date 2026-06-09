import type { Player, Property } from '@/types/game';
import { canAfford, collect, pay } from './economy';

export function buyProperty(player: Player, property: Property) {
  if (property.ownerId) throw new Error('ALREADY_OWNED');
  if (!canAfford(player, property.price)) throw new Error('INSUFFICIENT_FUNDS');
  return {
    player: {
      ...player,
      money: player.money - property.price,
      properties: [...player.properties, property.id],
    },
    property: { ...property, ownerId: player.id },
  };
}

export function payRent(payer: Player, property: Property, owner: Player) {
  return { payer: pay(payer, property.rent), owner: collect(owner, property.rent) };
}

export function liquidateToBank(property: Property): Property {
  return { ...property, ownerId: undefined };
}

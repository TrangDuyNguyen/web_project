import type { Player } from '@/types/game';
import { PROPERTY_BY_ID } from '@/data/properties';
import type { PlayerRanking } from '@/types/room';

export function totalAssets(player: Player): number {
  const propertyValue = player.properties.reduce(
    (sum, id) => sum + (PROPERTY_BY_ID[id]?.price ?? 0),
    0
  );
  return player.money + propertyValue;
}

export function checkLastStanding(players: Player[]): string | null {
  const active = players.filter((p) => !p.isBankrupt);
  return active.length === 1 ? active[0].id : null;
}

export function calculateRankings(players: Player[]): PlayerRanking[] {
  return players
    .map((p) => ({
      playerId: p.id,
      displayName: p.displayName,
      totalAssets: totalAssets(p),
      rank: 0,
    }))
    .sort((a, b) => b.totalAssets - a.totalAssets)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

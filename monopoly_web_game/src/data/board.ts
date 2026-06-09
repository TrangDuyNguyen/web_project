import type { BoardTile } from '@/types/game';
import { PROPERTIES } from './properties';

function propertyTile(position: number, propertyId: string): BoardTile {
  const prop = PROPERTIES.find((p) => p.id === propertyId)!;
  return { position, type: 'property', name: prop.name, propertyId };
}

const TILES: BoardTile[] = [
  { position: 0, type: 'go', name: 'XUẤT PHÁT' },
  propertyTile(1, 'mediterranean'),
  { position: 2, type: 'community_chest', name: 'Quỹ Cộng Đồng' },
  propertyTile(3, 'baltic'),
  { position: 4, type: 'tax', name: 'Thuế Thu Nhập', taxAmount: 200 },
  propertyTile(5, 'reading_rr'),
  propertyTile(6, 'oriental'),
  { position: 7, type: 'chance', name: 'Cơ Hội' },
  propertyTile(8, 'vermont'),
  propertyTile(9, 'connecticut'),
  { position: 10, type: 'jail', name: 'Thăm Tù' },
  propertyTile(11, 'st_charles'),
  propertyTile(12, 'electric'),
  propertyTile(13, 'states'),
  propertyTile(14, 'virginia'),
  propertyTile(15, 'pennsylvania_rr'),
  propertyTile(16, 'st_james'),
  { position: 17, type: 'community_chest', name: 'Quỹ Cộng Đồng' },
  propertyTile(18, 'tennessee'),
  propertyTile(19, 'new_york'),
  { position: 20, type: 'free_parking', name: 'Bãi Đỗ Miễn Phí' },
  propertyTile(21, 'kentucky'),
  { position: 22, type: 'chance', name: 'Cơ Hội' },
  propertyTile(23, 'indiana'),
  propertyTile(24, 'illinois'),
  propertyTile(25, 'b_and_o_rr'),
  propertyTile(26, 'atlantic'),
  propertyTile(27, 'ventnor'),
  propertyTile(28, 'water'),
  propertyTile(29, 'marvin'),
  { position: 30, type: 'go_to_jail', name: 'Vào Tù' },
  propertyTile(31, 'pacific'),
  propertyTile(32, 'nc_avenue'),
  { position: 33, type: 'community_chest', name: 'Quỹ Cộng Đồng' },
  propertyTile(34, 'pennsylvania'),
  propertyTile(35, 'short_line'),
  { position: 36, type: 'chance', name: 'Cơ Hội' },
  propertyTile(37, 'park_place'),
  { position: 38, type: 'tax', name: 'Thuế Xa Xỉ', taxAmount: 100 },
  propertyTile(39, 'boardwalk'),
];

export const BOARD_TILES = [...TILES].sort((a, b) => a.position - b.position);
export const TILE_BY_POSITION = Object.fromEntries(BOARD_TILES.map((t) => [t.position, t]));

import type { Card } from '@/types/game';

export const CHANCE_CARDS: Card[] = [
  { id: 'ch1', deck: 'chance', text: 'Tiến tới XUẤT PHÁT. Nhận $200.', action: { type: 'move', targetPosition: 0, collectGo: true } },
  { id: 'ch2', deck: 'chance', text: 'Tiến tới Illinois.', action: { type: 'move', targetPosition: 24 } },
  { id: 'ch3', deck: 'chance', text: 'Tiến tới St. Charles.', action: { type: 'move', targetPosition: 11 } },
  { id: 'ch4', deck: 'chance', text: 'Lùi lại 3 ô.', action: { type: 'move_relative', steps: -3 } },
  { id: 'ch5', deck: 'chance', text: 'Vào tù. Đi thẳng tù. Không qua XUẤT PHÁT.', action: { type: 'go_to_jail' } },
  { id: 'ch6', deck: 'chance', text: 'Thẻ ra tù miễn phí. Giữ lại.', action: { type: 'get_out_of_jail_free' } },
  { id: 'ch7', deck: 'chance', text: 'Nhận $50.', action: { type: 'collect', amount: 50 } },
  { id: 'ch8', deck: 'chance', text: 'Nhận $100.', action: { type: 'collect', amount: 100 } },
  { id: 'ch9', deck: 'chance', text: 'Nhận $150.', action: { type: 'collect', amount: 150 } },
  { id: 'ch10', deck: 'chance', text: 'Trả $15.', action: { type: 'pay', amount: 15 } },
  { id: 'ch11', deck: 'chance', text: 'Trả $50.', action: { type: 'pay', amount: 50 } },
  { id: 'ch12', deck: 'chance', text: 'Sửa nhà: trả $25 mỗi nhà.', action: { type: 'repairs', perHouse: 25, perHotel: 100 } },
];

export const COMMUNITY_CARDS: Card[] = [
  { id: 'cc1', deck: 'community_chest', text: 'Ngân hàng nhầm. Nhận $200.', action: { type: 'collect', amount: 200 } },
  { id: 'cc2', deck: 'community_chest', text: 'Hoàn thuế. Nhận $100.', action: { type: 'collect', amount: 100 } },
  { id: 'cc3', deck: 'community_chest', text: 'Phí bác sĩ. Trả $50.', action: { type: 'pay', amount: 50 } },
  { id: 'cc4', deck: 'community_chest', text: 'Phí bảo hiểm. Trả $100.', action: { type: 'pay', amount: 100 } },
  { id: 'cc5', deck: 'community_chest', text: 'Thẻ ra tù miễn phí. Giữ lại.', action: { type: 'get_out_of_jail_free' } },
  { id: 'cc6', deck: 'community_chest', text: 'Vào tù. Đi thẳng tù.', action: { type: 'go_to_jail' } },
  { id: 'cc7', deck: 'community_chest', text: 'Nhận $10.', action: { type: 'collect', amount: 10 } },
  { id: 'cc8', deck: 'community_chest', text: 'Nhận $25.', action: { type: 'collect', amount: 25 } },
  { id: 'cc9', deck: 'community_chest', text: 'Nhận $50.', action: { type: 'collect', amount: 50 } },
  { id: 'cc10', deck: 'community_chest', text: 'Trả $50.', action: { type: 'pay', amount: 50 } },
  { id: 'cc11', deck: 'community_chest', text: 'Trả $100.', action: { type: 'pay', amount: 100 } },
  { id: 'cc12', deck: 'community_chest', text: 'Nhận $20.', action: { type: 'collect', amount: 20 } },
];

export const CARD_BY_ID = Object.fromEntries(
  [...CHANCE_CARDS, ...COMMUNITY_CARDS].map((c) => [c.id, c])
);

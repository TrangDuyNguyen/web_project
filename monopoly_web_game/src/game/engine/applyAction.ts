import { CARD_BY_ID } from '@/data/cards';
import { TILE_BY_POSITION } from '@/data/board';
import { PROPERTY_BY_ID, PROPERTY_BY_POSITION } from '@/data/properties';
import {
  GO_BONUS,
  GO_POSITION,
  MAX_DOUBLES_BEFORE_JAIL,
  MAX_EVENT_LOG,
} from '@/game/rules/constants';
import type { EngineAction, EngineResult, GameState } from '@/types/game';
import { createEvent } from '@/utils/createEvent';
import { applyCardAction, drawCard } from './cards';
import { declareBankrupt, isBankrupt } from './bankruptcy';
import { rollDice } from './dice';
import { collect, pay } from './economy';
import { sendToJail, payJailFine, releaseFromJail, useJailCard, incrementJailTurn } from './jail';
import { movePlayer, passedGo } from './movement';
import { buyProperty, payRent, liquidateToBank } from './property';
import { getCurrentPlayer, nextPlayerIndex, updatePlayer } from './turn';
import { validateAction } from './validators';
import { checkLastStanding, calculateRankings } from './win';

function appendEvent(state: GameState, message: string, type: GameState['eventLog'][0]['type'] = 'info'): GameState {
  const eventLog = [...state.eventLog, createEvent(message, type)].slice(-MAX_EVENT_LOG);
  return { ...state, eventLog };
}

function endTurn(state: GameState): GameState {
  const winnerId = checkLastStanding(state.players);
  if (winnerId) {
    return {
      ...state,
      gameStatus: 'finished',
      winMode: 'last_standing',
      winnerId,
      phase: 'waiting_for_roll',
    };
  }

  if (state.settings.roundLimit && state.currentRound >= state.settings.roundLimit) {
    const rankings = calculateRankings(state.players);
    return {
      ...state,
      gameStatus: 'finished',
      winMode: 'round_limit',
      winnerId: rankings[0]?.playerId,
      phase: 'waiting_for_roll',
    };
  }

  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex(state),
    dice: null,
    consecutiveDoubles: 0,
    phase: 'waiting_for_roll',
    lastCard: undefined,
  };
}

function handleBankruptcy(state: GameState, playerId: string): GameState {
  let next = updatePlayer(state, playerId, (p) => declareBankrupt(p));
  const player = next.players.find((p) => p.id === playerId)!;
  const propertyOwners = { ...next.propertyOwners };
  for (const propId of player.properties) {
    propertyOwners[propId] = undefined;
  }
  next = { ...next, propertyOwners };
  return appendEvent(next, `${player.displayName} đã phá sản!`, 'money');
}

function resolveMoney(state: GameState, playerId: string, amount: number): GameState {
  let next = updatePlayer(state, playerId, (p) => pay(p, amount));
  const player = next.players.find((p) => p.id === playerId)!;
  if (isBankrupt(player)) return handleBankruptcy(next, playerId);
  return next;
}

function handleTileLanding(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const tile = TILE_BY_POSITION[player.position];
  if (!tile) return endTurn(state);

  switch (tile.type) {
    case 'property': {
      const propId = tile.propertyId!;
      const ownerId = state.propertyOwners[propId];
      if (!ownerId) {
        return { ...state, phase: 'buy_decision' };
      }
      if (ownerId === playerId) return endTurn(state);
      const property = { ...PROPERTY_BY_ID[propId], ownerId };
      const owner = state.players.find((p) => p.id === ownerId)!;
      const { payer, owner: updatedOwner } = payRent(player, property, owner);
      let next = updatePlayer(state, playerId, () => payer);
      next = updatePlayer(next, ownerId, () => updatedOwner);
      next = appendEvent(next, `${player.displayName} trả tiền thuê ${formatMoney(property.rent)} cho ${owner.displayName}`, 'money');
      const broke = next.players.find((p) => p.id === playerId)!;
      if (isBankrupt(broke)) next = handleBankruptcy(next, playerId);
      return endTurn(next);
    }
    case 'tax': {
      let next = resolveMoney(state, playerId, tile.taxAmount ?? 0);
      next = appendEvent(next, `${player.displayName} trả thuế ${formatMoney(tile.taxAmount ?? 0)}`, 'money');
      return endTurn(next);
    }
    case 'chance':
    case 'community_chest': {
      const deckKey = tile.type === 'chance' ? 'chanceDeck' : 'communityDeck';
      const { cardId, deck: newDeck } = drawCard(state[deckKey]);
      const card = CARD_BY_ID[cardId];
      const { player: updated } = applyCardAction(player, card.action);
      let next = updatePlayer(state, playerId, () => updated);
      next = { ...next, [deckKey]: newDeck, lastCard: card, phase: 'card_drawn' };
      next = appendEvent(next, `${player.displayName} rút thẻ: ${card.text}`, 'card');
      const broke = next.players.find((p) => p.id === playerId)!;
      if (isBankrupt(broke)) next = handleBankruptcy(next, playerId);
      return endTurn(next);
    }
    case 'go_to_jail': {
      let next = updatePlayer(state, playerId, (p) => sendToJail(p));
      next = appendEvent(next, `${player.displayName} vào tù!`, 'jail');
      return endTurn(next);
    }
    default:
      return endTurn(state);
  }
}

function formatMoney(amount: number): string {
  return `$${amount}`;
}

function handleRoll(state: GameState, playerId: string, fromJail = false): EngineResult {
  const dice = rollDice();
  let next: GameState = { ...state, dice, phase: 'rolled' };
  const player = getCurrentPlayer(next);

  next = appendEvent(
    next,
    `${player.displayName} tung ${dice.die1}+${dice.die2}=${dice.total}${dice.isDouble ? ' (đôi!)' : ''}`,
    'info'
  );

  if (player.isJailed) {
    if (dice.isDouble) {
      next = updatePlayer(next, playerId, (p) => releaseFromJail(p));
      next = appendEvent(next, `${player.displayName} tung đôi, ra tù!`, 'jail');
    } else {
      const updated = incrementJailTurn(player);
      next = updatePlayer(next, playerId, () => updated);
      if (updated.jailTurns >= 3) {
        next = updatePlayer(next, playerId, (p) => payJailFine(p));
        next = appendEvent(next, `${player.displayName} trả $50 để ra tù`, 'jail');
      } else {
        next = appendEvent(next, `${player.displayName} vẫn trong tù`, 'jail');
        return { ok: true, state: endTurn(next) };
      }
    }
  }

  let consecutiveDoubles = next.consecutiveDoubles;
  if (dice.isDouble) consecutiveDoubles += 1;
  else consecutiveDoubles = 0;

  if (consecutiveDoubles >= MAX_DOUBLES_BEFORE_JAIL) {
    next = updatePlayer(next, playerId, (p) => sendToJail(p));
    next = { ...next, consecutiveDoubles: 0 };
    next = appendEvent(next, `${player.displayName} tung 3 đôi liên tiếp, vào tù!`, 'jail');
    return { ok: true, state: endTurn(next) };
  }

  const current = next.players.find((p) => p.id === playerId)!;
  if (!current.isJailed || dice.isDouble) {
    const newPos = movePlayer(current.position, dice.total);
    let updated = { ...current, position: newPos };
    if (passedGo(current.position, dice.total)) {
      updated = collect(updated, GO_BONUS);
      next = { ...next, currentRound: next.currentRound + (next.currentPlayerIndex === 0 ? 1 : 0) };
      next = appendEvent(next, `${current.displayName} qua XUẤT PHÁT, nhận ${formatMoney(GO_BONUS)}`, 'money');
    }
    next = updatePlayer(next, playerId, () => updated);
    next = { ...next, consecutiveDoubles };
    next = handleTileLanding(next, playerId);

    if (dice.isDouble && next.gameStatus === 'playing' && next.phase === 'waiting_for_roll') {
      return { ok: true, state: { ...next, phase: 'waiting_for_roll', currentPlayerIndex: state.currentPlayerIndex } };
    }
    return { ok: true, state: next };
  }

  next = { ...next, consecutiveDoubles };
  return { ok: true, state: endTurn(next) };
}

export function applyAction(state: GameState, action: EngineAction, playerId: string): EngineResult {
  const error = validateAction(state, action, playerId);
  if (error) return { ok: false, error };

  switch (action.type) {
    case 'start_game': {
      const next = {
        ...state,
        gameStatus: 'playing' as const,
        currentRound: 1,
        phase: 'waiting_for_roll' as const,
      };
      return { ok: true, state: appendEvent(next, 'Ván đấu bắt đầu!', 'system') };
    }
    case 'end_game': {
      const rankings = calculateRankings(state.players);
      return {
        ok: true,
        state: {
          ...state,
          gameStatus: 'finished',
          winMode: 'host_ended',
          winnerId: rankings[0]?.playerId,
        },
      };
    }
    case 'roll_dice':
      return handleRoll(state, playerId);
    case 'roll_for_doubles':
      return handleRoll(state, playerId, true);
    case 'buy_property': {
      const player = getCurrentPlayer(state);
      const tile = TILE_BY_POSITION[player.position];
      const propId = tile?.propertyId;
      if (!propId) return { ok: false, error: { code: 'INVALID_PHASE', message: 'Không có đất để mua' } };
      const property = { ...PROPERTY_BY_ID[propId], ownerId: state.propertyOwners[propId] };
      try {
        const { player: updated, property: owned } = buyProperty(player, property);
        let next = updatePlayer(state, playerId, () => updated);
        next = {
          ...next,
          propertyOwners: { ...next.propertyOwners, [propId]: playerId },
        };
        next = appendEvent(next, `${player.displayName} mua ${owned.name} với giá ${formatMoney(owned.price)}`, 'property');
        return { ok: true, state: endTurn(next) };
      } catch {
        return { ok: false, error: { code: 'INSUFFICIENT_FUNDS', message: 'Không đủ tiền' } };
      }
    }
    case 'skip_buy':
      return { ok: true, state: endTurn(state) };
    case 'pay_jail_fine': {
      const player = getCurrentPlayer(state);
      if (player.money < 50) return { ok: false, error: { code: 'INSUFFICIENT_FUNDS', message: 'Không đủ tiền' } };
      let next = updatePlayer(state, playerId, (p) => payJailFine(p));
      next = appendEvent(next, `${player.displayName} trả phí ra tù`, 'jail');
      return { ok: true, state: { ...next, phase: 'waiting_for_roll' } };
    }
    case 'use_jail_card': {
      const player = getCurrentPlayer(state);
      try {
        let next = updatePlayer(state, playerId, (p) => useJailCard(p));
        next = appendEvent(next, `${player.displayName} dùng thẻ ra tù miễn phí`, 'jail');
        return { ok: true, state: { ...next, phase: 'waiting_for_roll' } };
      } catch {
        return { ok: false, error: { code: 'NO_JAIL_CARD', message: 'Không có thẻ ra tù' } };
      }
    }
    default:
      return { ok: false, error: { code: 'INVALID_PHASE', message: 'Hành động không hợp lệ' } };
  }
}

export function joinPlayer(state: GameState, player: GameState['players'][0]): GameState {
  if (state.players.length >= state.settings.maxPlayers) return state;
  if (state.players.some((p) => p.id === player.id)) return state;
  return { ...state, players: [...state.players, player] };
}

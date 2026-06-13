export type GameTokenPayload = {
  sub: string;
  roomId: string;
  displayName: string;
  color: string;
  isHost?: boolean;
  iat: number;
  exp: number;
};

export type MintGameTokenInput = {
  sub: string;
  roomId: string;
  displayName: string;
  color: string;
  isHost?: boolean;
  expiresInSec?: number;
};

export type GameTokenRequest = {
  roomId: string;
  displayName: string;
  color: string;
  isHost?: boolean;
};

export type GameTokenResponse = {
  token: string;
  expiresAt: number;
};

export type PendingRoomSettings = {
  hostUserId: string;
  visibility: 'private' | 'public';
  maxPlayers: number;
  roundLimit?: number;
};

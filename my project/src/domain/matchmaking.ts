import { GameId, isMatchEligibleGame } from './catalog';
import { assertNoPurchasedCoinWagering } from './economy';

export type MatchStatus =
  | 'WAITING_OPPONENT'
  | 'AWAITING_ACCEPTANCE'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'FORFEIT_DISCONNECT'
  | 'EXPIRED'
  | 'CANCELLED';

export interface MatchSession {
  id: string;
  gameId: GameId;
  hostUserId: string;
  guestUserId?: string;
  hostAccepted: boolean;
  guestAccepted: boolean;
  practiceEntryPoints: number;
  durationSeconds: number;
  startedAtMs?: number;
  expiresAtMs: number;
  status: MatchStatus;
  winnerUserId?: string;
  disconnectUserId?: string;
}

export class MatchPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MatchPolicyError';
  }
}

export function createMatchSession(params: {
  id: string;
  gameId: GameId;
  hostUserId: string;
  practiceEntryPoints: number;
  durationSeconds: number;
  nowMs: number;
}): MatchSession {
  if (!isMatchEligibleGame(params.gameId)) {
    throw new MatchPolicyError(
      `Game "${params.gameId}" does not support 1v1 matches. Only Carrom, Pool, and Ludo Star allow 1v1 matchmaking.`
    );
  }
  assertNoPurchasedCoinWagering('PRACTICE_POINTS');
  if (params.practiceEntryPoints < 0 || !Number.isInteger(params.practiceEntryPoints)) {
    throw new MatchPolicyError('Practice entry points must be a non-negative integer.');
  }
  return {
    id: params.id,
    gameId: params.gameId,
    hostUserId: params.hostUserId,
    hostAccepted: true,
    guestAccepted: false,
    practiceEntryPoints: params.practiceEntryPoints,
    durationSeconds: params.durationSeconds,
    expiresAtMs: params.nowMs + 120_000,
    status: 'WAITING_OPPONENT',
  };
}

export function joinMatchSession(
  match: MatchSession,
  guestUserId: string
): MatchSession {
  if (match.status !== 'WAITING_OPPONENT') {
    throw new MatchPolicyError(`Match ${match.id} is not open for joining.`);
  }
  if (guestUserId === match.hostUserId) {
    throw new MatchPolicyError('Host cannot join their own 1v1 match as opponent.');
  }
  return {
    ...match,
    guestUserId,
    guestAccepted: false,
    status: 'AWAITING_ACCEPTANCE',
  };
}

export function acceptMatchSession(
  match: MatchSession,
  userId: string,
  nowMs: number
): MatchSession {
  if (match.status !== 'AWAITING_ACCEPTANCE' || !match.guestUserId) {
    throw new MatchPolicyError('Match is not awaiting opponent acceptance.');
  }
  if (nowMs > match.expiresAtMs) {
    return { ...match, status: 'EXPIRED' };
  }
  const hostAccepted = match.hostAccepted || userId === match.hostUserId;
  const guestAccepted = match.guestAccepted || userId === match.guestUserId;
  if (userId !== match.hostUserId && userId !== match.guestUserId) {
    throw new MatchPolicyError('User is not a participant in this match.');
  }
  const bothReady = hostAccepted && guestAccepted;
  return {
    ...match,
    hostAccepted,
    guestAccepted,
    status: bothReady ? 'ACTIVE' : 'AWAITING_ACCEPTANCE',
    startedAtMs: bothReady ? nowMs : undefined,
    expiresAtMs: bothReady ? nowMs + match.durationSeconds * 1000 : match.expiresAtMs,
  };
}

export function settleMatchDisconnect(
  match: MatchSession,
  disconnectedUserId: string
): MatchSession {
  if (match.status !== 'ACTIVE' || !match.guestUserId) {
    throw new MatchPolicyError('Only active 1v1 matches can settle on disconnect.');
  }
  if (
    disconnectedUserId !== match.hostUserId &&
    disconnectedUserId !== match.guestUserId
  ) {
    throw new MatchPolicyError('Disconnected user is not a match participant.');
  }
  const winnerUserId =
    disconnectedUserId === match.hostUserId ? match.guestUserId : match.hostUserId;
  return {
    ...match,
    status: 'FORFEIT_DISCONNECT',
    disconnectUserId: disconnectedUserId,
    winnerUserId,
  };
}

export function settleMatchResult(
  match: MatchSession,
  winnerUserId: string,
  serverAuthoritative: boolean
): MatchSession {
  if (!serverAuthoritative) {
    throw new MatchPolicyError('Match results must be server-authoritative.');
  }
  if (match.status !== 'ACTIVE' || !match.guestUserId) {
    throw new MatchPolicyError('Match is not active.');
  }
  if (winnerUserId !== match.hostUserId && winnerUserId !== match.guestUserId) {
    throw new MatchPolicyError('Winner must be one of the two participants.');
  }
  return {
    ...match,
    status: 'COMPLETED',
    winnerUserId,
  };
}

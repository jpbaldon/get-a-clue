export type GameMode = 'ffa' | 'teams';
export type RoundId = 'round1' | 'round2';
export type Phase =
  | 'lobby'
  | 'board'
  | 'clue'
  | 'buzzOpen'
  | 'answering'
  | 'doublePortion'
  | 'lastTrumpetWager'
  | 'lastTrumpetReveal'
  | 'ended';

export interface Clue {
  text: string;
  answer: string;
  doublePortion: boolean;
}

export interface RoundData {
  categories: string[];
  values: number[];
  clues: Clue[][];
}

export interface LastTrumpetData {
  category: string;
  clue: string;
  answer: string;
}

export interface QuestionSet {
  id: string;
  ownerId: string;
  title: string;
  updatedAt: number;
  round1: RoundData;
  round2: RoundData;
  lastTrumpet: LastTrumpetData;
}

export interface PublicClue {
  round: RoundId;
  cat: number;
  row: number;
  text: string;
  value: number;
  doublePortion: boolean;
}

export interface Buzz {
  teamId: string;
  playerId: string;
  at: number;
}

export interface Player {
  name: string;
  teamId: string;
  connected: boolean;
}

export interface Team {
  name: string;
  color: string;
  score: number;
  memberUids: Record<string, boolean>;
}

export interface Proposal {
  text: string;
  voteUids: Record<string, boolean>;
}

export interface LastTrumpetSubmit {
  wager: number;
  answer: string;
  submittedBy: string;
}

export interface RevealEntry {
  teamId: string;
  wager: number;
  answer: string;
  judged: 'pending' | 'correct' | 'incorrect';
}

export interface GameMeta {
  hostId: string;
  setId: string;
  setTitle: string;
  phase: Phase;
  round: RoundId;
  roomCode: string;
  maxPlayers: number;
  mode: GameMode;
  teamCount: number;
  updatedAt: number;
  createdAt: number;
}

export interface GamePublic {
  used: Record<string, boolean>;
  currentClue: PublicClue | null;
  controlPlayerId: string;
  buzz: Buzz | null;
  lockouts: Record<string, boolean>;
  guessed: Record<string, boolean>;
  doublePortionWager: number | null;
  lastTrumpetCategory: string | null;
  lastTrumpetClue: string | null;
  lastTrumpetLocked: boolean;
  revealedAnswer: string | null;
  revealQueue: RevealEntry[];
  revealIndex: number;
  round1Categories: string[];
  round2Categories: string[];
  round1Values: number[];
  round2Values: number[];
  boardReady: boolean;
  controlReady: boolean;
}

export interface UndoSnapshot {
  kind: 'incorrect' | 'correct' | 'anotherRound' | 'revealSkip' | 'doublePortion';
  scores: Record<string, number>;
  lockouts: Record<string, boolean>;
  guessed: Record<string, boolean>;
  buzz: Buzz | null;
  controlPlayerId: string;
  used: Record<string, boolean>;
  phase: Phase;
  currentClue: PublicClue | null;
  doublePortionWager: number | null;
  revealedAnswer: string | null;
}

export interface HostDeviceClaim {
  deviceId: string;
  at: number;
}

export interface HostDevices {
  board?: HostDeviceClaim;
  control?: HostDeviceClaim;
}

export interface HostOnly {
  answers: {
    round1: string[][];
    round2: string[][];
    lastTrumpet: string;
  };
  clues: {
    round1: string[][];
    round2: string[][];
  };
  doublePortion: Record<string, boolean>;
}

export interface GameState {
  meta: GameMeta;
  public: GamePublic;
  players: Record<string, Player>;
  teams: Record<string, Team>;
  lastTrumpet: Record<string, LastTrumpetSubmit>;
  hostOnly: HostOnly | null;
  hostDevices: HostDevices;
  undo: UndoSnapshot | null;
}

export function cellKey(round: RoundId, cat: number, row: number): string {
  return `${round}:${cat}:${row}`;
}

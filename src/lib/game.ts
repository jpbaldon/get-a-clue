import {
  DataSnapshot,
  get,
  onValue,
  ref,
  remove,
  runTransaction,
  set,
  update,
} from 'firebase/database';

import {
  CATEGORY_COUNT,
  DEFAULT_MAX_PLAYERS,
  DEFAULT_TEAM_COUNT,
  DEVICE_ID_STORAGE_KEY,
  DOUBLE_PORTION_ROUND1_COUNT,
  DOUBLE_PORTION_ROUND2_COUNT,
  HOST_DEVICE_STALE_MS,
  MAX_PLAYERS_FFA,
  MAX_PLAYERS_TEAMS,
  MAX_TEAMS,
  MIN_PLAYERS,
  MIN_TEAMS,
  ROOM_CODE_CHARS,
  ROOM_CODE_LENGTH,
  ROUND1_VALUES,
  ROUND2_VALUES,
  ROW_COUNT,
  STALE_MS,
  TEAM_COLORS,
  WAGER_FLOOR,
} from './constants';
import { getRtdb } from './firebase';
import type {
  Buzz,
  GameMeta,
  GameMode,
  GamePublic,
  GameState,
  HostDevices,
  HostOnly,
  LastTrumpetSubmit,
  Phase,
  Player,
  Proposal,
  PublicClue,
  QuestionSet,
  RevealEntry,
  RoundId,
  Team,
  UndoSnapshot,
} from './types';
import { cellKey } from './types';

interface CreateGameOptions {
  maxPlayers?: number;
  mode?: GameMode;
  teamCount?: number;
}

export type HostDeviceRole = 'board' | 'control';

export interface BoardGameView {
  meta: GameMeta | null;
  public: GamePublic | null;
  players: Record<string, Player>;
  teams: Record<string, Team>;
}

export interface PlayerGameView extends BoardGameView {
  myConfer: Record<string, Proposal>;
  myLastTrumpet: LastTrumpetSubmit | null;
}

const gamePath = (code: string, path = '') => `games/${code}${path ? `/${path}` : ''}`;
const conferRoot = (code: string, path = '') => `confer/${code}${path ? `/${path}` : ''}`;

function now(): number {
  return Date.now();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generateRoomCode(): string {
  return Array.from({ length: ROOM_CODE_LENGTH }, () =>
    ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)],
  ).join('');
}

function makeTeams(count: number): Record<string, Team> {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => {
      const color = TEAM_COLORS[index % TEAM_COLORS.length];

      return [
        `team${index + 1}`,
        {
          name: `Team ${index + 1}`,
          color: color.hex,
          score: 0,
          memberUids: {},
        },
      ];
    }),
  );
}

function makeHostOnly(set: QuestionSet, doublePortion: Record<string, boolean> = {}): HostOnly {
  return {
    answers: {
      round1: set.round1.clues.map((category) => category.map((clue) => clue.answer)),
      round2: set.round2.clues.map((category) => category.map((clue) => clue.answer)),
      lastTrumpet: set.lastTrumpet.answer,
    },
    clues: {
      round1: set.round1.clues.map((category) => category.map((clue) => clue.text)),
      round2: set.round2.clues.map((category) => category.map((clue) => clue.text)),
    },
    doublePortion,
  };
}

function makePublic(set: QuestionSet): GamePublic {
  return {
    used: {},
    currentClue: null,
    controlPlayerId: '',
    buzz: null,
    lockouts: {},
    guessed: {},
    doublePortionWager: null,
    lastTrumpetCategory: set.lastTrumpet.category,
    lastTrumpetClue: set.lastTrumpet.clue,
    lastTrumpetLocked: false,
    revealedAnswer: null,
    revealQueue: [],
    revealIndex: 0,
    round1Categories: [...set.round1.categories],
    round2Categories: [...set.round2.categories],
    round1Values: [...set.round1.values],
    round2Values: [...set.round2.values],
    boardReady: false,
    controlReady: false,
  };
}

function allCellKeys(round: RoundId): string[] {
  const keys: string[] = [];
  for (let cat = 0; cat < CATEGORY_COUNT; cat += 1) {
    for (let row = 0; row < ROW_COUNT; row += 1) {
      keys.push(cellKey(round, cat, row));
    }
  }
  return keys;
}

function pickRandomKeys(keys: string[], count: number): string[] {
  const pool = [...keys];
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

function assignDoublePortions(): Record<string, boolean> {
  return Object.fromEntries(
    [
      ...pickRandomKeys(allCellKeys('round1'), DOUBLE_PORTION_ROUND1_COUNT),
      ...pickRandomKeys(allCellKeys('round2'), DOUBLE_PORTION_ROUND2_COUNT),
    ].map((key) => [key, true]),
  );
}

function deviceFresh(claim: { deviceId: string; at: number } | undefined): boolean {
  return Boolean(claim?.deviceId && now() - claim.at <= HOST_DEVICE_STALE_MS);
}

export function getHostDeviceId(): string {
  if (typeof window === 'undefined') return '';
  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
  return id;
}

export function hostDevicesReady(game: Pick<GameState, 'hostDevices'> | null | undefined): boolean {
  const devices = game?.hostDevices ?? {};
  return (
    deviceFresh(devices.board) &&
    deviceFresh(devices.control) &&
    devices.board?.deviceId !== devices.control?.deviceId
  );
}

function snapshotWith(game: GameState, kind: UndoSnapshot['kind']): UndoSnapshot {
  return {
    kind,
    scores: Object.fromEntries(Object.entries(game.teams ?? {}).map(([id, team]) => [id, team.score])),
    lockouts: { ...(game.public.lockouts ?? {}) },
    guessed: { ...(game.public.guessed ?? {}) },
    buzz: game.public.buzz ? { ...game.public.buzz } : null,
    controlPlayerId: game.public.controlPlayerId ?? '',
    used: { ...(game.public.used ?? {}) },
    phase: game.meta.phase,
    currentClue: game.public.currentClue ? { ...game.public.currentClue } : null,
    doublePortionWager: game.public.doublePortionWager ?? null,
    revealedAnswer: game.public.revealedAnswer ?? null,
  };
}

function scoreUpdates(scores: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(scores).map(([teamId, score]) => [`teams/${teamId}/score`, score]),
  );
}

function clearConferUpdates(code: string, teamIds: string[]): Record<string, null> {
  return Object.fromEntries(teamIds.map((teamId) => [conferRoot(code, teamId), null]));
}

async function clearConfer(code: string): Promise<void> {
  await remove(ref(getRtdb(), conferRoot(code)));
}

function activeTeamIds(game: Pick<GameState, 'teams'>): string[] {
  return Object.entries(game.teams ?? {})
    .filter(([, team]) => Object.keys(team.memberUids ?? {}).length > 0)
    .map(([teamId]) => teamId);
}

function connectedPlayers(game: Pick<GameState, 'players'>): string[] {
  return Object.entries(game.players ?? {})
    .filter(([, player]) => player.connected)
    .map(([uid]) => uid);
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function teamSize(team: Team): number {
  return Object.keys(team.memberUids ?? {}).length;
}

function pickLateJoinTeamId(teams: Record<string, Team>): string {
  const ids = Object.keys(teams);
  if (ids.length === 0) throw new Error('No teams available.');

  const minScore = Math.min(...ids.map((id) => teams[id].score ?? 0));
  const lastPlace = ids.filter((id) => (teams[id].score ?? 0) === minScore);
  if (lastPlace.length === 1) return lastPlace[0];

  const minSize = Math.min(...lastPlace.map((id) => teamSize(teams[id])));
  const fewest = lastPlace.filter((id) => teamSize(teams[id]) === minSize);
  if (fewest.length === 1) return fewest[0];
  return randomItem(fewest);
}

function pickRoundOneControl(game: GameState): string {
  const connected = connectedPlayers(game);
  return connected.length ? randomItem(connected) : Object.keys(game.players ?? {})[0] ?? '';
}

function pickRoundTwoControl(game: GameState): string {
  const teams = activeTeamIds(game)
    .map((teamId) => game.teams[teamId])
    .filter(Boolean);
  const lowScore = Math.min(...teams.map((team) => team.score));
  const candidates = teams
    .filter((team) => team.score === lowScore)
    .flatMap((team) => Object.keys(team.memberUids ?? {}))
    .filter((uid) => game.players[uid]?.connected);

  return candidates.length ? randomItem(candidates) : pickRoundOneControl(game);
}

function getRoundValues(round: RoundId): readonly number[] {
  return round === 'round1' ? ROUND1_VALUES : ROUND2_VALUES;
}

function allCellsUsed(game: GameState, round: RoundId): boolean {
  for (let cat = 0; cat < 6; cat += 1) {
    for (let row = 0; row < 5; row += 1) {
      if (!game.public.used?.[cellKey(round, cat, row)]) return false;
    }
  }

  return true;
}

function getHighestFaceValue(round: RoundId): number {
  return Math.max(...getRoundValues(round));
}

function currentClue(game: GameState): PublicClue {
  if (!game.public.currentClue) throw new Error('No clue is currently active.');
  return game.public.currentClue;
}

function assertHost(game: GameState, uid: string): void {
  if (game.meta.hostId !== uid) throw new Error('Only the host can do that.');
}

function getPlayerTeam(game: GameState, uid: string): string {
  const teamId = game.players?.[uid]?.teamId;
  if (!teamId) throw new Error('Player is not on a team.');
  return teamId;
}

async function readGameChild<T>(code: string, path: string): Promise<T | null> {
  const snapshot = await get(ref(getRtdb(), gamePath(code, path)));
  return snapshot.exists() ? (snapshot.val() as T) : null;
}

async function readPlayer(code: string, uid: string): Promise<Player> {
  const player = await readGameChild<Player>(code, `players/${uid}`);
  if (!player) throw new Error('Player not found.');
  return player;
}

async function readPlayerTeamId(code: string, uid: string): Promise<string> {
  const player = await readPlayer(code, uid);
  if (!player.teamId) throw new Error('Player is not on a team.');
  return player.teamId;
}

async function readGame(code: string): Promise<GameState | null> {
  const snapshot = await get(ref(getRtdb(), gamePath(code)));
  return snapshot.exists() ? (snapshot.val() as GameState) : null;
}

export function listenHostGame(code: string, callback: (game: GameState | null) => void): () => void {
  return onValue(ref(getRtdb(), gamePath(code)), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as GameState) : null);
  });
}

export function listenPlayerGame(
  code: string,
  uid: string,
  callback: (game: PlayerGameView) => void,
): () => void {
  const state: PlayerGameView = {
    meta: null,
    public: null,
    players: {},
    teams: {},
    myConfer: {},
    myLastTrumpet: null,
  };
  let conferUnsubscribe: (() => void) | null = null;
  let lastTrumpetUnsubscribe: (() => void) | null = null;
  let currentTeamId = '';

  const emit = () => callback({ ...state });
  const resetTeamListeners = (teamId: string) => {
    if (teamId === currentTeamId) return;
    conferUnsubscribe?.();
    lastTrumpetUnsubscribe?.();
    currentTeamId = teamId;
    state.myConfer = {};
    state.myLastTrumpet = null;

    if (!teamId) {
      emit();
      return;
    }

    conferUnsubscribe = onValue(ref(getRtdb(), conferRoot(code, teamId)), (snapshot) => {
      state.myConfer = snapshot.val() ?? {};
      emit();
    });
    lastTrumpetUnsubscribe = onValue(ref(getRtdb(), gamePath(code, `lastTrumpet/${teamId}`)), (snapshot) => {
      state.myLastTrumpet = snapshot.val() ?? null;
      emit();
    });
  };

  const unsubscribes = [
    onValue(ref(getRtdb(), gamePath(code, 'meta')), (snapshot) => {
      state.meta = snapshot.val() ?? null;
      emit();
    }),
    onValue(ref(getRtdb(), gamePath(code, 'public')), (snapshot) => {
      state.public = snapshot.val() ?? null;
      emit();
    }),
    onValue(ref(getRtdb(), gamePath(code, 'players')), (snapshot) => {
      state.players = snapshot.val() ?? {};
      resetTeamListeners(state.players[uid]?.teamId ?? '');
      emit();
    }),
    onValue(ref(getRtdb(), gamePath(code, 'teams')), (snapshot) => {
      state.teams = snapshot.val() ?? {};
      emit();
    }),
  ];

  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
    conferUnsubscribe?.();
    lastTrumpetUnsubscribe?.();
  };
}

export function listenBoardGame(
  code: string,
  callback: (game: BoardGameView) => void,
): () => void {
  const state: BoardGameView = {
    meta: null,
    public: null,
    players: {},
    teams: {},
  };
  const emit = () => callback({ ...state });
  const unsubscribes = [
    onValue(ref(getRtdb(), gamePath(code, 'meta')), (snapshot) => {
      state.meta = snapshot.val() ?? null;
      emit();
    }),
    onValue(ref(getRtdb(), gamePath(code, 'public')), (snapshot) => {
      state.public = snapshot.val() ?? null;
      emit();
    }),
    onValue(ref(getRtdb(), gamePath(code, 'players')), (snapshot) => {
      state.players = snapshot.val() ?? {};
      emit();
    }),
    onValue(ref(getRtdb(), gamePath(code, 'teams')), (snapshot) => {
      state.teams = snapshot.val() ?? {};
      emit();
    }),
  ];
  return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
}

export async function hostOpenGame(code: string, uid: string): Promise<boolean> {
  const meta = await readGameChild<GameMeta>(code, 'meta');
  if (!meta) return false;
  if (now() - (meta.updatedAt ?? 0) > STALE_MS) {
    await clearConfer(code);
    await remove(ref(getRtdb(), gamePath(code)));
    return false;
  }
  if (meta.hostId !== uid) throw new Error('Only the host can do that.');
  await update(ref(getRtdb(), gamePath(code, 'meta')), { updatedAt: now() });
  return true;
}

export async function claimHostDevice(
  code: string,
  hostId: string,
  role: HostDeviceRole,
  deviceId: string,
): Promise<void> {
  if (!deviceId) throw new Error('This browser could not store a device id.');
  const [meta, devices] = await Promise.all([
    readGameChild<GameMeta>(code, 'meta'),
    readGameChild<HostDevices>(code, 'hostDevices'),
  ]);
  if (!meta) throw new Error('Room not found.');
  if (meta.hostId !== hostId) throw new Error('Only the host can do that.');

  const next: HostDevices = { ...(devices ?? {}) };
  const otherRole: HostDeviceRole = role === 'board' ? 'control' : 'board';
  const other = next[otherRole];
  if (other?.deviceId === deviceId && deviceFresh(other)) {
    throw new Error('Use a second device for the other host screen. Two tabs in the same browser are the same device.');
  }

  next[role] = { deviceId, at: now() };
  await update(ref(getRtdb(), gamePath(code)), {
    [`hostDevices/${role}`]: next[role],
    'public/boardReady': deviceFresh(next.board),
    'public/controlReady': deviceFresh(next.control),
    'meta/updatedAt': now(),
  });
}

export async function createGame(hostId: string, setData: QuestionSet, options: CreateGameOptions = {}): Promise<string> {
  const mode = options.mode ?? 'teams';
  const maxPlayers = clamp(options.maxPlayers ?? DEFAULT_MAX_PLAYERS, MIN_PLAYERS, MAX_PLAYERS_TEAMS);
  const teamCount =
    mode === 'ffa' ? 0 : clamp(options.teamCount ?? DEFAULT_TEAM_COUNT, MIN_TEAMS, MAX_TEAMS);

  for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = generateRoomCode();
    const existing = await get(ref(getRtdb(), gamePath(code, 'meta')));
    if (existing.exists()) continue;

    const createdAt = now();
    const meta: GameMeta = {
      hostId,
      setId: setData.id,
      setTitle: setData.title,
      phase: 'lobby',
      round: 'round1',
      roomCode: code,
      maxPlayers,
      mode,
      teamCount,
      updatedAt: createdAt,
      createdAt,
    };

    await set(ref(getRtdb(), gamePath(code)), {
      meta,
      public: makePublic(setData),
      players: {},
      teams: mode === 'ffa' ? {} : makeTeams(teamCount),
      lastTrumpet: {},
      hostOnly: makeHostOnly(setData),
      hostDevices: {},
      undo: null,
    });

    return code;
  }

  throw new Error('Could not create a unique room code. Try again.');
}

export async function joinGame(code: string, uid: string, name: string): Promise<void> {
  const [meta, players, teams] = await Promise.all([
    readGameChild<GameMeta>(code, 'meta'),
    readGameChild<Record<string, Player>>(code, 'players'),
    readGameChild<Record<string, Team>>(code, 'teams'),
  ]);
  if (!meta) throw new Error('Room not found.');
  if (now() - (meta.updatedAt ?? 0) > STALE_MS) throw new Error('This room has expired.');
  if (meta.phase === 'ended') throw new Error('This game has ended.');

  const currentPlayers = players ?? {};
  const currentTeams = teams ?? {};
  const alreadyJoined = Boolean(currentPlayers[uid]);
  const cap = meta.mode === 'ffa'
    ? Math.min(meta.maxPlayers, MAX_PLAYERS_FFA)
    : meta.maxPlayers;
  if (!alreadyJoined && Object.keys(currentPlayers).length >= cap) {
    throw new Error('This room is full.');
  }

  const playerName = name.trim() || 'Contestant';

  if (alreadyJoined) {
    const existing = currentPlayers[uid];
    if (meta.phase === 'lobby') {
      let teamId = existing.teamId ?? '';
      if (meta.mode === 'ffa') {
        teamId = `player_${uid}`;
        if (!currentTeams[teamId]) {
          await set(ref(getRtdb(), gamePath(code, `teams/${teamId}`)), {
            name: playerName,
            color: TEAM_COLORS[Object.keys(currentTeams).length % TEAM_COLORS.length].hex,
            score: 0,
            memberUids: { [uid]: true },
          });
        }
      }
      await set(ref(getRtdb(), gamePath(code, `players/${uid}`)), {
        name: playerName,
        teamId,
        connected: true,
      });
      return;
    }

    await set(ref(getRtdb(), gamePath(code, `players/${uid}/connected`)), true);
    return;
  }

  if (meta.phase === 'lobby') {
    let teamId = '';
    if (meta.mode === 'ffa') {
      teamId = `player_${uid}`;
      await set(ref(getRtdb(), gamePath(code, `teams/${teamId}`)), {
        name: playerName,
        color: TEAM_COLORS[Object.keys(currentTeams).length % TEAM_COLORS.length].hex,
        score: 0,
        memberUids: { [uid]: true },
      });
    }
    await set(ref(getRtdb(), gamePath(code, `players/${uid}`)), {
      name: playerName,
      teamId,
      connected: true,
    });
    return;
  }

  if (meta.mode === 'ffa') {
    const teamId = `player_${uid}`;
    await set(ref(getRtdb(), gamePath(code, `teams/${teamId}`)), {
      name: playerName,
      color: TEAM_COLORS[Object.keys(currentTeams).length % TEAM_COLORS.length].hex,
      score: 0,
      memberUids: { [uid]: true },
    });
    await set(ref(getRtdb(), gamePath(code, `players/${uid}`)), {
      name: playerName,
      teamId,
      connected: true,
    });
    return;
  }

  const occupied = Object.fromEntries(
    Object.entries(currentTeams).filter(([, team]) => teamSize(team) > 0),
  );
  const pool = Object.keys(occupied).length > 0 ? occupied : currentTeams;
  const teamId = pickLateJoinTeamId(pool);
  await set(ref(getRtdb(), gamePath(code, `players/${uid}`)), {
    name: playerName,
    teamId,
    connected: true,
  });
  await set(ref(getRtdb(), gamePath(code, `teams/${teamId}/memberUids/${uid}`)), true);
}

export async function setPlayerConnected(code: string, uid: string, connected: boolean): Promise<void> {
  await set(ref(getRtdb(), gamePath(code, `players/${uid}/connected`)), connected);
}

export async function setLobbyMode(
  code: string,
  hostId: string,
  mode: GameMode,
  teamCount = DEFAULT_TEAM_COUNT,
): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    if (game.meta.phase !== 'lobby') throw new Error('Teams freeze after the game starts.');
    const players = game.players ?? {};
    if (mode === 'ffa' && Object.keys(players).length > MAX_PLAYERS_FFA) {
      throw new Error('Free-for-all is only available with six or fewer players.');
    }

    const nextTeamCount = mode === 'ffa' ? Object.keys(players).length : clamp(teamCount, MIN_TEAMS, MAX_TEAMS);
    const teams = mode === 'ffa'
      ? Object.fromEntries(
          Object.entries(players).map(([uid, player], index) => [
            `player_${uid}`,
            {
              name: player.name,
              color: TEAM_COLORS[index % TEAM_COLORS.length].hex,
              score: 0,
              memberUids: { [uid]: true },
            },
          ]),
        )
      : makeTeams(nextTeamCount);

    Object.entries(players).forEach(([uid, player]) => {
      player.teamId = mode === 'ffa' ? `player_${uid}` : '';
    });

    return {
      ...game,
      meta: {
        ...game.meta,
        mode,
        teamCount: nextTeamCount,
        maxPlayers: mode === 'ffa' ? Math.min(game.meta.maxPlayers, MAX_PLAYERS_FFA) : game.meta.maxPlayers,
        updatedAt: now(),
      },
      players,
      teams,
    };
  });
}

export async function setMaxPlayers(code: string, hostId: string, maxPlayers: number): Promise<void> {
  const game = await readGame(code);
  if (!game) throw new Error('Room not found.');
  assertHost(game, hostId);
  const cap = game.meta.mode === 'ffa' ? MAX_PLAYERS_FFA : MAX_PLAYERS_TEAMS;
  await update(ref(getRtdb(), gamePath(code, 'meta')), {
    maxPlayers: clamp(maxPlayers, MIN_PLAYERS, cap),
    updatedAt: now(),
  });
}

export async function assignPlayerTeam(code: string, uid: string, teamId: string): Promise<void> {
  const [meta, player, teams] = await Promise.all([
    readGameChild<GameMeta>(code, 'meta'),
    readGameChild<Player>(code, `players/${uid}`),
    readGameChild<Record<string, Team>>(code, 'teams'),
  ]);
  if (!meta) throw new Error('Room not found.');
  if (meta.phase !== 'lobby') throw new Error('Teams freeze after the game starts.');
  if (meta.mode === 'ffa') throw new Error('Team selection is disabled in free-for-all.');
  if (!player || !teams?.[teamId]) throw new Error('Invalid team assignment.');

  await update(ref(getRtdb(), gamePath(code, `players/${uid}`)), { teamId });
  await set(ref(getRtdb(), gamePath(code, `teams/${teamId}/memberUids/${uid}`)), true);
  if (player.teamId && player.teamId !== teamId) {
    await set(ref(getRtdb(), gamePath(code, `teams/${player.teamId}/memberUids/${uid}`)), null);
  }
}

export async function autoBalanceTeams(code: string, hostId: string): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    if (game.meta.phase !== 'lobby') throw new Error('Teams freeze after the game starts.');
    if (game.meta.mode === 'ffa') return game;

    const teamIds = Object.keys(game.teams ?? {});
    teamIds.forEach((teamId) => {
      game.teams[teamId].memberUids = {};
    });

    Object.keys(game.players ?? {}).forEach((uid, index) => {
      const cycle = Math.floor(index / teamIds.length);
      const offset = index % teamIds.length;
      const teamId = teamIds[cycle % 2 === 0 ? offset : teamIds.length - 1 - offset];
      game.players[uid].teamId = teamId;
      game.teams[teamId].memberUids[uid] = true;
    });
    game.meta.updatedAt = now();

    return game;
  });
}

export async function startGame(code: string, hostId: string): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    if (game.meta.phase !== 'lobby') throw new Error('Game has already started.');

    if (!hostDevicesReady(game)) {
      throw new Error('Sign in on two devices first: one for the Discord board, one for host controls.');
    }

    const players = Object.entries(game.players ?? {});
    if (players.length < MIN_PLAYERS) throw new Error('At least two contestants are required.');
    if (players.some(([, player]) => !player.teamId)) throw new Error('Every player must be on a team.');

    const teams = Object.fromEntries(
      Object.entries(game.teams ?? {}).filter(([, team]) => Object.keys(team.memberUids ?? {}).length > 0),
    );
    if (Object.keys(teams).length < MIN_PLAYERS) throw new Error('At least two contestant teams are required.');

    const nextGame = { ...game, teams };
    const controlPlayerId = pickRoundOneControl(nextGame);
    const doublePortion = assignDoublePortions();

    return {
      ...nextGame,
      meta: {
        ...game.meta,
        phase: 'board' as Phase,
        teamCount: Object.keys(teams).length,
        updatedAt: now(),
      },
      public: {
        ...game.public,
        controlPlayerId,
      },
      hostOnly: {
        answers: game.hostOnly?.answers ?? { round1: [], round2: [], lastTrumpet: '' },
        clues: game.hostOnly?.clues ?? { round1: [], round2: [] },
        doublePortion,
      },
    };
  });
}

export async function openCell(
  code: string,
  hostId: string,
  round: RoundId,
  cat: number,
  row: number,
  setData?: QuestionSet,
): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    if (game.public.used?.[cellKey(round, cat, row)]) throw new Error('That cell has already been used.');
    if (game.meta.phase !== 'board') throw new Error('A clue is already active.');
    const text =
      game.hostOnly?.clues?.[round]?.[cat]?.[row] ?? setData?.[round].clues[cat]?.[row]?.text;
    if (typeof text !== 'string') throw new Error('Invalid clue.');
    const values = round === 'round1' ? game.public.round1Values : game.public.round2Values;
    const value = values[row];
    const isDoublePortion = Boolean(game.hostOnly?.doublePortion?.[cellKey(round, cat, row)]);
    const publicClue: PublicClue = {
      round,
      cat,
      row,
      text,
      value,
      doublePortion: isDoublePortion,
    };

    return {
      ...game,
      meta: {
        ...game.meta,
        phase: isDoublePortion ? 'doublePortion' : 'clue',
        round,
        updatedAt: now(),
      },
      public: {
        ...game.public,
        currentClue: publicClue,
        buzz: null,
        lockouts: {},
        guessed: {},
        doublePortionWager: null,
        revealedAnswer: null,
      },
      undo: null,
    };
  });
  await clearConfer(code);
}

export async function openBuzzing(code: string, hostId: string): Promise<void> {
  const game = await readGame(code);
  if (!game) throw new Error('Room not found.');
  assertHost(game, hostId);
  await update(ref(getRtdb(), gamePath(code)), {
    'meta/phase': 'buzzOpen',
    'meta/updatedAt': now(),
    'public/buzz': null,
  });
}

export async function buzz(code: string, uid: string): Promise<void> {
  const [meta, gamePublic, player] = await Promise.all([
    readGameChild<GameMeta>(code, 'meta'),
    readGameChild<GamePublic>(code, 'public'),
    readGameChild<Player>(code, `players/${uid}`),
  ]);
  if (!meta || !gamePublic) throw new Error('Room not found.');
  if (!player?.teamId) throw new Error('Player is not on a team.');
  if (meta.phase !== 'buzzOpen') throw new Error('Buzzing is not open.');
  if (gamePublic.lockouts?.[player.teamId]) throw new Error('Your team is locked out for this clue.');

  await runTransaction(ref(getRtdb(), gamePath(code, 'public/buzz')), (current: Buzz | null) => {
    if (current) return current;
    return { teamId: player.teamId, playerId: uid, at: now() };
  });
}

export async function acknowledgeBuzz(code: string, hostId: string): Promise<void> {
  const game = await readGame(code);
  if (!game) throw new Error('Room not found.');
  assertHost(game, hostId);
  if (game.meta.phase !== 'buzzOpen' || !game.public.buzz) return;
  await update(ref(getRtdb(), gamePath(code, 'meta')), {
    phase: 'answering',
    updatedAt: now(),
  });
}

export async function judgeBuzz(code: string, hostId: string, correct: boolean): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    const clue = currentClue(game);
    const buzzValue = game.public.buzz;
    if (!buzzValue) throw new Error('No team has buzzed.');
    const team = game.teams[buzzValue.teamId];
    const undo = snapshotWith(game, correct ? 'correct' : 'incorrect');
    const score = team.score + (correct ? clue.value : -clue.value);

    game.teams[buzzValue.teamId] = { ...team, score };
    game.public.guessed = { ...(game.public.guessed ?? {}), [buzzValue.teamId]: true };
    game.public.lockouts = correct
      ? {}
      : { ...(game.public.lockouts ?? {}), [buzzValue.teamId]: true };
    game.public.buzz = null;

    if (correct) {
      game.public.used = { ...(game.public.used ?? {}), [cellKey(clue.round, clue.cat, clue.row)]: true };
      game.public.controlPlayerId = buzzValue.playerId;
      game.public.currentClue = null;
      game.meta.phase = nextBoardPhase(game);
    } else {
      game.meta.phase = 'buzzOpen';
    }

    game.undo = undo;
    game.meta.updatedAt = now();
    return game;
  });
  if (correct) await clearConfer(code);
}

function nextBoardPhase(game: GameState): Phase {
  if (allCellsUsed(game, 'round1') && game.meta.round === 'round1') {
    game.meta.round = 'round2';
    game.public.controlPlayerId = pickRoundTwoControl(game);
    return 'board';
  }
  if (allCellsUsed(game, 'round2')) return 'lastTrumpetWager';
  return 'board';
}

export async function revealSkip(code: string, hostId: string): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    const clue = currentClue(game);
    game.undo = snapshotWith(game, 'revealSkip');
    game.public.used = { ...(game.public.used ?? {}), [cellKey(clue.round, clue.cat, clue.row)]: true };
    game.public.currentClue = null;
    game.public.buzz = null;
    game.public.lockouts = {};
    game.public.guessed = {};
    game.public.doublePortionWager = null;
    game.meta.phase = nextBoardPhase(game);
    game.meta.updatedAt = now();
    return game;
  });
  await clearConfer(code);
}

export async function anotherRound(code: string, hostId: string): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    if (game.meta.mode === 'ffa') throw new Error('Another round is only available in team mode.');
    const clue = currentClue(game);
    const teamIds = activeTeamIds(game);
    const guessed = game.public.guessed ?? {};
    if (!teamIds.every((teamId) => guessed[teamId])) {
      throw new Error('Every remaining team must guess before another round.');
    }

    game.undo = snapshotWith(game, 'anotherRound');
    teamIds.forEach((teamId) => {
      game.teams[teamId].score += clue.value;
    });
    game.public.lockouts = {};
    game.public.guessed = {};
    game.public.buzz = null;
    game.meta.phase = 'buzzOpen';
    game.meta.updatedAt = now();
    return game;
  });
}

export async function setDoublePortionWager(code: string, uid: string, wager: number): Promise<void> {
  const [meta, gamePublic] = await Promise.all([
    readGameChild<GameMeta>(code, 'meta'),
    readGameChild<GamePublic>(code, 'public'),
  ]);
  if (!meta || !gamePublic) throw new Error('Room not found.');
  const clue = gamePublic.currentClue;
  if (!clue) throw new Error('No clue is currently active.');
  if (!clue.doublePortion || meta.phase !== 'doublePortion') throw new Error('No Double Portion is active.');
  if (uid !== gamePublic.controlPlayerId && uid !== meta.hostId) {
    throw new Error('Only the controlling player can wager.');
  }

  const controlPlayer = await readPlayer(code, gamePublic.controlPlayerId);
  if (!controlPlayer.teamId) throw new Error('Player is not on a team.');
  const team = await readGameChild<Team>(code, `teams/${controlPlayer.teamId}`);
  if (!team) throw new Error('Team not found.');

  const maxWager = Math.max(team.score, getHighestFaceValue(meta.round));
  await set(
    ref(getRtdb(), gamePath(code, 'public/doublePortionWager')),
    clamp(Math.floor(wager), WAGER_FLOOR, maxWager),
  );
}

export async function judgeDoublePortion(code: string, hostId: string, correct: boolean): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    const clue = currentClue(game);
    const wager = game.public.doublePortionWager;
    if (!wager) throw new Error('Set a wager before judging.');
    const teamId = getPlayerTeam(game, game.public.controlPlayerId);
    game.undo = snapshotWith(game, 'doublePortion');
    game.teams[teamId].score += correct ? wager : -wager;
    game.public.used = { ...(game.public.used ?? {}), [cellKey(clue.round, clue.cat, clue.row)]: true };
    game.public.currentClue = null;
    game.public.doublePortionWager = null;
    game.public.lockouts = {};
    game.public.guessed = {};
    game.meta.phase = nextBoardPhase(game);
    game.meta.updatedAt = now();
    return game;
  });
  await clearConfer(code);
}

export async function undoLast(code: string, hostId: string): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    if (!game.undo) return game;

    Object.entries(game.undo.scores).forEach(([teamId, score]) => {
      if (game.teams[teamId]) game.teams[teamId].score = score;
    });
    game.public.lockouts = game.undo.lockouts;
    game.public.guessed = game.undo.guessed;
    game.public.buzz = game.undo.buzz;
    game.public.controlPlayerId = game.undo.controlPlayerId;
    game.public.used = game.undo.used;
    game.public.currentClue = game.undo.currentClue;
    game.public.doublePortionWager = game.undo.doublePortionWager;
    game.public.revealedAnswer = game.undo.revealedAnswer;
    game.meta.phase = game.undo.phase;
    game.meta.round = game.undo.currentClue?.round ?? game.meta.round;
    game.meta.updatedAt = now();
    game.undo = null;
    return game;
  });
}

export async function proposeAnswer(code: string, uid: string, text: string): Promise<void> {
  const teamId = await readPlayerTeamId(code, uid);
  await set(ref(getRtdb(), conferRoot(code, `${teamId}/${uid}`)), {
    text,
    voteUids: {},
  });
}

export async function unproposeAnswer(code: string, uid: string): Promise<void> {
  const teamId = await readPlayerTeamId(code, uid);
  await remove(ref(getRtdb(), conferRoot(code, `${teamId}/${uid}`)));
}

export async function upvoteProposal(code: string, uid: string, proposalUid: string): Promise<void> {
  if (uid === proposalUid) throw new Error('You cannot upvote your own proposal.');
  const teamId = await readPlayerTeamId(code, uid);
  await set(ref(getRtdb(), conferRoot(code, `${teamId}/${proposalUid}/voteUids/${uid}`)), true);
}

export async function startLastTrumpet(code: string, hostId: string): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    const eligible = activeTeamIds(game).filter((teamId) => game.teams[teamId].score > 0);
    game.meta.phase = 'lastTrumpetWager';
    game.public.lastTrumpetLocked = false;
    game.public.revealQueue = [];
    game.public.revealIndex = 0;
    game.lastTrumpet = Object.fromEntries(
      eligible.map((teamId) => [teamId, { wager: 0, answer: '', submittedBy: '' }]),
    );
    game.meta.updatedAt = now();
    return game;
  });
  await clearConfer(code);
}

export async function submitLastTrumpet(
  code: string,
  uid: string,
  wager: number,
  answer: string,
): Promise<void> {
  const [meta, player] = await Promise.all([
    readGameChild<GameMeta>(code, 'meta'),
    readPlayer(code, uid),
  ]);
  if (!meta) throw new Error('Room not found.');
  if (meta.phase !== 'lastTrumpetWager') throw new Error('The Last Trumpet is not accepting answers.');
  if (!player.teamId) throw new Error('Player is not on a team.');
  const team = await readGameChild<Team>(code, `teams/${player.teamId}`);
  const max = Math.max(0, team?.score ?? 0);
  if (max <= 0) throw new Error('This team sits out The Last Trumpet.');
  await set(ref(getRtdb(), gamePath(code, `lastTrumpet/${player.teamId}`)), {
    wager: clamp(Math.floor(wager), 0, max),
    answer,
    submittedBy: uid,
  });
}

export async function lockLastTrumpetAnswers(code: string, hostId: string): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    const queue: RevealEntry[] = activeTeamIds(game)
      .filter((teamId) => game.teams[teamId].score > 0)
      .sort((a, b) => game.teams[a].score - game.teams[b].score)
      .map((teamId) => ({
        teamId,
        wager: game.lastTrumpet?.[teamId]?.wager ?? 0,
        answer: game.lastTrumpet?.[teamId]?.answer ?? '',
        judged: 'pending',
      }));

    game.meta.phase = 'lastTrumpetReveal';
    game.public.lastTrumpetLocked = true;
    game.public.revealQueue = queue;
    game.public.revealIndex = 0;
    game.meta.updatedAt = now();
    return game;
  });
}

export async function judgeLastTrumpet(code: string, hostId: string, correct: boolean): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    const index = game.public.revealIndex ?? 0;
    const entry = game.public.revealQueue?.[index];
    if (!entry) return game;

    game.teams[entry.teamId].score += correct ? entry.wager : -entry.wager;
    game.public.revealQueue[index] = {
      ...entry,
      judged: correct ? 'correct' : 'incorrect',
    };
    game.public.revealIndex = index + 1;
    game.meta.phase = index + 1 >= game.public.revealQueue.length ? 'ended' : 'lastTrumpetReveal';
    game.meta.updatedAt = now();
    return game;
  });
}

export async function reassignControl(code: string, hostId: string, playerId: string): Promise<void> {
  const game = await readGame(code);
  if (!game) throw new Error('Room not found.');
  assertHost(game, hostId);
  await update(ref(getRtdb(), gamePath(code)), {
    'public/controlPlayerId': playerId,
    'meta/updatedAt': now(),
  });
}

export async function playAgain(code: string, hostId: string): Promise<void> {
  await runTransaction(ref(getRtdb(), gamePath(code)), (game: GameState | null) => {
    if (!game) throw new Error('Room not found.');
    assertHost(game, hostId);
    Object.values(game.teams ?? {}).forEach((team) => {
      team.score = 0;
    });
    game.meta.phase = 'board';
    game.meta.round = 'round1';
    game.meta.updatedAt = now();
    game.public = {
      ...game.public,
      used: {},
      currentClue: null,
      controlPlayerId: pickRoundOneControl(game),
      buzz: null,
      lockouts: {},
      guessed: {},
      doublePortionWager: null,
      lastTrumpetLocked: false,
      revealedAnswer: null,
      revealQueue: [],
      revealIndex: 0,
    };
    game.undo = null;
    game.lastTrumpet = {};
    if (game.hostOnly) {
      game.hostOnly = {
        ...game.hostOnly,
        doublePortion: assignDoublePortions(),
      };
    }
    return game;
  });
  await clearConfer(code);
}

export async function endGame(code: string, hostId: string): Promise<void> {
  const game = await readGame(code);
  if (!game) return;
  assertHost(game, hostId);
  await clearConfer(code);
  await remove(ref(getRtdb(), gamePath(code)));
}

export async function getGameSnapshot(code: string): Promise<DataSnapshot> {
  return get(ref(getRtdb(), gamePath(code)));
}

export { clearConferUpdates, scoreUpdates };

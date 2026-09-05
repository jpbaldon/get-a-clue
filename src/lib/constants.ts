export const APP_NAME = 'Get a Clue';
export const ROUND1_LABEL = 'Round 1';
export const ROUND2_LABEL = 'Round 2';
export const DOUBLE_PORTION = 'Double Portion';
export const LAST_TRUMPET = 'The Last Trumpet';

export const CATEGORY_COUNT = 6;
export const ROW_COUNT = 5;
export const ROUND1_VALUES = [200, 400, 600, 800, 1000] as const;
export const ROUND2_VALUES = [400, 800, 1200, 1600, 2000] as const;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS_TEAMS = 24;
export const MAX_PLAYERS_FFA = 6;
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 6;
export const DEFAULT_TEAM_COUNT = 3;
export const DEFAULT_MAX_PLAYERS = 24;

export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const DOUBLE_PORTION_ROUND1_COUNT = 1;
export const DOUBLE_PORTION_ROUND2_COUNT = 2;

export const HOST_DEVICE_STALE_MS = 25_000;
export const HOST_DEVICE_HEARTBEAT_MS = 8_000;
export const DEVICE_ID_STORAGE_KEY = 'get-a-clue-device-id';

export const STALE_MS = 24 * 60 * 60 * 1000;
export const WAGER_FLOOR = 5;

export const TEAM_COLORS = [
  { id: '0', name: 'Blue', hex: '#3b82f6' },
  { id: '1', name: 'Gold', hex: '#e8c547' },
  { id: '2', name: 'Rose', hex: '#f43f5e' },
  { id: '3', name: 'Emerald', hex: '#34d399' },
  { id: '4', name: 'Violet', hex: '#a78bfa' },
  { id: '5', name: 'Amber', hex: '#fb923c' },
] as const;

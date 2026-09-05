'use client';

import { useEffect, useState } from 'react';

import {
  listenBoardGame,
  listenHostGame,
  listenPlayerGame,
  type BoardGameView,
  type PlayerGameView,
} from '@/lib/game';
import type { GameState } from '@/lib/types';

interface UseHostGameResult {
  game: GameState | null;
  loading: boolean;
}

interface UsePlayerGameResult {
  game: PlayerGameView | null;
  loading: boolean;
}

interface UseBoardGameResult {
  game: BoardGameView | null;
  loading: boolean;
}

export function useHostGame(code: string): UseHostGameResult {
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(Boolean(code));

  useEffect(() => {
    if (!code) return undefined;

    return listenHostGame(code.toUpperCase(), (nextGame) => {
      setGame(nextGame);
      setLoading(false);
    });
  }, [code]);

  return { game, loading };
}

export function useBoardGame(code: string): UseBoardGameResult {
  const [game, setGame] = useState<BoardGameView | null>(null);
  const [loading, setLoading] = useState(Boolean(code));

  useEffect(() => {
    if (!code) return undefined;

    return listenBoardGame(code.toUpperCase(), (nextGame) => {
      setGame(nextGame);
      setLoading(false);
    });
  }, [code]);

  return { game, loading };
}

export function usePlayerGame(code: string, uid: string | undefined): UsePlayerGameResult {
  const [game, setGame] = useState<PlayerGameView | null>(null);
  const [loading, setLoading] = useState(Boolean(code && uid));

  useEffect(() => {
    if (!code || !uid) return undefined;

    return listenPlayerGame(code.toUpperCase(), uid, (nextGame) => {
      setGame(nextGame);
      setLoading(false);
    });
  }, [code, uid]);

  return { game, loading };
}

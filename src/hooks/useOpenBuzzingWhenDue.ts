'use client';

import { useEffect } from 'react';

import { openBuzzing } from '@/lib/game';
import type { Phase } from '@/lib/types';

export function useOpenBuzzingWhenDue(
  code: string,
  hostId: string,
  phase: Phase | undefined,
  buzzOpensAt: number | null | undefined,
): void {
  useEffect(() => {
    if (phase !== 'clue' || !buzzOpensAt) return undefined;

    const wait = Math.max(0, buzzOpensAt - Date.now());
    const timer = window.setTimeout(() => {
      void openBuzzing(code, hostId);
    }, wait);

    return () => window.clearTimeout(timer);
  }, [buzzOpensAt, code, hostId, phase]);
}

'use client';

import { useEffect, useState } from 'react';

export function useWholeSecondsRemaining(until: number | null | undefined): number | null {
  const [remaining, setRemaining] = useState<{ at: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!until) return undefined;

    const tick = () => {
      setRemaining({
        at: until,
        seconds: Math.max(0, Math.ceil((until - Date.now()) / 1000)),
      });
    };

    const immediate = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 200);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, [until]);

  if (!until || remaining?.at !== until) return null;
  return remaining.seconds;
}

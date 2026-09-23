'use client';

import {
  DEFAULT_BUZZ_DELAY_SECONDS,
  MAX_BUZZ_DELAY_SECONDS,
  MIN_BUZZ_DELAY_SECONDS,
} from '@/lib/constants';
import { clampBuzzDelaySeconds } from '@/lib/game';

import { TextField } from './ui';

interface BuzzRevealSettingsProps {
  buzzOnReveal: boolean;
  buzzOnDelay: boolean;
  delaySeconds: number;
  onBuzzOnReveal: (enabled: boolean) => void;
  onBuzzOnDelay: (enabled: boolean, seconds: number) => void;
}

export function BuzzRevealSettings({
  buzzOnReveal,
  buzzOnDelay,
  delaySeconds,
  onBuzzOnReveal,
  onBuzzOnDelay,
}: BuzzRevealSettingsProps) {
  const seconds = clampBuzzDelaySeconds(delaySeconds || DEFAULT_BUZZ_DELAY_SECONDS);

  return (
    <div className="flex flex-col gap-2">
      <label
        className="flex cursor-pointer items-center gap-2 text-sm font-bold"
        title="Regular clues open buzzing immediately. Double Portion still waits for a wager."
      >
        <input
          type="checkbox"
          checked={buzzOnReveal}
          onChange={(event) => onBuzzOnReveal(event.target.checked)}
          className="size-4 accent-gold"
        />
        Open buzzing when clues are revealed
      </label>
      <label
        className="flex cursor-pointer items-center gap-2 text-sm font-bold"
        title="Regular clues wait this many whole seconds, then buzzing opens. Double Portion still waits for a wager."
      >
        <input
          type="checkbox"
          checked={buzzOnDelay}
          onChange={(event) => onBuzzOnDelay(event.target.checked, seconds)}
          className="size-4 accent-gold"
        />
        Open buzzing after a delay
      </label>
      <label className={`flex items-center gap-2 text-sm font-bold ${buzzOnDelay ? '' : 'opacity-50'}`}>
        <TextField
          type="number"
          min={MIN_BUZZ_DELAY_SECONDS}
          max={MAX_BUZZ_DELAY_SECONDS}
          step={1}
          disabled={!buzzOnDelay}
          value={seconds}
          onChange={(event) => onBuzzOnDelay(true, clampBuzzDelaySeconds(event.target.value))}
          className="w-20"
        />
        seconds
      </label>
    </div>
  );
}

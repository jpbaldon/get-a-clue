'use client';

import { useWholeSecondsRemaining } from '@/hooks/useWholeSecondsRemaining';
import type { Phase } from '@/lib/types';

interface BuzzOpensInProps {
  phase?: Phase;
  buzzOpensAt?: number | null;
  className?: string;
}

export function BuzzOpensIn({ phase, buzzOpensAt, className = '' }: BuzzOpensInProps) {
  const remaining = useWholeSecondsRemaining(phase === 'clue' ? buzzOpensAt : null);
  if (phase !== 'clue' || !buzzOpensAt || remaining === null) return null;

  return <p className={className}>Buzzing in {remaining}</p>;
}

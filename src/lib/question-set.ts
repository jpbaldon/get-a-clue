import { CATEGORY_COUNT, ROW_COUNT, ROUND1_VALUES, ROUND2_VALUES } from './constants';
import type { Clue, QuestionSet, RoundData, RoundId } from './types';

const emptyClue = (): Clue => ({
  text: '',
  answer: '',
  doublePortion: false,
});

export function emptyRound(round: RoundId): RoundData {
  const values = round === 'round1' ? [...ROUND1_VALUES] : [...ROUND2_VALUES];

  return {
    categories: Array.from({ length: CATEGORY_COUNT }, (_, index) => `Category ${index + 1}`),
    values,
    clues: Array.from({ length: CATEGORY_COUNT }, () =>
      Array.from({ length: ROW_COUNT }, emptyClue),
    ),
  };
}

export function newQuestionSetDraft(ownerId: string): QuestionSet {
  const now = Date.now();

  return {
    id: '',
    ownerId,
    title: 'Untitled Set',
    updatedAt: now,
    round1: emptyRound('round1'),
    round2: emptyRound('round2'),
    lastTrumpet: {
      category: '',
      clue: '',
      answer: '',
    },
  };
}

export function roundComplete(round: RoundData): boolean {
  return (
    round.categories.every((category) => category.trim()) &&
    round.clues.every((category) =>
      category.every((clue) => clue.text.trim() && clue.answer.trim()),
    )
  );
}

export function lastTrumpetComplete(set: Pick<QuestionSet, 'lastTrumpet'>): boolean {
  return Boolean(
    set.lastTrumpet.category.trim() &&
      set.lastTrumpet.clue.trim() &&
      set.lastTrumpet.answer.trim(),
  );
}

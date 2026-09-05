import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import { CATEGORY_COUNT, ROW_COUNT } from './constants';
import { getFs } from './firebase';
import { newQuestionSetDraft } from './question-set';
import { SAMPLE_SET } from './sample-set';
import type { Clue, LastTrumpetData, QuestionSet, RoundData } from './types';

const COLLECTION = 'questionSets';

function clueKey(cat: number, row: number): string {
  return `${cat}:${row}`;
}

function cluesToDoc(clues: Clue[][]): Record<string, Clue> {
  const out: Record<string, Clue> = {};
  clues.forEach((category, cat) => {
    category.forEach((clue, row) => {
      out[clueKey(cat, row)] = clue;
    });
  });
  return out;
}

function cluesFromDoc(raw: unknown): Clue[][] {
  const map =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, Clue>)
      : {};

  return Array.from({ length: CATEGORY_COUNT }, (_, cat) =>
    Array.from({ length: ROW_COUNT }, (_, row) => {
      const clue = map[clueKey(cat, row)];
      return {
        text: clue?.text ?? '',
        answer: clue?.answer ?? '',
        doublePortion: Boolean(clue?.doublePortion),
      };
    }),
  );
}

function encodeRound(round: RoundData) {
  return {
    categories: round.categories,
    values: round.values,
    clues: cluesToDoc(round.clues),
  };
}

interface StoredRound {
  categories?: string[];
  values?: number[];
  clues?: unknown;
}

function decodeRound(raw: StoredRound | undefined): RoundData {
  return {
    categories: raw?.categories ?? Array.from({ length: CATEGORY_COUNT }, () => ''),
    values: raw?.values ?? [],
    clues: cluesFromDoc(raw?.clues),
  };
}

function toFirestore(set: Omit<QuestionSet, 'id'>) {
  return {
    ownerId: set.ownerId,
    title: set.title,
    updatedAt: set.updatedAt,
    round1: encodeRound(set.round1),
    round2: encodeRound(set.round2),
    lastTrumpet: set.lastTrumpet,
  };
}

function normalizeSet(id: string, data: Record<string, unknown>): QuestionSet {
  return {
    id,
    ownerId: String(data.ownerId ?? ''),
    title: String(data.title ?? ''),
    updatedAt: Number(data.updatedAt ?? 0),
    round1: decodeRound(data.round1 as StoredRound | undefined),
    round2: decodeRound(data.round2 as StoredRound | undefined),
    lastTrumpet: {
      category: String((data.lastTrumpet as LastTrumpetData | undefined)?.category ?? ''),
      clue: String((data.lastTrumpet as LastTrumpetData | undefined)?.clue ?? ''),
      answer: String((data.lastTrumpet as LastTrumpetData | undefined)?.answer ?? ''),
    },
  };
}

export async function listSets(ownerId: string): Promise<QuestionSet[]> {
  const snapshot = await getDocs(
    query(collection(getFs(), COLLECTION), where('ownerId', '==', ownerId)),
  );

  return snapshot.docs
    .map((set) => normalizeSet(set.id, set.data() as Record<string, unknown>))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getSet(id: string): Promise<QuestionSet | null> {
  const snapshot = await getDoc(doc(getFs(), COLLECTION, id));
  if (!snapshot.exists()) return null;

  return normalizeSet(snapshot.id, snapshot.data() as Record<string, unknown>);
}

export async function saveSet(set: { id?: string } & Omit<QuestionSet, 'id'>): Promise<string> {
  const { id, ...data } = {
    ...set,
    updatedAt: Date.now(),
  };
  const payload = toFirestore(data);

  if (id) {
    await setDoc(doc(getFs(), COLLECTION, id), payload);
    return id;
  }

  const created = await addDoc(collection(getFs(), COLLECTION), payload);
  return created.id;
}

export async function deleteSet(id: string): Promise<void> {
  await deleteDoc(doc(getFs(), COLLECTION, id));
}

export async function createSet(ownerId: string): Promise<string> {
  return saveSet(newQuestionSetDraft(ownerId));
}

export async function createSampleSet(ownerId: string): Promise<string> {
  return saveSet({
    ...SAMPLE_SET,
    ownerId,
    updatedAt: Date.now(),
  });
}

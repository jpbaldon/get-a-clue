'use client';

import { useCallback, useEffect, useState } from 'react';

import { createSampleSet, createSet, deleteSet, getSet, listSets, saveSet } from '@/lib/sets-api';
import type { QuestionSet } from '@/lib/types';

export function useQuestionSets(ownerId: string | undefined) {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(Boolean(ownerId));

  const refresh = useCallback(async () => {
    if (!ownerId) {
      setSets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSets(await listSets(ownerId));
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  return {
    sets,
    loading,
    refresh,
    createSet: async () => {
      if (!ownerId) throw new Error('Sign in first.');
      const id = await createSet(ownerId);
      await refresh();
      return id;
    },
    createSampleSet: async () => {
      if (!ownerId) throw new Error('Sign in first.');
      const id = await createSampleSet(ownerId);
      await refresh();
      return id;
    },
    deleteSet: async (id: string) => {
      await deleteSet(id);
      await refresh();
    },
  };
}

export function useQuestionSet(id: string | undefined) {
  const [setData, setSetData] = useState<QuestionSet | null>(null);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!id) {
        setSetData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const nextSet = await getSet(id);
      if (ignore) return;
      setSetData(nextSet);
      setLoading(false);
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [id]);

  return {
    setData,
    setSetData,
    loading,
    saveSet,
  };
}

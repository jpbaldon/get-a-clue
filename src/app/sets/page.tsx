'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { SetupBanner } from '@/components/SetupBanner';
import { Button, PageShell, TextField } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useQuestionSets } from '@/hooks/useQuestionSets';
import { createGame } from '@/lib/game';
import { getSet } from '@/lib/sets-api';

export default function SetsPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();
  const { sets, loading: setsLoading, createSet, createSampleSet, deleteSet } = useQuestionSets(user?.uid);
  const [maxPlayers, setMaxPlayers] = useState(24);
  const [error, setError] = useState('');

  const host = async (setId: string) => {
    if (!user) return;
    const setData = await getSet(setId);
    if (!setData) throw new Error('Set not found.');
    const code = await createGame(user.uid, setData, { maxPlayers, mode: 'teams', teamCount: 3 });
    router.push(`/host/${code}`);
  };

  const run = async (action: () => Promise<void | string>) => {
    try {
      setError('');
      const id = await action();
      if (typeof id === 'string') router.push(`/sets/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <PageShell>
      <SetupBanner />
      {!user && !loading ? (
        <section className="mx-auto max-w-xl rounded-2xl border border-cream/15 bg-white/5 p-6 text-center">
          <h1 className="mb-4 text-3xl font-black text-gold">Host sign-in</h1>
          <Button onClick={() => void signInWithGoogle()}>Sign in with Google</Button>
        </section>
      ) : null}
      {user ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-4xl font-black text-gold">Question Sets</h1>
              <p className="text-cream/75">Create and edit boards, then start a room.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void run(createSet)}>New set</Button>
              <Button variant="secondary" onClick={() => void run(createSampleSet)}>
                Add sample set
              </Button>
            </div>
          </div>
          <label className="block max-w-xs text-sm font-bold">
            Join cap
            <TextField
              type="number"
              min={2}
              max={24}
              value={maxPlayers}
              onChange={(event) => setMaxPlayers(Number(event.target.value))}
              className="mt-1 w-full"
            />
          </label>
          {error ? <p className="rounded-xl bg-red-900/50 p-3 text-red-100">{error}</p> : null}
          {setsLoading ? <p>Loading sets...</p> : null}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sets.map((setData) => (
              <article key={setData.id} className="rounded-2xl border border-cream/15 bg-white/5 p-4">
                <h2 className="mb-1 text-2xl font-black">{setData.title}</h2>
                <p className="mb-4 text-sm text-cream/60">
                  Updated {new Date(setData.updatedAt).toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link className="rounded-xl border border-cream/30 px-4 py-2 font-bold hover:bg-white/10" href={`/sets/${setData.id}`}>
                    Edit
                  </Link>
                  <Button onClick={() => void run(() => host(setData.id))}>Host</Button>
                  <Button variant="danger" onClick={() => void run(() => deleteSet(setData.id))}>
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}

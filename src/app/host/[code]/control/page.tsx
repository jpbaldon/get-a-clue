'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { HostControl } from '@/components/HostControl';
import { HostLobby } from '@/components/HostLobby';
import { Button, PageShell } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useHostGame } from '@/hooks/useGame';
import { HOST_DEVICE_HEARTBEAT_MS } from '@/lib/constants';
import { claimHostDevice, getHostDeviceId, hostOpenGame } from '@/lib/game';
import { getSet } from '@/lib/sets-api';
import type { QuestionSet } from '@/lib/types';

export default function HostControlPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code.toUpperCase();
  const { user, loading, signInWithGoogle } = useAuth();
  const { game, loading: gameLoading } = useHostGame(code);
  const [setData, setSetData] = useState<QuestionSet | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!user) return;
      try {
        const exists = await hostOpenGame(code, user.uid);
        if (!exists) throw new Error('Room not found.');
        await claimHostDevice(code, user.uid, 'control', getHostDeviceId());
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Could not open controls.');
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [code, user]);

  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setInterval(() => {
      void claimHostDevice(code, user.uid, 'control', getHostDeviceId()).catch(() => undefined);
    }, HOST_DEVICE_HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [code, user]);

  useEffect(() => {
    let ignore = false;

    async function loadSet() {
      if (!game?.meta?.setId) return;
      const loaded = await getSet(game.meta.setId);
      if (!ignore) setSetData(loaded);
    }

    void loadSet();
    return () => {
      ignore = true;
    };
  }, [game?.meta?.setId]);

  return (
    <PageShell>
      {!user && !loading ? (
        <section className="mx-auto max-w-xl rounded-2xl border border-cream/15 bg-white/5 p-6 text-center">
          <h1 className="mb-4 text-3xl font-black text-gold">Host sign-in</h1>
          <Button onClick={() => void signInWithGoogle()}>Sign in with Google</Button>
        </section>
      ) : null}
      {error ? <p className="rounded-xl bg-red-900/50 p-3 text-red-100">{error}</p> : null}
      {gameLoading ? <p>Loading room...</p> : null}
      {user && !gameLoading && !game ? (
        <section className="rounded-2xl border border-cream/15 bg-white/5 p-6 text-center">
          <h1 className="mb-4 text-3xl font-black text-gold">Room not found</h1>
          <Button onClick={() => router.push('/sets')}>Back to sets</Button>
        </section>
      ) : null}
      {user && game && game.meta.phase === 'lobby' ? (
        <HostLobby code={code} hostId={user.uid} game={game} />
      ) : null}
      {user && game && game.meta.phase !== 'lobby' && setData ? (
        <HostControl code={code} hostId={user.uid} game={game} setData={setData} />
      ) : null}
    </PageShell>
  );
}

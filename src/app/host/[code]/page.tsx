'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { HostPairing } from '@/components/HostPairing';
import { Button, PageShell } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useBoardGame } from '@/hooks/useGame';
import { hostOpenGame } from '@/lib/game';

export default function HostPairingPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code.toUpperCase();
  const { user, loading, signInWithGoogle } = useAuth();
  const { game, loading: gameLoading } = useBoardGame(code);
  const [error, setError] = useState('');
  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!user) return;
      try {
        const exists = await hostOpenGame(code, user.uid);
        if (!ignore && !exists) setError('Room not found.');
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Could not open room.');
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [code, user]);

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
      {user && !gameLoading && !game?.meta ? (
        <section className="rounded-2xl border border-cream/15 bg-white/5 p-6 text-center">
          <h1 className="mb-4 text-3xl font-black text-gold">Room not found</h1>
          <Button onClick={() => router.push('/sets')}>Back to sets</Button>
        </section>
      ) : null}
      {user && game?.meta ? (
        <HostPairing
          code={code}
          hostId={user.uid}
          boardReady={Boolean(game.public?.boardReady)}
          controlReady={Boolean(game.public?.controlReady)}
          origin={origin}
        />
      ) : null}
    </PageShell>
  );
}

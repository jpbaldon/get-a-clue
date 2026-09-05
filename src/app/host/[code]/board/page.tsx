'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { HostBoard } from '@/components/HostBoard';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useBoardGame } from '@/hooks/useGame';
import { HOST_DEVICE_HEARTBEAT_MS } from '@/lib/constants';
import { claimHostDevice, getHostDeviceId, hostOpenGame } from '@/lib/game';

export default function HostBoardPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code.toUpperCase();
  const { user, loading, signInWithGoogle } = useAuth();
  const { game, loading: gameLoading } = useBoardGame(code);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!user) return;
      try {
        const exists = await hostOpenGame(code, user.uid);
        if (!exists) throw new Error('Room not found.');
        await claimHostDevice(code, user.uid, 'board', getHostDeviceId());
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Could not open the board.');
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
      void claimHostDevice(code, user.uid, 'board', getHostDeviceId()).catch(() => undefined);
    }, HOST_DEVICE_HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [code, user]);

  if (!user && !loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-navy p-6 text-cream">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-black text-gold">Host sign-in</h1>
          <Button onClick={() => void signInWithGoogle()}>Sign in with Google</Button>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-navy p-6 text-cream">
        <p className="rounded-xl bg-red-900/50 p-3 text-red-100">{error}</p>
        <Button onClick={() => router.push(`/host/${code}`)}>Back to pairing</Button>
      </main>
    );
  }

  if (!user || gameLoading || !game?.meta) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-navy text-cream">
        Loading board...
      </main>
    );
  }

  return <HostBoard code={code} hostId={user.uid} game={game} />;
}

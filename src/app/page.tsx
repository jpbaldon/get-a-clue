'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { SetupBanner } from '@/components/SetupBanner';
import { Button, PageShell, TextField } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { describeFirebaseError, firebaseConfigured, isIpHostname } from '@/lib/firebase';

export default function Home() {
  const router = useRouter();
  const { user, loading, signInAsPlayer, signInWithGoogle, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const configured = firebaseConfigured();
  const ipHost = typeof window !== 'undefined' && isIpHostname(window.location.hostname);

  const join = async () => {
    try {
      setError('');
      if (!user) await signInAsPlayer();
      localStorage.setItem('get-a-clue-player-name', name.trim() || 'Contestant');
      router.push(`/play/${code.trim().toUpperCase()}`);
    } catch (err) {
      setError(describeFirebaseError(err));
    }
  };

  return (
    <PageShell>
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        {!configured ? (
          <div className="lg:col-span-2">
            <SetupBanner />
          </div>
        ) : null}
        <section className="rounded-3xl border border-gold/30 bg-white/5 p-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-gold">Host</p>
          <h1 className="mb-4 text-5xl font-black">Get a Clue</h1>
          <p className="mb-6 text-cream/80">
            Create question sets, start a room, and screen share the host board for your group.
          </p>
          {user ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => router.push('/sets')}>Manage sets</Button>
              <Button variant="secondary" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          ) : (
            <Button
              disabled={!configured || loading}
              onClick={() => void signInWithGoogle().then(() => router.push('/sets'))}
            >
              Sign in with Google
            </Button>
          )}
        </section>
        <section className="rounded-3xl border border-cream/15 bg-white/5 p-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-gold">Play</p>
          <h2 className="mb-4 text-4xl font-black">Join a room</h2>
          <div className="space-y-3">
            <TextField
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full"
            />
            <TextField
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Room code"
              maxLength={6}
              className="w-full text-center text-3xl font-black tracking-widest"
            />
            <Button
              disabled={!configured || code.trim().length !== 6}
              onClick={() => void join()}
              className="w-full"
            >
              Join
            </Button>
            {ipHost ? (
              <p className="text-sm text-gold">
                This page is on a LAN IP. Firebase will not let this device sign in here. Open
                localhost on this computer, or use a named URL (Vercel or a tunnel) added to
                Firebase authorized domains.
              </p>
            ) : null}
            {error ? <p className="rounded-xl bg-red-900/50 p-3 text-red-100">{error}</p> : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

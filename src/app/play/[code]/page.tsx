'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { PlayerLobby } from '@/components/PlayerLobby';
import { PlayerPlay } from '@/components/PlayerPlay';
import { Button, PageShell, TextField } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { usePlayerGame } from '@/hooks/useGame';
import { joinGame, setPlayerConnected } from '@/lib/game';
import { describeFirebaseError } from '@/lib/firebase';

const PLAYER_NAME_KEY = 'get-a-clue-player-name';

function subscribePlayerName(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

function readPlayerName() {
  return localStorage.getItem(PLAYER_NAME_KEY) ?? '';
}

export default function PlayerRoomPage() {
  const params = useParams<{ code: string }>();
  const code = params.code.toUpperCase();
  const { user, loading, signInAsPlayer } = useAuth();
  const { game, loading: gameLoading } = usePlayerGame(code, user?.uid);
  const [error, setError] = useState('');
  const storedName = useSyncExternalStore(subscribePlayerName, readPlayerName, () => '');
  const [name, setName] = useState<string | undefined>(undefined);
  const nameValue = name ?? storedName;

  useEffect(() => {
    let ignore = false;

    async function join() {
      if (!user) return;
      const playerName = localStorage.getItem(PLAYER_NAME_KEY) ?? 'Contestant';
      try {
        await joinGame(code, user.uid, playerName);
      } catch (err) {
        if (!ignore) setError(describeFirebaseError(err));
      }
    }

    void join();

    return () => {
      ignore = true;
      if (user) void setPlayerConnected(code, user.uid, false);
    };
  }, [code, user]);

  return (
    <PageShell showSetsLink={false}>
      {!user && !loading ? (
        <section className="mx-auto max-w-xl rounded-2xl border border-cream/15 bg-white/5 p-6 text-center">
          <h1 className="mb-4 text-3xl font-black text-gold">Join room {code}</h1>
          <div className="space-y-3">
            <TextField
              value={nameValue}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full"
            />
            <Button
              disabled={!nameValue.trim()}
              onClick={() => {
                localStorage.setItem(PLAYER_NAME_KEY, nameValue.trim());
                void signInAsPlayer().catch((err) => setError(describeFirebaseError(err)));
              }}
            >
              Continue as player
            </Button>
          </div>
        </section>
      ) : null}
      {error ? <p className="rounded-xl bg-red-900/50 p-3 text-red-100">{error}</p> : null}
      {gameLoading ? <p>Loading room...</p> : null}
      {user && game && game.meta?.phase === 'lobby' ? (
        <PlayerLobby code={code} uid={user.uid} game={game} />
      ) : null}
      {user && game && game.meta && game.meta.phase !== 'lobby' && game.players[user.uid] ? (
        <PlayerPlay code={code} uid={user.uid} game={game} />
      ) : null}
      {user && game && game.meta && game.meta.phase !== 'lobby' && !game.players[user.uid] && !error ? (
        <p>Joining the game...</p>
      ) : null}
    </PageShell>
  );
}

'use client';

import { useState } from 'react';

import { assignPlayerTeam, teamsAreLocked } from '@/lib/game';
import type { PlayerGameView } from '@/lib/game';

interface PlayerLobbyProps {
  code: string;
  uid: string;
  game: PlayerGameView;
}

export function PlayerLobby({ code, uid, game }: PlayerLobbyProps) {
  const player = game.players[uid];
  const locked = teamsAreLocked(game.meta);
  const ffa = game.meta?.mode === 'ffa';
  const canPickTeam = !ffa && !locked;
  const [error, setError] = useState('');

  const chooseTeam = async (teamId: string) => {
    try {
      setError('');
      await assignPlayerTeam(code, uid, teamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join that team.');
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl rounded-2xl border border-cream/15 bg-white/5 p-6">
      <h2 className="mb-2 text-3xl font-black text-gold">Lobby</h2>
      <p className="mb-6 text-cream/80">
        {ffa
          ? 'Waiting for the host to start.'
          : locked
            ? player?.teamId
              ? 'The host has locked teams. You cannot switch teams.'
              : 'The host has locked teams. Wait to be placed.'
            : 'Waiting for the host to start. Choose your team column.'}
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(game.teams).map(([teamId, team]) => (
          <button
            key={teamId}
            disabled={!canPickTeam}
            onClick={() => void chooseTeam(teamId)}
            className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed ${
              player?.teamId === teamId
                ? 'border-gold bg-gold/10'
                : 'border-cream/15 bg-black/20 hover:bg-white/10 disabled:hover:bg-black/20'
            }`}
          >
            <h3 className="text-xl font-black" style={{ color: team.color }}>
              {team.name}
            </h3>
            <p className="mt-2 text-sm text-cream/70">
              {Object.keys(team.memberUids ?? {}).length} contestant(s)
            </p>
          </button>
        ))}
      </div>
      {ffa ? (
        <p className="mt-4 text-sm text-cream/70">The host selected free-for-all, so each player is solo.</p>
      ) : null}
      {error ? <p className="mt-4 text-red-200">{error}</p> : null}
    </section>
  );
}

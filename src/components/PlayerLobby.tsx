'use client';

import { assignPlayerTeam } from '@/lib/game';
import type { PlayerGameView } from '@/lib/game';

interface PlayerLobbyProps {
  code: string;
  uid: string;
  game: PlayerGameView;
}

export function PlayerLobby({ code, uid, game }: PlayerLobbyProps) {
  const player = game.players[uid];

  return (
    <section className="mx-auto w-full max-w-3xl rounded-2xl border border-cream/15 bg-white/5 p-6">
      <h2 className="mb-2 text-3xl font-black text-gold">Lobby</h2>
      <p className="mb-6 text-cream/80">Waiting for the host to start. Choose your team column.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(game.teams).map(([teamId, team]) => (
          <button
            key={teamId}
            disabled={game.meta?.mode === 'ffa'}
            onClick={() => void assignPlayerTeam(code, uid, teamId)}
            className={`rounded-2xl border p-4 text-left transition ${
              player?.teamId === teamId
                ? 'border-gold bg-gold/10'
                : 'border-cream/15 bg-black/20 hover:bg-white/10'
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
      {game.meta?.mode === 'ffa' ? (
        <p className="mt-4 text-sm text-cream/70">The host selected free-for-all, so each player is solo.</p>
      ) : null}
    </section>
  );
}

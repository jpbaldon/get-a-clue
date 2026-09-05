'use client';

import { useState } from 'react';

import { assignPlayerTeam, autoBalanceTeams, hostDevicesReady, setLobbyMode, setMaxPlayers, startGame } from '@/lib/game';
import type { GameMode, GameState } from '@/lib/types';

import { Button, TextField } from './ui';

interface HostLobbyProps {
  code: string;
  hostId: string;
  game: GameState;
}

export function HostLobby({ code, hostId, game }: HostLobbyProps) {
  const [mode, setMode] = useState<GameMode>(game.meta.mode);
  const [teamCount, setTeamCount] = useState(game.meta.teamCount || 3);
  const [cap, setCap] = useState(game.meta.maxPlayers);
  const [error, setError] = useState('');
  const players = Object.entries(game.players ?? {});

  const run = async (action: () => Promise<void>) => {
    try {
      setError('');
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-cream/15 bg-white/5 p-4">
        <h2 className="mb-1 text-2xl font-black text-gold">Lobby controls</h2>
        <p className="mb-4 text-sm text-cream/70">
          Contestants see the lobby on the board screen. Room {code}.
        </p>
        <label className="mb-2 block text-sm font-bold">Mode</label>
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as GameMode)}
          className="mb-3 w-full rounded-xl border border-cream/30 bg-navy-2 px-3 py-2"
        >
          <option value="teams">Teams</option>
          <option value="ffa">Free-for-all</option>
        </select>
        <label className="mb-2 block text-sm font-bold">Team count</label>
        <TextField
          type="number"
          min={2}
          max={6}
          value={teamCount}
          disabled={mode === 'ffa'}
          onChange={(event) => setTeamCount(Number(event.target.value))}
          className="mb-3 w-full"
        />
        <label className="mb-2 block text-sm font-bold">Join cap</label>
        <TextField
          type="number"
          min={2}
          max={24}
          value={cap}
          onChange={(event) => setCap(Number(event.target.value))}
          className="mb-4 w-full"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void run(() => setLobbyMode(code, hostId, mode, teamCount))}>
            Apply lobby settings
          </Button>
          <Button variant="secondary" onClick={() => void run(() => setMaxPlayers(code, hostId, cap))}>
            Set cap
          </Button>
          <Button variant="secondary" onClick={() => void run(() => autoBalanceTeams(code, hostId))}>
            Auto-balance
          </Button>
          <Button disabled={!hostDevicesReady(game)} onClick={() => void run(() => startGame(code, hostId))}>
            Start game
          </Button>
        </div>
        {!hostDevicesReady(game) ? (
          <p className="mt-3 text-sm text-gold">
            Open the board URL on a second device before starting.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-red-200">{error}</p> : null}
      </div>

      {players.length > 0 && game.meta.mode === 'teams' ? (
        <div className="rounded-2xl border border-cream/15 bg-white/5 p-4">
          <h4 className="mb-3 font-black text-gold">Move players</h4>
          <ul className="max-w-md space-y-2">
            {players.map(([uid, player]) => (
              <li key={uid}>
                <label className="flex items-center gap-3 text-sm">
                  <span className="w-36 shrink-0 truncate font-bold">{player.name}</span>
                  <select
                    value={player.teamId}
                    onChange={(event) => void assignPlayerTeam(code, uid, event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-cream/30 bg-navy-2 px-2 py-1"
                  >
                    {Object.entries(game.teams ?? {}).map(([teamId, team]) => (
                      <option key={teamId} value={teamId}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

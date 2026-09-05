'use client';

import { useState } from 'react';

import { DOUBLE_PORTION, LAST_TRUMPET, WAGER_FLOOR } from '@/lib/constants';
import { buzz, setDoublePortionWager, submitLastTrumpet } from '@/lib/game';
import type { PlayerGameView } from '@/lib/game';

import { Conferral } from './Conferral';
import { Scoreboard } from './Scoreboard';
import { Button, TextField } from './ui';

interface PlayerPlayProps {
  code: string;
  uid: string;
  game: PlayerGameView;
}

export function PlayerPlay({ code, uid, game }: PlayerPlayProps) {
  const [wager, setWager] = useState(0);
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const clue = game.public?.currentClue;
  const player = game.players[uid];
  const team = player ? game.teams[player.teamId] : null;
  const isControl = game.public?.controlPlayerId === uid;
  const teamLocked = Boolean(player?.teamId && game.public?.lockouts?.[player.teamId]);
  const canBuzz = game.meta?.phase === 'buzzOpen' && !teamLocked && !game.public?.buzz;
  const showConferral =
    Boolean(player?.teamId) &&
    game.meta?.mode === 'teams' &&
    (Boolean(clue) || game.meta?.phase === 'lastTrumpetWager');
  const isAnswering = game.meta?.phase === 'answering' || (game.meta?.phase === 'buzzOpen' && Boolean(game.public?.buzz));

  const run = async (action: () => Promise<void>) => {
    try {
      setMessage('');
      await action();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <Scoreboard
        teams={game.teams}
        players={game.players}
        controlPlayerId={game.public?.controlPlayerId}
      />
      {team ? (
        <p className="text-center text-cream/80">
          You are on <span className="font-bold" style={{ color: team.color }}>{team.name}</span>.
        </p>
      ) : null}

      {game.meta?.phase === 'board' ? (
        <section className="rounded-2xl border border-cream/15 bg-white/5 p-6 text-center">
          <p className="text-sm uppercase tracking-wide text-cream/60">Control</p>
          <h2 className="text-3xl font-black text-gold">
            {game.players[game.public?.controlPlayerId ?? '']?.name ?? 'Waiting for host'}
          </h2>
          <p className="mt-3 text-cream/80">The controlling player names a cell on Discord.</p>
        </section>
      ) : null}

      {clue ? (
        <section className="rounded-2xl border border-gold/30 bg-blue-950 p-6 text-center">
          <p className="mb-2 text-sm font-bold uppercase text-gold">
            {clue.doublePortion ? DOUBLE_PORTION : `$${clue.value}`}
          </p>
          <h2 className="mb-6 text-4xl font-black">{clue.text}</h2>

          {game.meta?.phase === 'buzzOpen' && !game.public?.buzz ? (
            <Button
              disabled={!canBuzz}
              onClick={() => void run(() => buzz(code, uid))}
              className="min-h-40 w-full rounded-full text-5xl shadow-2xl"
            >
              BUZZ
            </Button>
          ) : null}

          {isAnswering ? (
            <p className="text-2xl font-black text-gold">
              {game.public?.buzz?.playerId === uid
                ? 'You buzzed first. Answer out loud on Discord.'
                : `${game.players[game.public?.buzz?.playerId ?? '']?.name ?? 'A contestant'} is answering.`}
            </p>
          ) : null}

          {game.meta?.phase === 'doublePortion' ? (
            <div className="mx-auto max-w-md space-y-3">
              <p className="text-lg text-cream/80">
                {isControl
                  ? 'Set your wager. Your teammates can see it and confer on the answer.'
                  : `Waiting for ${game.players[game.public?.controlPlayerId ?? '']?.name ?? 'the controller'} to wager.`}
              </p>
              <p className="text-xl font-black text-gold">
                Current wager: {game.public?.doublePortionWager === null ? 'not set' : `$${game.public?.doublePortionWager}`}
              </p>
              {isControl ? (
                <div className="flex gap-2">
                  <TextField
                    type="number"
                    min={WAGER_FLOOR}
                    max={Math.max(team?.score ?? 0, clue.value)}
                    value={wager}
                    onChange={(event) => setWager(Number(event.target.value))}
                    className="flex-1"
                  />
                  <Button onClick={() => void run(() => setDoublePortionWager(code, uid, wager))}>
                    Set wager
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {showConferral && player ? (
        <Conferral
          code={code}
          uid={uid}
          teamId={player.teamId}
          players={game.players}
          proposals={game.myConfer}
        />
      ) : null}

      {game.meta?.phase === 'lastTrumpetWager' ? (
        <section className="rounded-2xl border border-gold/30 bg-white/5 p-6">
          <h2 className="mb-2 text-3xl font-black text-gold">{LAST_TRUMPET}</h2>
          <p className="mb-2 text-xl">{game.public?.lastTrumpetCategory}</p>
          <p className="mb-4 text-3xl font-black">{game.public?.lastTrumpetClue}</p>
          {(team?.score ?? 0) <= 0 ? (
            <p>Your team sits out because its score is not above zero.</p>
          ) : (
            <div className="space-y-3">
              <TextField
                type="number"
                min={0}
                max={team?.score ?? 0}
                value={wager}
                onChange={(event) => setWager(Number(event.target.value))}
                className="w-full"
              />
              <TextField
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Your answer"
                className="w-full"
              />
              <Button onClick={() => void run(() => submitLastTrumpet(code, uid, wager, answer))}>
                Submit
              </Button>
              {game.myLastTrumpet ? (
                <p className="text-sm text-cream/70">
                  Submitted wager ${game.myLastTrumpet.wager} by{' '}
                  {game.players[game.myLastTrumpet.submittedBy]?.name ?? 'teammate'}.
                </p>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {game.meta?.phase === 'lastTrumpetReveal' ? (
        <section className="rounded-2xl border border-gold/30 bg-white/5 p-6 text-center">
          <h2 className="text-3xl font-black text-gold">{LAST_TRUMPET} reveal</h2>
          <p className="mt-2 text-cream/80">The host is revealing answers from lowest score first.</p>
        </section>
      ) : null}

      {game.meta?.phase === 'ended' ? (
        <section className="rounded-2xl border border-gold/30 bg-white/5 p-6 text-center">
          <h2 className="text-4xl font-black text-gold">Game complete</h2>
        </section>
      ) : null}

      {message ? <p className="rounded-xl bg-red-900/50 p-3 text-red-100">{message}</p> : null}
    </div>
  );
}

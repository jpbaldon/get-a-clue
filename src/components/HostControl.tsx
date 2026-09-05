'use client';

import { useEffect, useState } from 'react';

import {
  acknowledgeBuzz,
  anotherRound,
  endGame,
  judgeBuzz,
  judgeDoublePortion,
  judgeLastTrumpet,
  lockLastTrumpetAnswers,
  openBuzzing,
  openCell,
  playAgain,
  revealSkip,
  startLastTrumpet,
  undoLast,
} from '@/lib/game';
import { DOUBLE_PORTION, LAST_TRUMPET } from '@/lib/constants';
import type { GameState, QuestionSet, RoundId } from '@/lib/types';

import { Board } from './Board';
import { Scoreboard } from './Scoreboard';
import { Button } from './ui';

interface HostControlProps {
  code: string;
  hostId: string;
  game: GameState;
  setData: QuestionSet;
}

export function HostControl({ code, hostId, game, setData }: HostControlProps) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const clue = game.public.currentClue;
  const buzz = game.public.buzz;
  const answer = clue ? game.hostOnly?.answers[clue.round][clue.cat][clue.row] : '';
  const activeTeamIds = Object.entries(game.teams).filter(([, team]) => Object.keys(team.memberUids ?? {}).length > 0);
  const everyTeamGuessed = activeTeamIds.every(([teamId]) => game.public.guessed?.[teamId]);
  const round = game.meta.round;
  const categories = round === 'round1' ? game.public.round1Categories : game.public.round2Categories;
  const values = round === 'round1' ? game.public.round1Values : game.public.round2Values;

  useEffect(() => {
    if (game.meta.phase === 'buzzOpen' && buzz) {
      void acknowledgeBuzz(code, hostId);
    }
  }, [buzz, code, game.meta.phase, hostId]);

  const cellOpened = (nextRound: RoundId, cat: number, row: number) => {
    void openCell(code, hostId, nextRound, cat, row, setData);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-cream/70">
        Host controls. Answers stay on this screen. Share the board screen, not this one.
      </p>
      <Scoreboard teams={game.teams} players={game.players} controlPlayerId={game.public.controlPlayerId} />
      <section className="rounded-2xl border border-cream/15 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-cream/60">Control</p>
            <p className="text-xl font-black text-gold">
              {game.players[game.public.controlPlayerId]?.name ?? 'No controller'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={!game.undo} onClick={() => void undoLast(code, hostId)}>
              Undo
            </Button>
            <Button variant="danger" onClick={() => setConfirmEnd(true)}>
              End game
            </Button>
          </div>
        </div>
      </section>

      {game.meta.phase === 'board' && categories?.length && values?.length ? (
        <Board
          round={round}
          categories={categories}
          values={values}
          used={game.public.used}
          phase={game.meta.phase}
          onOpen={cellOpened}
        />
      ) : null}

      {clue ? (
        <section className="rounded-2xl border border-gold/30 bg-blue-950 p-6 text-center">
          <p className="mb-2 text-sm font-bold uppercase text-gold">
            {clue.doublePortion ? DOUBLE_PORTION : `$${clue.value}`}
          </p>
          <h2 className="mb-5 text-4xl font-black">{clue.text}</h2>
          <p className="mb-5 rounded-xl bg-black/30 p-3 text-xl text-gold">Answer: {answer}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {game.meta.phase === 'clue' ? (
              <Button onClick={() => void openBuzzing(code, hostId)}>Open buzzing</Button>
            ) : null}
            {game.meta.phase === 'buzzOpen' && !buzz ? (
              <p className="w-full text-lg text-cream/80">Buzzing is open.</p>
            ) : null}
            {(game.meta.phase === 'answering' || game.meta.phase === 'buzzOpen') && buzz ? (
              <>
                <p className="w-full text-lg text-cream/80">
                  Answering: {game.teams[buzz.teamId]?.name} via {game.players[buzz.playerId]?.name}
                </p>
                <Button onClick={() => void judgeBuzz(code, hostId, true)}>Correct</Button>
                <Button variant="danger" onClick={() => void judgeBuzz(code, hostId, false)}>
                  Incorrect
                </Button>
              </>
            ) : null}
            {game.meta.phase === 'doublePortion' ? (
              <>
                <p className="w-full text-lg text-cream/80">
                  Wager: {game.public.doublePortionWager === null ? 'waiting' : `$${game.public.doublePortionWager}`}
                </p>
                <Button disabled={game.public.doublePortionWager === null} onClick={() => void judgeDoublePortion(code, hostId, true)}>
                  Correct
                </Button>
                <Button
                  variant="danger"
                  disabled={game.public.doublePortionWager === null}
                  onClick={() => void judgeDoublePortion(code, hostId, false)}
                >
                  Incorrect
                </Button>
              </>
            ) : null}
            <Button variant="secondary" onClick={() => void revealSkip(code, hostId)}>
              Reveal/skip
            </Button>
            <Button
              variant="secondary"
              disabled={game.meta.mode === 'ffa' || !everyTeamGuessed}
              onClick={() => void anotherRound(code, hostId)}
            >
              Another round
            </Button>
          </div>
        </section>
      ) : null}

      {game.meta.phase === 'lastTrumpetWager' ? (
        <section className="rounded-2xl border border-gold/30 bg-white/5 p-6">
          <h2 className="mb-2 text-3xl font-black text-gold">{LAST_TRUMPET}</h2>
          <p className="mb-4 text-xl">{setData.lastTrumpet.category}</p>
          <p className="mb-4 text-3xl font-black">{setData.lastTrumpet.clue}</p>
          <p className="mb-4 text-gold">Answer: {game.hostOnly?.answers.lastTrumpet}</p>
          <Button onClick={() => void lockLastTrumpetAnswers(code, hostId)}>Lock answers</Button>
        </section>
      ) : null}

      {game.meta.phase === 'lastTrumpetReveal' ? (
        <section className="rounded-2xl border border-gold/30 bg-white/5 p-6">
          <h2 className="mb-4 text-3xl font-black text-gold">{LAST_TRUMPET} Reveal</h2>
          {game.public.revealQueue[game.public.revealIndex] ? (
            <div className="space-y-3">
              <p className="text-xl">
                {game.teams[game.public.revealQueue[game.public.revealIndex].teamId]?.name}
              </p>
              <p>Wager: ${game.public.revealQueue[game.public.revealIndex].wager}</p>
              <p>Answer: {game.public.revealQueue[game.public.revealIndex].answer || '(blank)'}</p>
              <Button onClick={() => void judgeLastTrumpet(code, hostId, true)}>Correct</Button>
              <Button variant="danger" onClick={() => void judgeLastTrumpet(code, hostId, false)}>
                Incorrect
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {game.meta.phase === 'ended' ? (
        <section className="rounded-2xl border border-gold/30 bg-white/5 p-6 text-center">
          <h2 className="mb-4 text-4xl font-black text-gold">Game complete</h2>
          <div className="flex justify-center gap-2">
            <Button onClick={() => void playAgain(code, hostId)}>Play again</Button>
            <Button variant="danger" onClick={() => setConfirmEnd(true)}>
              End game
            </Button>
          </div>
        </section>
      ) : null}

      {confirmEnd ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gold/30 bg-navy p-6 text-center shadow-2xl">
            <h2 className="mb-2 text-2xl font-black text-gold">End this game?</h2>
            <p className="mb-5 text-cream/80">This closes the room for everyone.</p>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setConfirmEnd(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmEnd(false);
                  void endGame(code, hostId);
                }}
              >
                End game
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {game.meta.phase === 'board' && Object.keys(game.public.used ?? {}).length >= 60 ? (
        <Button onClick={() => void startLastTrumpet(code, hostId)}>Start {LAST_TRUMPET}</Button>
      ) : null}
    </div>
  );
}

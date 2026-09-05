'use client';

import { DOUBLE_PORTION, LAST_TRUMPET, ROUND1_LABEL, ROUND2_LABEL } from '@/lib/constants';
import { openCell, type BoardGameView } from '@/lib/game';
import type { RoundId } from '@/lib/types';

import { Board } from './Board';
import { BoardLobby } from './BoardLobby';
import { Scoreboard } from './Scoreboard';

interface HostBoardProps {
  code: string;
  hostId: string;
  game: BoardGameView;
}

export function HostBoard({ code, hostId, game }: HostBoardProps) {
  const round = game.meta?.round ?? 'round1';
  const categories = round === 'round1' ? game.public?.round1Categories : game.public?.round2Categories;
  const values = round === 'round1' ? game.public?.round1Values : game.public?.round2Values;
  const clue = game.public?.currentClue;
  const phase = game.meta?.phase ?? 'lobby';

  const cellOpened = (nextRound: RoundId, cat: number, row: number) => {
    void openCell(code, hostId, nextRound, cat, row);
  };

  return (
    <div className="flex h-dvh min-h-0 flex-col gap-2 overflow-hidden bg-navy p-3 text-cream">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <p className="text-2xl font-black text-gold">
          {phase === 'lobby'
            ? 'Lobby'
            : phase === 'lastTrumpetWager' || phase === 'lastTrumpetReveal' || phase === 'ended'
              ? LAST_TRUMPET
              : round === 'round1'
                ? ROUND1_LABEL
                : ROUND2_LABEL}
        </p>
        {phase === 'lobby' ? (
          <p className="text-sm text-cream/70">Share this screen</p>
        ) : (
          <p className="text-sm text-cream/70">
            Control: {game.players[game.public?.controlPlayerId ?? '']?.name ?? '—'}
          </p>
        )}
      </div>
      {phase === 'lobby' ? <BoardLobby game={game} /> : null}

      {phase !== 'lobby' ? (
        <Scoreboard
          compact
          teams={game.teams}
          players={game.players}
          controlPlayerId={game.public?.controlPlayerId}
        />
      ) : null}

      {phase === 'board' && categories?.length && values?.length ? (
        <Board
          fill
          round={round}
          categories={categories}
          values={values}
          used={game.public?.used}
          phase={phase}
          onOpen={cellOpened}
        />
      ) : null}

      {clue && phase !== 'board' && phase !== 'lastTrumpetWager' && phase !== 'lastTrumpetReveal' && phase !== 'ended' ? (
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-gold/30 bg-blue-950 p-6 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-gold">
            {clue.doublePortion ? DOUBLE_PORTION : `$${clue.value}`}
          </p>
          <h2 className="max-w-5xl text-[clamp(1.5rem,4.5vw,4rem)] font-black leading-tight">{clue.text}</h2>
        </section>
      ) : null}

      {phase === 'lastTrumpetWager' ? (
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-gold/30 bg-blue-950 p-6 text-center">
          <p className="mb-2 text-xl text-gold">{game.public?.lastTrumpetCategory}</p>
          <h2 className="max-w-5xl text-[clamp(1.5rem,4.5vw,4rem)] font-black leading-tight">
            {game.public?.lastTrumpetClue}
          </h2>
        </section>
      ) : null}

      {phase === 'lastTrumpetReveal' ? (
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-gold/30 bg-blue-950 p-6 text-center">
          <h2 className="mb-4 text-4xl font-black text-gold">{LAST_TRUMPET} reveal</h2>
          {game.public?.revealQueue?.[game.public.revealIndex] ? (
            <div className="space-y-3 text-2xl">
              <p>{game.teams[game.public.revealQueue[game.public.revealIndex].teamId]?.name}</p>
              <p>Wager: ${game.public.revealQueue[game.public.revealIndex].wager}</p>
              <p>Answer: {game.public.revealQueue[game.public.revealIndex].answer || '(blank)'}</p>
            </div>
          ) : (
            <p>All teams have been judged.</p>
          )}
        </section>
      ) : null}

      {phase === 'ended' ? (
        <section className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-gold/30 bg-blue-950 p-6 text-center">
          <h2 className="text-5xl font-black text-gold">Game complete</h2>
        </section>
      ) : null}
    </div>
  );
}

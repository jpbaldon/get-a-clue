'use client';

import { useState } from 'react';

import { proposeAnswer, unproposeAnswer, upvoteProposal } from '@/lib/game';
import type { Player, Proposal } from '@/lib/types';

import { Button, TextField } from './ui';

interface ConferralProps {
  code: string;
  uid: string;
  teamId: string;
  players: Record<string, Player>;
  proposals: Record<string, Proposal>;
}

export function Conferral({ code, uid, teamId, players, proposals }: ConferralProps) {
  const [text, setText] = useState('');
  const memberCount = Object.values(players).filter((player) => player.teamId === teamId).length;
  if (memberCount <= 1) return null;

  const myProposal = proposals[uid];

  return (
    <section className="rounded-2xl border border-cream/15 bg-white/5 p-4">
      <h3 className="mb-3 text-xl font-black text-gold">Team conferral</h3>
      <div className="mb-4 flex gap-2">
        <TextField
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Propose an answer"
          className="flex-1"
        />
        <Button
          disabled={!text.trim()}
          onClick={() => {
            void proposeAnswer(code, uid, text.trim()).then(() => setText(''));
          }}
        >
          Propose
        </Button>
        {myProposal ? (
          <Button variant="secondary" onClick={() => void unproposeAnswer(code, uid)}>
            Unpropose
          </Button>
        ) : null}
      </div>
      <div className="space-y-2">
        {Object.entries(proposals).map(([proposalUid, proposal]) => (
          <article key={proposalUid} className="rounded-xl bg-black/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-bold">{players[proposalUid]?.name ?? 'Teammate'}</p>
                <p className="text-cream/85">{proposal.text}</p>
              </div>
              <Button
                variant="secondary"
                disabled={proposalUid === uid || Boolean(proposal.voteUids?.[uid])}
                onClick={() => void upvoteProposal(code, uid, proposalUid)}
              >
                {Object.keys(proposal.voteUids ?? {}).length} votes
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

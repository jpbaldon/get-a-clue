import type { BoardGameView } from '@/lib/game';

interface BoardLobbyProps {
  game: BoardGameView;
}

export function BoardLobby({ game }: BoardLobbyProps) {
  const code = game.meta?.roomCode ?? '';
  const players = Object.entries(game.players ?? {});
  const teams = Object.entries(game.teams ?? {});

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="shrink-0 text-center">
        <p className="text-sm uppercase tracking-widest text-cream/70">Join with this room code</p>
        <p className="mt-2 text-[clamp(3rem,12vw,8rem)] font-black leading-none tracking-widest text-gold">
          {code}
        </p>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-hidden lg:grid-cols-3">
        {teams.map(([teamId, team]) => {
          const memberIds = Object.keys(team.memberUids ?? {});
          return (
            <article
              key={teamId}
              className="flex min-h-0 flex-col rounded-2xl border border-cream/15 bg-white/5 p-4"
            >
              <h3 className="shrink-0 text-2xl font-black" style={{ color: team.color }}>
                {team.name}
              </h3>
              <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-auto text-lg">
                {memberIds.length === 0 ? (
                  <li className="text-cream/50">Waiting for contestants</li>
                ) : (
                  memberIds.map((uid) => (
                    <li key={uid}>{game.players[uid]?.name ?? 'Contestant'}</li>
                  ))
                )}
              </ul>
            </article>
          );
        })}
      </div>
      {players.length === 0 && teams.length === 0 ? (
        <p className="text-center text-xl text-cream/70">Waiting for contestants to join.</p>
      ) : null}
    </section>
  );
}

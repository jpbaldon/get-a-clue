import type { Player, Team } from '@/lib/types';

interface ScoreboardProps {
  teams: Record<string, Team>;
  players: Record<string, Player>;
  controlPlayerId?: string;
  compact?: boolean;
}

export function Scoreboard({ teams, players, controlPlayerId = '', compact = false }: ScoreboardProps) {
  return (
    <section className={`grid gap-3 ${compact ? 'grid-cols-2 lg:grid-cols-6' : 'md:grid-cols-3'}`}>
      {Object.entries(teams).map(([teamId, team]) => {
        const members = Object.keys(team.memberUids ?? {});
        const hasControl = members.includes(controlPlayerId);

        return (
          <article
            key={teamId}
            className={`rounded-2xl border ${compact ? 'px-3 py-2' : 'p-4'} ${
              hasControl ? 'border-gold bg-gold/10' : 'border-cream/15 bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className={`font-black ${compact ? 'text-sm' : 'text-xl'}`} style={{ color: team.color }}>
                {team.name}
              </h3>
              <div className={`font-black text-gold ${compact ? 'text-xl' : 'text-3xl'}`}>${team.score}</div>
            </div>
            {compact ? null : (
              <>
                {hasControl ? <p className="mb-2 text-sm font-bold text-gold">In control</p> : null}
                <ul className="space-y-1 text-sm text-cream/80">
                  {members.map((uid) => (
                    <li key={uid}>
                      {players[uid]?.name ?? 'Contestant'} {players[uid]?.connected ? '' : '(offline)'}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </article>
        );
      })}
    </section>
  );
}

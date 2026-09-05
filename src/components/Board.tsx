import { ROUND1_LABEL, ROUND2_LABEL } from '@/lib/constants';
import type { Phase, RoundId } from '@/lib/types';
import { cellKey } from '@/lib/types';

interface BoardProps {
  round: RoundId;
  categories: string[];
  values: number[];
  used?: Record<string, boolean>;
  phase: Phase;
  onOpen?: (round: RoundId, cat: number, row: number) => void;
  fill?: boolean;
}

export function Board({ round, categories, values, used, phase, onOpen, fill = false }: BoardProps) {
  const canOpen = Boolean(onOpen) && phase === 'board';

  return (
    <section className={fill ? 'flex min-h-0 flex-1 flex-col' : 'rounded-2xl border border-gold/30 bg-blue-950/40 p-4'}>
      {fill ? null : (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-gold">
            {round === 'round1' ? ROUND1_LABEL : ROUND2_LABEL}
          </h2>
          <p className="text-sm text-cream/70">Click the cell named by the controlling player.</p>
        </div>
      )}
      <div
        className={
          fill
            ? 'grid min-h-0 flex-1 grid-cols-6 gap-1.5'
            : 'grid grid-cols-6 gap-2'
        }
        style={fill ? { gridTemplateRows: `auto repeat(${values.length}, minmax(0, 1fr))` } : undefined}
      >
        {categories.map((category) => (
          <div
            key={category}
            className={`flex items-center justify-center rounded-xl bg-blue-950 p-2 text-center font-black uppercase text-gold ${
              fill ? 'min-h-0 text-[clamp(0.7rem,1.6vw,1.25rem)] leading-tight' : 'min-h-20 text-lg'
            }`}
          >
            {category}
          </div>
        ))}
        {values.map((value, row) =>
          categories.map((_, cat) => {
            const usedCell = Boolean(used?.[cellKey(round, cat, row)]);
            const clickable = canOpen && !usedCell;

            return (
              <button
                key={`${cat}-${row}`}
                type="button"
                disabled={!clickable}
                onClick={() => onOpen?.(round, cat, row)}
                className={`rounded-xl border font-black shadow-lg transition disabled:opacity-100 ${
                  fill
                    ? 'min-h-0 text-[clamp(2.25rem,7.5vw,6.5rem)]'
                    : 'min-h-28 text-6xl'
                } ${
                  usedCell
                    ? 'cursor-default border-gold/10 bg-blue-950/50 text-gold/35'
                    : 'cursor-pointer border-gold/50 bg-blue-900 text-gold hover:bg-blue-700'
                }`}
              >
                ${value}
              </button>
            );
          }),
        )}
      </div>
    </section>
  );
}

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
    <section className={fill ? 'flex min-h-0 flex-1 flex-col' : 'rounded-2xl border border-gold/30 bg-blue-950/40 p-2 sm:p-4'}>
      {fill ? null : (
        <div className="mb-3 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-black text-gold sm:text-2xl">
            {round === 'round1' ? ROUND1_LABEL : ROUND2_LABEL}
          </h2>
          <p className="text-xs text-cream/70 sm:text-sm">Click the cell named by the controlling player.</p>
        </div>
      )}
      <div
        className={
          fill
            ? 'grid min-h-0 flex-1 grid-cols-6 gap-1.5'
            : 'grid min-w-0 grid-cols-6 gap-1 sm:gap-2'
        }
        style={fill ? { gridTemplateRows: `auto repeat(${values.length}, minmax(0, 1fr))` } : undefined}
      >
        {categories.map((category, cat) => (
          <div
            key={cat}
            title={category}
            className={`flex min-w-0 items-center justify-center overflow-hidden rounded-xl bg-blue-950 text-center font-black uppercase leading-tight text-gold ${
              fill
                ? 'min-h-0 p-2 text-[clamp(0.7rem,1.6vw,1.25rem)]'
                : 'board-header-cell min-h-12 px-1 py-2 sm:min-h-14 sm:px-2'
            }`}
          >
            {fill ? category : <span className="board-header-text">{category}</span>}
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
                className={`flex min-w-0 items-center justify-center overflow-hidden rounded-xl border font-black leading-none shadow-lg transition disabled:opacity-100 ${
                  fill
                    ? 'board-fill-cell px-1'
                    : 'min-h-12 px-0.5 text-xs sm:min-h-16 sm:text-xl md:min-h-20 md:text-3xl'
                } ${
                  usedCell
                    ? 'cursor-default border-gold/10 bg-blue-950/50 text-gold/35'
                    : 'cursor-pointer border-gold/50 bg-blue-900 text-gold hover:bg-blue-700'
                }`}
              >
                {fill ? <span className="board-fill-value">${value}</span> : `$${value}`}
              </button>
            );
          }),
        )}
      </div>
    </section>
  );
}

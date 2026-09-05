'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, PageShell, TextField } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useQuestionSet } from '@/hooks/useQuestionSets';
import { LAST_TRUMPET, ROUND1_LABEL, ROUND2_LABEL } from '@/lib/constants';
import { lastTrumpetComplete, roundComplete } from '@/lib/question-set';
import type { QuestionSet, RoundId } from '@/lib/types';

function updateRoundField(
  setData: QuestionSet,
  round: RoundId,
  cat: number,
  row: number,
  field: 'text' | 'answer',
  value: string,
): QuestionSet {
  return {
    ...setData,
    [round]: {
      ...setData[round],
      clues: setData[round].clues.map((category, catIndex) =>
        category.map((clue, rowIndex) =>
          catIndex === cat && rowIndex === row ? { ...clue, [field]: value } : clue,
        ),
      ),
    },
  };
}

export default function SetEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { setData, setSetData, loading, saveSet } = useQuestionSet(params.id);
  const [message, setMessage] = useState('');

  const updateSet = (updater: (setData: QuestionSet) => QuestionSet) => {
    if (!setData) return;
    setSetData(updater(setData));
  };

  const save = async () => {
    if (!setData || !user) return;
    const id = await saveSet({ ...setData, ownerId: user.uid });
    setMessage('Saved.');
    router.replace(`/sets/${id}`);
  };

  return (
    <PageShell>
      {loading ? <p>Loading set...</p> : null}
      {setData ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <label className="mb-2 block text-sm font-bold">Set title</label>
              <TextField
                value={setData.title}
                onChange={(event) => updateSet((current) => ({ ...current, title: event.target.value }))}
                className="w-full min-w-80 text-2xl font-black"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!roundComplete(setData.round1) || !roundComplete(setData.round2) || !lastTrumpetComplete(setData)}
                onClick={() => void save()}
              >
                Save set
              </Button>
              <Button variant="secondary" onClick={() => router.push('/sets')}>
                Back
              </Button>
            </div>
          </div>
          {message ? <p className="rounded-xl bg-green-900/50 p-3 text-green-100">{message}</p> : null}
          {(['round1', 'round2'] as const).map((round) => (
            <section key={round} className="rounded-2xl border border-cream/15 bg-white/5 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-3xl font-black text-gold">
                  {round === 'round1' ? ROUND1_LABEL : ROUND2_LABEL}
                </h2>
                <p className="text-sm text-cream/70">
                  Double Portion cells are chosen at random when the game starts.
                </p>
              </div>
              <div className="grid min-w-[1100px] grid-cols-6 gap-2 overflow-x-auto">
                {setData[round].categories.map((category, cat) => (
                  <TextField
                    key={cat}
                    value={category}
                    onChange={(event) =>
                      updateSet((current) => ({
                        ...current,
                        [round]: {
                          ...current[round],
                          categories: current[round].categories.map((item, index) =>
                            index === cat ? event.target.value : item,
                          ),
                        },
                      }))
                    }
                    className="font-black"
                  />
                ))}
                {setData[round].clues[0].map((_, row) =>
                  setData[round].categories.map((_, cat) => {
                    const clue = setData[round].clues[cat][row];

                    return (
                      <div key={`${cat}-${row}`} className="space-y-2 rounded-xl bg-black/20 p-2">
                        <p className="text-center text-xl font-black text-gold">${setData[round].values[row]}</p>
                        <textarea
                          value={clue.text}
                          onChange={(event) =>
                            updateSet((current) =>
                              updateRoundField(current, round, cat, row, 'text', event.target.value),
                            )
                          }
                          placeholder="Clue"
                          className="h-24 w-full rounded-lg border border-cream/20 bg-navy-2 p-2"
                        />
                        <textarea
                          value={clue.answer}
                          onChange={(event) =>
                            updateSet((current) =>
                              updateRoundField(current, round, cat, row, 'answer', event.target.value),
                            )
                          }
                          placeholder="Answer"
                          className="h-20 w-full rounded-lg border border-cream/20 bg-navy-2 p-2"
                        />
                      </div>
                    );
                  }),
                )}
              </div>
            </section>
          ))}
          <section className="rounded-2xl border border-gold/30 bg-white/5 p-4">
            <h2 className="mb-4 text-3xl font-black text-gold">{LAST_TRUMPET}</h2>
            <div className="grid gap-3">
              <TextField
                value={setData.lastTrumpet.category}
                onChange={(event) =>
                  updateSet((current) => ({
                    ...current,
                    lastTrumpet: { ...current.lastTrumpet, category: event.target.value },
                  }))
                }
                placeholder="Category"
              />
              <textarea
                value={setData.lastTrumpet.clue}
                onChange={(event) =>
                  updateSet((current) => ({
                    ...current,
                    lastTrumpet: { ...current.lastTrumpet, clue: event.target.value },
                  }))
                }
                placeholder="Clue"
                className="h-28 rounded-lg border border-cream/20 bg-navy-2 p-2"
              />
              <textarea
                value={setData.lastTrumpet.answer}
                onChange={(event) =>
                  updateSet((current) => ({
                    ...current,
                    lastTrumpet: { ...current.lastTrumpet, answer: event.target.value },
                  }))
                }
                placeholder="Answer"
                className="h-24 rounded-lg border border-cream/20 bg-navy-2 p-2"
              />
            </div>
          </section>
        </section>
      ) : null}
    </PageShell>
  );
}

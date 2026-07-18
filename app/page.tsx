"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { formatResidentName } from "../lib/format";
import { useFeedback, useResidents } from "../lib/storage";
import type { FeedbackPerspective } from "../lib/types";

const PLAY_PROMPTS = [
  "Choose a game!",
  "Let’s play!",
  "Ready for today’s memory exercise?",
];
const PLAY_PROMPT = PLAY_PROMPTS[Math.floor(Math.random() * PLAY_PROMPTS.length)];

export default function Home() {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const { residents, addResident, removeResident, updateResident } = useResidents();
  const { feedbackEntries, addFeedback } = useFeedback();
  const [newName, setNewName] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackPerspective, setFeedbackPerspective] =
    useState<FeedbackPerspective>("friend");
  const [feedbackRating, setFeedbackRating] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const router = useRouter();
  const rowActionBaseClass =
    "h-10 sm:h-11 w-32 sm:w-36 inline-flex items-center justify-center rounded-xl text-sm sm:text-base font-semibold active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed";
  const gameActionClass =
    "min-h-16 w-full px-4 inline-flex items-center justify-center rounded-2xl text-lg sm:text-xl font-semibold active:scale-95 transition text-center leading-tight shadow-sm";

  function handleAdd() {
    const normalizedName = formatResidentName(newName);
    if (!normalizedName) return;
    addResident(normalizedName);
    setNewName("");
  }

  function handlePlay(id: string) {
    router.push(`/play/${id}`);
  }

  function startEdit(id: string, currentName: string) {
    setConfirmRemove(null);
    setEditingResidentId(id);
    setEditingName(currentName);
  }

  function cancelEdit() {
    setEditingResidentId(null);
    setEditingName("");
  }

  function saveEdit(id: string) {
    if (updateResident(id, formatResidentName(editingName))) {
      cancelEdit();
    }
  }

  function handleFeedbackSubmit() {
    const trimmedNotes = feedbackNotes.trim();
    if (!trimmedNotes) return;

    addFeedback(feedbackName, feedbackPerspective, feedbackRating, trimmedNotes);
    setFeedbackSaved(true);
    setFeedbackName("");
    setFeedbackPerspective("friend");
    setFeedbackRating(4);
    setFeedbackNotes("");
  }

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-sky-50 p-4 font-sans sm:p-8">
        <p className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Memory Lane
        </p>
        <p className="mt-4 text-center text-lg text-slate-600">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 p-4 font-sans sm:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Memory Lane
        </h1>

        {residents.length === 0 ? (
          <section className="mx-auto mt-8 max-w-xl rounded-3xl border border-sky-200 bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Welcome!</h2>
              <p className="mt-3 text-lg text-slate-600 sm:text-xl">
                Add a resident to begin.
              </p>

              <div className="mt-8 space-y-4">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="Resident name"
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none"
                  aria-label="Resident name"
                />
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="w-full rounded-xl bg-blue-700 px-7 py-3 text-lg font-semibold text-white transition hover:bg-blue-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add Resident
                </button>
              </div>
            </div>
          </section>
        ) : (
          <>
            <ul className="mb-8 mt-6 space-y-5">
              {residents.map((r) => (
                <li key={r.id} className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
                    {residents.length === 1
                      ? `Welcome back, ${formatResidentName(r.name)}!`
                      : formatResidentName(r.name)}
                  </h2>
                  <p className="mb-6 mt-10 text-center text-xl text-slate-700 sm:text-2xl">
                    {PLAY_PROMPT}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <button
                      onClick={() => handlePlay(r.id)}
                      className={`${gameActionClass} bg-blue-600 text-white hover:bg-blue-700`}
                    >
                      Recall
                    </button>
                    <button
                      onClick={() => router.push(`/games/pair-match/${r.id}`)}
                      className={`${gameActionClass} bg-indigo-600 text-white hover:bg-indigo-700`}
                    >
                      Pair Match
                    </button>
                    <button
                      onClick={() => router.push(`/games/sequence-recall/${r.id}`)}
                      className={`${gameActionClass} bg-violet-600 text-white hover:bg-violet-700`}
                    >
                      Sequence Recall
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <details className="rounded-2xl border border-slate-300 bg-white shadow-sm">
              <summary className="cursor-pointer rounded-2xl px-5 py-4 text-lg font-semibold text-slate-700 hover:bg-slate-50">
                Tester &amp; Admin
              </summary>
              <div className="space-y-6 border-t border-slate-200 p-5 sm:p-6">
                <section>
                  <h2 className="mb-4 text-xl font-semibold">Manage Residents</h2>
                  <ul className="space-y-3">
                    {residents.map((r) => (
                      <li key={r.id} className="rounded-xl border border-slate-200 p-4">
                        {editingResidentId === r.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(r.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="mb-3 w-full rounded-xl border-2 border-slate-300 px-3 py-2 text-xl font-semibold focus:border-blue-500 focus:outline-none"
                            aria-label={`Edit name for ${formatResidentName(r.name)}`}
                            autoFocus
                          />
                        ) : (
                          <p className="mb-3 text-xl font-semibold">{formatResidentName(r.name)}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => router.push(`/history/${r.id}`)}
                      className={`${rowActionBaseClass} bg-slate-200 text-slate-700 hover:bg-slate-300`}
                      disabled={editingResidentId === r.id}
                    >
                      View History
                    </button>
                    {editingResidentId === r.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(r.id)}
                          disabled={!editingName.trim()}
                          className={`${rowActionBaseClass} bg-green-600 text-white hover:bg-green-700`}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className={`${rowActionBaseClass} bg-slate-300 text-slate-700 hover:bg-slate-400`}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(r.id, r.name)}
                        className={`${rowActionBaseClass} bg-amber-100 text-amber-700 hover:bg-amber-200`}
                      >
                        Edit Resident
                      </button>
                    )}
                    {confirmRemove === r.id ? (
                      <>
                        <button
                          onClick={() => {
                            removeResident(r.id);
                            setConfirmRemove(null);
                          }}
                          className={`${rowActionBaseClass} bg-red-500 text-white hover:bg-red-600`}
                        >
                          Delete Resident?
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className={`${rowActionBaseClass} bg-slate-300 text-slate-700 hover:bg-slate-400`}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(r.id)}
                        className={`${rowActionBaseClass} bg-slate-200 text-slate-600 hover:bg-slate-300`}
                        disabled={editingResidentId === r.id}
                        aria-label={`Remove ${formatResidentName(r.name)}`}
                      >
                        Delete
                      </button>
                    )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="border-t border-slate-200 pt-6">
                  <h2 className="mb-4 text-xl font-semibold">Add Resident</h2>
                  <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="Resident name"
                      className="flex-1 rounded-xl border-2 border-slate-300 px-4 py-2.5 text-base focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                      className="rounded-xl bg-green-600 px-6 py-2.5 text-base font-semibold text-white transition hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add
                </button>
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-xl font-semibold">Playtest Feedback</h2>
            <p className="text-sm text-slate-500">
              Capture thoughts from friends, caregivers, clinicians, and devs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={feedbackName}
              onChange={(e) => setFeedbackName(e.target.value)}
              placeholder="Name (optional)"
              className="border-2 border-slate-300 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-blue-500"
            />
            <select
              value={feedbackPerspective}
              onChange={(e) => setFeedbackPerspective(e.target.value as FeedbackPerspective)}
              className="border-2 border-slate-300 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="friend">Friend</option>
              <option value="resident">Resident</option>
              <option value="caregiver">Caregiver</option>
              <option value="clinician">Clinician</option>
              <option value="developer">Developer</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 mb-3">
            <textarea
              value={feedbackNotes}
              onChange={(e) => {
                setFeedbackSaved(false);
                setFeedbackNotes(e.target.value);
              }}
              rows={3}
              placeholder="What worked, what was confusing, and what should change next?"
              className="border-2 border-slate-300 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-blue-500 resize-y"
            />
            <div className="flex sm:flex-col items-center sm:items-stretch gap-2 sm:w-40">
              <label className="text-sm text-slate-600">Ease</label>
              <select
                value={feedbackRating}
                onChange={(e) =>
                  setFeedbackRating(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                }
                className="border-2 border-slate-300 rounded-xl px-3 py-2 text-base focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value={1}>1 - Very hard</option>
                <option value={2}>2 - Hard</option>
                <option value={3}>3 - Neutral</option>
                <option value={4}>4 - Easy</option>
                <option value={5}>5 - Very easy</option>
              </select>
              <button
                onClick={handleFeedbackSubmit}
                disabled={!feedbackNotes.trim()}
                className="px-4 py-2.5 bg-sky-600 text-white rounded-xl text-base font-semibold hover:bg-sky-700 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Note
              </button>
            </div>
          </div>

          {feedbackSaved ? (
            <p className="text-sm text-emerald-700 mb-3">Feedback saved for this device.</p>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-700 mb-2">Recent Notes</p>
            {feedbackEntries.length === 0 ? (
              <p className="text-sm text-slate-500">No feedback yet.</p>
            ) : (
              <ul className="space-y-2 max-h-44 overflow-y-auto">
                {[...feedbackEntries]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 5)
                  .map((entry) => (
                    <li key={entry.id} className="text-sm text-slate-700">
                      <span className="font-semibold">{entry.name}</span> ({entry.perspective}, {entry.rating}/5): {entry.notes}
                    </li>
                  ))}
              </ul>
            )}
          </div>
                </section>
              </div>
            </details>
          </>
        )}
      </div>
    </main>
  );
}

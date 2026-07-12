"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFeedback, useResidents } from "../lib/storage";
import type { FeedbackPerspective } from "../lib/types";

export default function Home() {
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
    "h-10 sm:h-11 w-full px-1 sm:px-2 inline-flex items-center justify-center rounded-xl text-[11px] sm:text-sm font-semibold active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed text-center whitespace-nowrap leading-none";

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addResident(trimmed);
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
    if (updateResident(id, editingName)) {
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

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Memory Lane</h1>
        <p className="text-center text-base text-slate-500 mb-8">
          {residents.length === 0
            ? "Add a resident to begin"
            : "Select a resident to begin"}
        </p>

        <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900 shadow-sm">
          <p className="text-sm sm:text-base font-semibold text-center">
            Choose or Add a resident, then tap a Play button to start.
          </p>
        </div>

        {residents.length === 0 ? (
          <p className="text-center text-base text-slate-400 mb-8">
            No residents added yet. Add one below.
          </p>
        ) : (
          <ul className="space-y-4 mb-10">
            {residents.map((r) => (
              <li
                key={r.id}
                className={`bg-white rounded-2xl shadow-md p-4 sm:p-5 flex flex-col gap-4 ${
                  editingResidentId === r.id
                    ? ""
                    : "lg:flex-row lg:items-center lg:justify-between"
                }`}
              >
                {editingResidentId === r.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(r.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="text-xl sm:text-2xl font-semibold border-2 border-slate-300 rounded-xl px-3 py-2 w-full min-h-12 focus:outline-none focus:border-blue-500"
                    aria-label={`Edit name for ${r.name}`}
                    autoFocus
                  />
                ) : (
                  <div className="w-full lg:w-auto">
                    <span
                      className="text-xl sm:text-2xl font-semibold w-full lg:w-auto whitespace-normal break-words block"
                      title={r.name}
                    >
                      {r.name}
                    </span>
                    <p className="text-sm text-slate-500 mt-1">
                      Tap any Play button below to launch a game.
                    </p>
                  </div>
                )}
                <div className="w-full lg:w-auto space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_1.2fr] sm:grid-cols-3 gap-2 sm:gap-3 w-full">
                    <button
                      onClick={() => handlePlay(r.id)}
                      className={`${gameActionClass} bg-blue-600 text-white hover:bg-blue-700`}
                      disabled={editingResidentId === r.id}
                    >
                      Recall
                    </button>
                    <button
                      onClick={() => router.push(`/games/pair-match/${r.id}`)}
                      className={`${gameActionClass} bg-indigo-600 text-white hover:bg-indigo-700`}
                      disabled={editingResidentId === r.id}
                    >
                      Pair Match
                    </button>
                    <button
                      onClick={() => router.push(`/games/sequence-recall/${r.id}`)}
                      className={`${gameActionClass} bg-violet-600 text-white hover:bg-violet-700`}
                      disabled={editingResidentId === r.id}
                    >
                      Sequence Recall
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full justify-start lg:justify-end">
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
                        aria-label={`Remove ${r.name}`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="bg-white rounded-2xl shadow-md p-6">
          <p className="text-xl font-semibold mb-4">Add Resident</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Resident name"
              className="flex-1 border-2 border-slate-300 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-base font-semibold hover:bg-green-700 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <p className="text-xl font-semibold">Playtest Feedback</p>
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
        </div>
      </div>
    </main>
  );
}

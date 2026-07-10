"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useResidents } from "../lib/storage";

export default function Home() {
  const { residents, addResident, removeResident, updateResident } = useResidents();
  const [newName, setNewName] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [editingResidentId, setEditingResidentId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const router = useRouter();
  const rowActionBaseClass =
    "h-10 sm:h-11 w-28 sm:w-32 inline-flex items-center justify-center rounded-xl text-sm sm:text-base font-semibold active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed";
  const rowActionWideClass =
    "h-10 sm:h-11 w-36 sm:w-40 px-4 inline-flex items-center justify-center rounded-xl text-sm sm:text-base font-semibold active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed";

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

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Memory Lane</h1>
        <p className="text-center text-base text-slate-500 mb-8">
          Select a resident to begin
        </p>

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
                  <span
                    className="text-xl sm:text-2xl font-semibold w-full lg:w-auto whitespace-normal break-words"
                    title={r.name}
                  >
                    {r.name}
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-start lg:justify-end">
                  <button
                    onClick={() => handlePlay(r.id)}
                    className={`${rowActionBaseClass} bg-blue-600 text-white hover:bg-blue-700`}
                    disabled={editingResidentId === r.id}
                  >
                    Recall
                  </button>
                  <button
                    onClick={() => router.push(`/games/pair-match/${r.id}`)}
                    className={`${rowActionBaseClass} bg-indigo-600 text-white hover:bg-indigo-700`}
                    disabled={editingResidentId === r.id}
                  >
                    Pair Match
                  </button>
                  <button
                    onClick={() => router.push(`/games/sequence-recall/${r.id}`)}
                    className={`${rowActionWideClass} bg-violet-600 text-white hover:bg-violet-700`}
                    disabled={editingResidentId === r.id}
                  >
                    Sequence Recall
                  </button>
                  <button
                    onClick={() => router.push(`/history/${r.id}`)}
                    className={`${rowActionBaseClass} bg-slate-200 text-slate-700 hover:bg-slate-300`}
                    disabled={editingResidentId === r.id}
                  >
                    History
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
                      Edit
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
                        Confirm
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
                      ✕
                    </button>
                  )}
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
      </div>
    </main>
  );
}

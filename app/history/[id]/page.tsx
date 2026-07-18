"use client";

import { useParams, useRouter } from "next/navigation";
import { formatResidentName } from "../../../lib/format";
import { useResidents, useSessions } from "../../../lib/storage";

export default function HistoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { residents } = useResidents();
  const { sessions } = useSessions(id);

  const resident = residents.find((r) => r.id === id);

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalRounds = sorted.length;
  const avgPct =
    totalRounds > 0
      ? Math.round(
          (sorted.reduce((sum, s) => sum + s.score / s.total, 0) / totalRounds) *
            100
        )
      : null;
  const bestPct =
    totalRounds > 0
      ? Math.round(
          Math.max(...sorted.map((s) => s.score / s.total)) * 100
        )
      : null;

  function gameLabel(gameId: string) {
    if (gameId === "picture-memory") return "Recall";
    if (gameId === "pair-match") return "Pair Match";
    if (gameId === "sequence-recall") return "Sequence Recall";
    return "Game";
  }

  function scoreBadgeColor(pct: number) {
    if (pct >= 80) return "bg-green-100 text-green-800";
    if (pct >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-700";
  }

  function barColor(pct: number) {
    if (pct >= 80) return "bg-green-400";
    if (pct >= 50) return "bg-yellow-400";
    return "bg-red-400";
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto print:max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:mb-4">
          <div className="flex items-center">
          <button
            onClick={() => router.push("/")}
            className="text-base text-slate-500 hover:text-slate-700 transition mr-3 print:hidden"
            aria-label="Back to home"
          >
            ← Back
          </button>
            <h1 className="text-3xl font-bold">
            {resident ? formatResidentName(resident.name) : "History"}
          </h1>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition"
            >
              Print
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6 print:mb-4">
          Resident score history
        </p>

        {totalRounds === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center print:shadow-none print:border print:border-slate-200">
            <p className="text-lg text-slate-500">No rounds played yet.</p>
            <p className="text-base text-slate-400 mt-2">Start a game to see history here.</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl shadow-md p-5 text-center">
                <p className="text-3xl font-bold text-blue-600">{totalRounds}</p>
                <p className="text-sm text-slate-500 mt-1">Rounds</p>
              </div>
              <div className="bg-white rounded-2xl shadow-md p-5 text-center">
                <p className="text-3xl font-bold text-blue-600">{avgPct}%</p>
                <p className="text-sm text-slate-500 mt-1">Average</p>
              </div>
              <div className="bg-white rounded-2xl shadow-md p-5 text-center">
                <p className="text-3xl font-bold text-green-600">{bestPct}%</p>
                <p className="text-sm text-slate-500 mt-1">Best</p>
              </div>
            </div>

            {/* Trend chart */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <p className="text-lg font-semibold text-slate-600 mb-4">Score trend</p>
              <div className="flex items-end gap-1 h-24">
                {[...sorted].reverse().map((s) => {
                  const pct = Math.round((s.score / s.total) * 100);
                  return (
                    <div
                      key={s.id}
                      title={`${pct}% — ${formatDate(s.date)}`}
                      className={`flex-1 rounded-t-md ${barColor(pct)} transition-all`}
                      style={{ height: `${pct}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-sm text-slate-400 mt-1">
                <span>Oldest</span>
                <span>Newest</span>
              </div>
            </div>

            {/* Session list */}
            <ul className="space-y-3">
              {sorted.map((s) => {
                const pct = Math.round((s.score / s.total) * 100);
                return (
                  <li
                    key={s.id}
                    className="bg-white rounded-2xl shadow-md px-6 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <span className="block text-base text-slate-600">{formatDate(s.date)}</span>
                      <span className="block text-sm text-slate-400">{gameLabel(s.gameId)}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-base text-slate-700 font-semibold">
                        {s.score}/{s.total}
                      </span>
                      <span
                        className={`text-sm font-bold px-3 py-1 rounded-lg ${scoreBadgeColor(pct)}`}
                      >
                        {pct}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}

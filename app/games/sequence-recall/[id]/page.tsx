"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatResidentName } from "../../../../lib/format";
import { useResidents, useSessions } from "../../../../lib/storage";
import type { Difficulty } from "../../../../lib/types";

const symbols = [
  "🍎",
  "🐶",
  "🪑",
  "🕰️",
  "🌷",
  "🎸",
  "🚗",
  "📚",
  "👟",
  "💡",
  "☕",
  "🔑",
  "🐱",
  "🏠",
  "🍌",
  "✉️",
];

const difficultyConfig: Record<Difficulty, { length: number; revealMs: number; choices: number }> = {
  easy: { length: 4, revealMs: 1100, choices: 8 },
  medium: { length: 6, revealMs: 950, choices: 10 },
  hard: { length: 8, revealMs: 800, choices: 12 },
};

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildRound(difficulty: Difficulty) {
  const config = difficultyConfig[difficulty];
  const sequence = shuffle(symbols).slice(0, config.length);
  const distractors = shuffle(symbols.filter((s) => !sequence.includes(s))).slice(
    0,
    Math.max(0, config.choices - config.length)
  );
  const choices = shuffle([...sequence, ...distractors]);
  return { sequence, choices };
}

export default function SequenceRecallPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { residents } = useResidents();
  const { addSession } = useSessions(id);

  const resident = residents.find((r) => r.id === id);

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [phase, setPhase] = useState<"difficulty_select" | "study" | "recall" | "result">("difficulty_select");
  const [sequence, setSequence] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [answer, setAnswer] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);

  const config = difficultyConfig[difficulty];

  useEffect(() => {
    if (phase !== "study") return;

    const timerId = window.setTimeout(() => {
      if (studyIndex >= sequence.length - 1) {
        setPhase("recall");
        return;
      }
      setStudyIndex((prev) => prev + 1);
    }, config.revealMs);

    return () => window.clearTimeout(timerId);
  }, [phase, studyIndex, sequence.length, config.revealMs]);

  function startRound(selectedDifficulty: Difficulty) {
    const round = buildRound(selectedDifficulty);
    setDifficulty(selectedDifficulty);
    setSequence(round.sequence);
    setChoices(round.choices);
    setStudyIndex(0);
    setAnswer([]);
    setScore(null);
    setPhase("study");
  }

  function chooseSymbol(symbol: string) {
    if (answer.length >= sequence.length) return;
    setAnswer((prev) => [...prev, symbol]);
  }

  function removeLast() {
    setAnswer((prev) => prev.slice(0, -1));
  }

  function clearAnswer() {
    setAnswer([]);
  }

  function submitAnswer() {
    const correct = answer.filter((symbol, i) => symbol === sequence[i]).length;
    setScore(correct);
    addSession(id, correct, sequence.length, difficulty, "sequence-recall");
    setPhase("result");
  }

  const canSubmit = answer.length === sequence.length;
  const revealedSymbol = useMemo(() => sequence[studyIndex] ?? "", [sequence, studyIndex]);

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start sm:items-center gap-2 mb-2">
          <button
            onClick={() => router.push("/")}
            className="text-lg sm:text-2xl text-slate-500 hover:text-slate-700 transition mr-1 sm:mr-4"
            aria-label="Back to home"
          >
            ← Back
          </button>
          <h1 className="text-2xl sm:text-4xl font-bold flex-1 text-left sm:text-center pr-0 sm:pr-16 leading-tight">
            {resident
              ? `${formatResidentName(resident.name)} - Sequence Recall`
              : "Sequence Recall"}
          </h1>
        </div>

        {phase === "difficulty_select" && (
          <>
            <p className="text-center text-xl sm:text-2xl mb-8">Choose your difficulty level</p>
            <div className="space-y-4 max-w-md mx-auto">
              <button
                onClick={() => startRound("easy")}
                className="w-full px-6 sm:px-8 py-5 sm:py-6 bg-green-500 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-green-600 active:scale-95 transition"
              >
                🟢 Easy (4-item sequence)
              </button>
              <button
                onClick={() => startRound("medium")}
                className="w-full px-6 sm:px-8 py-5 sm:py-6 bg-blue-600 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-blue-700 active:scale-95 transition"
              >
                🔵 Medium (6-item sequence)
              </button>
              <button
                onClick={() => startRound("hard")}
                className="w-full px-6 sm:px-8 py-5 sm:py-6 bg-red-500 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-red-600 active:scale-95 transition"
              >
                🔴 Hard (8-item sequence)
              </button>
            </div>
          </>
        )}

        {phase === "study" && (
          <>
            <p className="text-center text-xl sm:text-2xl mb-2">Memorize the sequence</p>
            <p className="text-center text-base sm:text-lg text-slate-500 mb-8">
              Item {studyIndex + 1} of {sequence.length}
            </p>
            <div className="bg-white rounded-2xl shadow-md h-36 sm:h-44 flex items-center justify-center mb-8">
              <span className="text-7xl sm:text-8xl leading-none">{revealedSymbol}</span>
            </div>
          </>
        )}

        {phase === "recall" && (
          <>
            <p className="text-center text-xl sm:text-2xl mb-2">Repeat the sequence in order</p>
            <p className="text-center text-base sm:text-lg text-slate-500 mb-6">
              Selected: {answer.length}/{sequence.length}
            </p>

            <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
              <p className="text-sm text-slate-500 mb-2">Your sequence</p>
              <div className="min-h-14 flex flex-wrap gap-2 items-center">
                {answer.length === 0 ? (
                  <span className="text-slate-400">Tap symbols below to build your answer.</span>
                ) : (
                  answer.map((symbol, index) => (
                    <span
                      key={`${symbol}-${index}`}
                      className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-bold text-2xl flex items-center justify-center"
                    >
                      {symbol}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-8">
              {choices.map((symbol, idx) => (
                <button
                  key={`${symbol}-${idx}`}
                  onClick={() => chooseSymbol(symbol)}
                  disabled={answer.length >= sequence.length}
                  className="h-14 sm:h-16 rounded-xl bg-white border border-slate-200 text-2xl sm:text-3xl hover:bg-blue-50 active:scale-95 transition disabled:opacity-40"
                  aria-label={`Choose ${symbol}`}
                >
                  {symbol}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={removeLast}
                disabled={answer.length === 0}
                className="w-full sm:w-auto px-6 py-3 bg-slate-300 text-slate-700 rounded-xl text-base font-semibold hover:bg-slate-400 active:scale-95 transition disabled:opacity-40"
              >
                Remove Last
              </button>
              <button
                onClick={clearAnswer}
                disabled={answer.length === 0}
                className="w-full sm:w-auto px-6 py-3 bg-slate-300 text-slate-700 rounded-xl text-base font-semibold hover:bg-slate-400 active:scale-95 transition disabled:opacity-40"
              >
                Clear
              </button>
              <button
                onClick={submitAnswer}
                disabled={!canSubmit}
                className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white rounded-xl text-base font-semibold hover:bg-green-700 active:scale-95 transition disabled:opacity-40"
              >
                Submit
              </button>
            </div>
          </>
        )}

        {phase === "result" && (
          <>
            <div className="text-center mb-6">
              <p className="text-4xl sm:text-5xl font-bold mb-2">
                {score === sequence.length
                  ? "🎉 Perfect sequence!"
                  : score! >= Math.ceil(sequence.length * 0.6)
                  ? "👍 Well done!"
                  : "Keep practicing!"}
              </p>
              <p className="text-2xl sm:text-3xl text-slate-700">
                You got <span className="font-bold text-blue-600">{score}</span> out of {sequence.length}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-5 mb-8">
              <p className="text-sm text-slate-500 mb-2">Correct sequence</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {sequence.map((symbol, index) => (
                  <span
                    key={`correct-${symbol}-${index}`}
                    className="w-10 h-10 rounded-lg bg-green-100 text-green-700 font-bold text-2xl flex items-center justify-center"
                  >
                    {symbol}
                  </span>
                ))}
              </div>

              <p className="text-sm text-slate-500 mb-2">Your sequence</p>
              <div className="flex flex-wrap gap-2">
                {answer.map((symbol, index) => {
                  const correct = symbol === sequence[index];
                  return (
                    <span
                      key={`answer-${symbol}-${index}`}
                      className={`w-10 h-10 rounded-lg font-bold text-2xl flex items-center justify-center ${
                        correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {symbol}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => startRound(difficulty)}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-blue-600 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-blue-700 active:scale-95 transition"
              >
                Play Again
              </button>
              <button
                onClick={() => setPhase("difficulty_select")}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-slate-400 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-slate-500 active:scale-95 transition"
              >
                Change Difficulty
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

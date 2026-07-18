"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatResidentName } from "../../../../lib/format";
import { useResidents, useSessions } from "../../../../lib/storage";
import type { Difficulty } from "../../../../lib/types";

type Card = {
  id: string;
  pairId: number;
  label: string;
};

const pairSymbols = [
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

const difficultyConfig: Record<Difficulty, { pairs: number }> = {
  easy: { pairs: 4 },
  medium: { pairs: 6 },
  hard: { pairs: 8 },
};

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function createBoard(difficulty: Difficulty): Card[] {
  const pairCount = difficultyConfig[difficulty].pairs;
  const selected = shuffle(pairSymbols).slice(0, pairCount);
  const cards: Card[] = selected.flatMap((symbol, pairId) => [
    { id: `${pairId}-a`, pairId, label: symbol },
    { id: `${pairId}-b`, pairId, label: symbol },
  ]);
  return shuffle(cards);
}

function computeScore(totalPairs: number, moves: number): number {
  const extraMoves = Math.max(0, moves - totalPairs);
  return Math.max(0, totalPairs - extraMoves);
}

function getStars(totalPairs: number, moves: number): string {
  const extraMoves = Math.max(0, moves - totalPairs);
  if (extraMoves <= 1) return "⭐⭐⭐⭐⭐";
  if (extraMoves === 2) return "⭐⭐⭐⭐";
  if (extraMoves <= 4) return "⭐⭐⭐";
  if (extraMoves <= 6) return "⭐⭐";
  return "⭐";
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function PairMatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { residents } = useResidents();
  const { addSession } = useSessions(id);

  const resident = residents.find((r) => r.id === id);

  const [phase, setPhase] = useState<"difficulty_select" | "play" | "result">("difficulty_select");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [board, setBoard] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "play") return;
    const timerId = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [phase]);

  function startGame(selectedDifficulty: Difficulty) {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDifficulty(selectedDifficulty);
    setBoard(createBoard(selectedDifficulty));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setElapsedSeconds(0);
    setLocked(false);
    setPhase("play");
  }

  function finishRound(finalMoves: number) {
    const totalPairs = difficultyConfig[difficulty].pairs;
    const roundScore = computeScore(totalPairs, finalMoves);
    addSession(id, roundScore, totalPairs, difficulty, "pair-match");
    setPhase("result");
  }

  function handleCardClick(cardId: string) {
    if (locked) return;
    if (flipped.includes(cardId)) return;
    if (matched.includes(cardId)) return;

    const nextFlipped = [...flipped, cardId];
    setFlipped(nextFlipped);

    if (nextFlipped.length < 2) return;

    const first = board.find((card) => card.id === nextFlipped[0]);
    const second = board.find((card) => card.id === nextFlipped[1]);
    if (!first || !second) return;

    const nextMoves = moves + 1;
    setMoves(nextMoves);

    if (first.pairId === second.pairId) {
      const nextMatched = [...matched, first.id, second.id];
      setMatched(nextMatched);
      setFlipped([]);
      if (nextMatched.length === board.length) {
        finishRound(nextMoves);
      }
      return;
    }

    setLocked(true);
    timeoutRef.current = window.setTimeout(() => {
      setFlipped([]);
      setLocked(false);
      timeoutRef.current = null;
    }, 700);
  }

  function resetGame() {
    startGame(difficulty);
  }

  function resetAll() {
    startGame(difficulty);
  }

  const totalPairs = difficultyConfig[difficulty].pairs;
  const headline = getStars(totalPairs, moves);

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
            {resident ? `${formatResidentName(resident.name)} - Pair Match` : "Pair Match"}
          </h1>
        </div>

        {phase === "difficulty_select" && (
          <>
            <p className="text-center text-xl sm:text-2xl mb-8">Choose your difficulty level</p>
            <div className="space-y-4 max-w-md mx-auto">
              <button
                onClick={() => startGame("easy")}
                className="w-full px-6 sm:px-8 py-5 sm:py-6 bg-green-500 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-green-600 active:scale-95 transition"
              >
                🟢 Easy (4 pairs)
              </button>
              <button
                onClick={() => startGame("medium")}
                className="w-full px-6 sm:px-8 py-5 sm:py-6 bg-blue-600 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-blue-700 active:scale-95 transition"
              >
                🔵 Medium (6 pairs)
              </button>
              <button
                onClick={() => startGame("hard")}
                className="w-full px-6 sm:px-8 py-5 sm:py-6 bg-red-500 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-red-600 active:scale-95 transition"
              >
                🔴 Hard (8 pairs)
              </button>
            </div>
          </>
        )}

        {phase === "play" && (
          <>
            <p className="text-center text-lg sm:text-xl text-slate-600 mb-3">
              Match all pairs in as few moves as possible.
            </p>
            <div className="bg-white rounded-2xl shadow-md p-4 mb-6 text-center">
              <p className="text-lg text-slate-600">
                Pairs Found: <span className="font-bold text-blue-600">{matched.length / 2}</span> / <span className="font-bold text-blue-600">{totalPairs}</span>
              </p>
              <p className="text-lg text-slate-600">
                Moves: <span className="font-bold text-blue-600">{moves}</span>
              </p>
              <p className="text-lg text-slate-600">
                Time: <span className="font-bold text-blue-600">{formatTime(elapsedSeconds)}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {board.map((card) => {
                const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
                const isMatched = matched.includes(card.id);
                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    disabled={isMatched || locked}
                    className={`h-20 sm:h-24 rounded-2xl shadow-md text-3xl sm:text-4xl font-bold transition active:scale-95 ${
                      isMatched
                        ? "bg-green-200 text-slate-800"
                        : isFlipped
                        ? "bg-blue-500 text-white"
                        : "bg-white text-slate-700 hover:bg-blue-50 border border-slate-200"
                    }`}
                    aria-label={isFlipped ? `Card ${card.label}` : "Hidden card"}
                  >
                    {isFlipped ? card.label : "?"}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {phase === "result" && (
          <>
            <div className="text-center mb-6">
              <p className="text-4xl sm:text-5xl font-bold mb-2">
                {headline}
              </p>
            </div>
            <p className="text-center text-lg sm:text-xl text-slate-500 mb-8">
              Moves used: <span className="font-bold text-blue-600">{moves}</span>
              {" "}• Difficulty: <span className="font-bold">{difficulty.toUpperCase()}</span>
            </p>
            <div className="bg-white rounded-2xl shadow-md p-4 mb-8 text-center">
              <p className="text-lg text-slate-600">
                Pairs Found: <span className="font-bold text-blue-600">{totalPairs}</span> / <span className="font-bold text-blue-600">{totalPairs}</span>
              </p>
              <p className="text-lg text-slate-600">
                Moves: <span className="font-bold text-blue-600">{moves}</span>
              </p>
              <p className="text-lg text-slate-600">
                Time: <span className="font-bold text-blue-600">{formatTime(elapsedSeconds)}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={resetGame}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-blue-600 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-blue-700 active:scale-95 transition"
              >
                Play Again
              </button>
              <button
                onClick={resetAll}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-slate-400 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-slate-500 active:scale-95 transition"
              >
                Reset Score
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

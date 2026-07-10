"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useResidents, useSessions } from "../../../lib/storage";
import type { Difficulty } from "../../../lib/types";

const allItems = [
  "🍎 Apple",
  "🐶 Dog",
  "🪑 Chair",
  "🕰️ Clock",
  "🌷 Flower",
  "🎸 Guitar",
  "🚗 Car",
  "📚 Book",
  "👟 Shoe",
  "💡 Lamp",
  "☕ Coffee",
  "🔑 Key",
  "🐱 Cat",
  "🏠 House",
  "🍌 Banana",
  "✉️ Letter",
];

const difficultyConfig: Record<Difficulty, { items: number; studyTime: number; distractors: number }> = {
  easy: { items: 4, studyTime: 25, distractors: 2 },
  medium: { items: 6, studyTime: 30, distractors: 4 },
  hard: { items: 8, studyTime: 40, distractors: 6 },
};

function getRandomItems(items: string[], count: number) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

function newGame(difficulty: Difficulty) {
  const config = difficultyConfig[difficulty];
  const memoryItems = getRandomItems(allItems, config.items);
  const distractors = allItems
    .filter((i) => !memoryItems.includes(i))
    .sort(() => Math.random() - 0.5)
    .slice(0, config.distractors);
  const recallChoices = [...memoryItems, ...distractors].sort(
    () => Math.random() - 0.5
  );
  return { memoryItems, recallChoices };
}

function splitItem(item: string): [string, string] {
  const idx = item.indexOf(" ");
  return [item.slice(0, idx), item.slice(idx + 1)];
}

export default function PlayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { residents } = useResidents();
  const { addSession } = useSessions(id);

  const resident = residents.find((r) => r.id === id);

  const [game, setGame] = useState<ReturnType<typeof newGame> | null>(null);
  const [phase, setPhase] = useState<"difficulty_select" | "study" | "recall" | "result">("difficulty_select");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [selected, setSelected] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(difficultyConfig.medium.studyTime);

  useEffect(() => {
    if (phase !== "study") return;
    if (timeLeft <= 0) {
      return;
    }
    const timerId = setTimeout(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase("recall");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timerId);
  }, [phase, timeLeft]);

  if (!game && phase !== "difficulty_select") return null;

  const { memoryItems = [], recallChoices = [] } = game ?? {};

  function toggleItem(item: string) {
    const config = difficultyConfig[difficulty];
    setSelected((prev) => {
      if (prev.includes(item)) {
        return prev.filter((i) => i !== item);
      }
      if (prev.length < config.items) {
        return [...prev, item];
      }
      return prev;
    });
  }

  function submitRecall() {
    const correct = selected.filter((i) => memoryItems.includes(i)).length;
    setScore(correct);
    setTotalScore((prev) => prev + correct);
    setRoundsPlayed((prev) => prev + 1);
    addSession(id, correct, memoryItems.length, difficulty, "picture-memory");
    setPhase("result");
  }

  function resetGame() {
    setGame(newGame(difficulty));
    setPhase("study");
    setTimeLeft(difficultyConfig[difficulty].studyTime);
    setSelected([]);
    setScore(null);
  }

  function resetAll() {
    setGame(newGame(difficulty));
    setPhase("study");
    setTimeLeft(difficultyConfig[difficulty].studyTime);
    setSelected([]);
    setScore(null);
    setTotalScore(0);
    setRoundsPlayed(0);
  }

  function startGame(selectedDifficulty: Difficulty) {
    setDifficulty(selectedDifficulty);
    setGame(newGame(selectedDifficulty));
    setPhase("study");
    setTimeLeft(difficultyConfig[selectedDifficulty].studyTime);
    setSelected([]);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start sm:items-center gap-2 mb-2">
          <button
            onClick={() => router.push("/")}
            className="text-lg sm:text-2xl text-slate-500 hover:text-slate-700 transition mr-1 sm:mr-4"
            aria-label="Back to home"
          >
            ← Back
          </button>
          <h1 className="text-2xl sm:text-4xl font-bold flex-1 text-left sm:text-center pr-0 sm:pr-16 leading-tight">
            {resident ? resident.name : "Memory Lane"}
          </h1>
        </div>

        {/* Difficulty selection phase */}
        {phase === "difficulty_select" && (
          <>
            <p className="text-center text-xl sm:text-2xl mb-8">
              Choose your difficulty level
            </p>
            <div className="space-y-4 max-w-md mx-auto">
              <button
                onClick={() => startGame("easy")}
                className="w-full px-6 sm:px-8 py-5 sm:py-6 bg-green-500 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-green-600 active:scale-95 transition"
              >
                🟢 Easy (4 items, 25s)
              </button>
              <button
                onClick={() => startGame("medium")}
                className="w-full px-6 sm:px-8 py-5 sm:py-6 bg-blue-600 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-blue-700 active:scale-95 transition"
              >
                🔵 Medium (6 items, 30s)
              </button>
              <button
                onClick={() => startGame("hard")}
                className="w-full px-6 sm:px-8 py-5 sm:py-6 bg-red-500 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-red-600 active:scale-95 transition"
              >
                🔴 Hard (8 items, 40s)
              </button>
            </div>
          </>
        )}

        {roundsPlayed === 0 && phase !== "difficulty_select" && <div className="mb-8" />}

        {/* Study phase */}
        {phase === "study" && (
          <>
            <p className="text-center text-xl sm:text-2xl mb-4">
              Study these items and remember them!
            </p>
            <div
              className={`text-center text-5xl sm:text-6xl font-bold mb-6 ${
                timeLeft <= 10
                  ? "text-red-500"
                  : "text-blue-600"
              }`}
            >
              {timeLeft}s
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 mb-8">
              <div
                className={`h-4 rounded-full transition-all duration-1000 ${
                  timeLeft <= 10
                    ? "bg-red-400"
                    : "bg-blue-500"
                }`}
                style={{ width: `${(timeLeft / difficultyConfig[difficulty].studyTime) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {memoryItems.map((item) => {
                const [emoji, name] = splitItem(item);
                return (
                  <div
                    key={item}
                    className="bg-white rounded-2xl shadow-md flex items-center justify-center gap-3 h-28 px-4"
                  >
                    <span className="text-3xl sm:text-4xl leading-none flex-none">{emoji}</span>
                    <span className="text-xl sm:text-2xl font-semibold">{name}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <button
                onClick={() => setPhase("recall")}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-blue-600 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-blue-700 active:scale-95 transition"
              >
                I&apos;m Ready!
              </button>
            </div>
          </>
        )}

        {/* Recall phase */}
        {phase === "recall" && (
          <>
            <p className="text-center text-xl sm:text-2xl mb-2">
              Which items did you see? Tap all that you remember.
            </p>
            <p className="text-center text-lg sm:text-xl text-slate-600 mb-8">
              Selections remaining: <span className="font-bold text-blue-600">{difficultyConfig[difficulty].items - selected.length}</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {recallChoices.map((item) => {
                const [emoji, name] = splitItem(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(item)}
                    className={`rounded-2xl shadow-md flex items-center justify-center gap-3 h-28 px-4 transition active:scale-95 ${
                      selected.includes(item)
                        ? "bg-blue-500 text-white ring-4 ring-blue-300"
                        : "bg-white hover:bg-blue-50"
                    }`}
                  >
                    <span className="text-3xl sm:text-4xl leading-none flex-none">{emoji}</span>
                    <span className="text-xl sm:text-2xl font-semibold">{name}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-center">
              <button
                onClick={submitRecall}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-green-600 text-white rounded-2xl text-xl sm:text-2xl font-bold hover:bg-green-700 active:scale-95 transition"
              >
                Done!
              </button>
            </div>
          </>
        )}

        {/* Result phase */}
        {phase === "result" && (
          <>
            <div className="text-center mb-6">
              <p className="text-4xl sm:text-5xl font-bold mb-2">
                {score === memoryItems.length
                  ? "🎉 Perfect!"
                  : score! / memoryItems.length >= 0.6
                  ? "👍 Well done!"
                  : "Keep practicing!"}
              </p>
              <p className="text-2xl sm:text-3xl text-slate-700">
                You got{" "}
                <span className="font-bold text-blue-600">{score}</span> out of{" "}
                {memoryItems.length}
              </p>
            </div>
            <p className="text-center text-lg sm:text-xl text-slate-500 mb-8">
              Running total:{" "}
              <span className="font-bold text-blue-600">{totalScore}</span>
              {" "}over {roundsPlayed} round{roundsPlayed !== 1 ? "s" : ""}
            </p>
            <p className="text-center text-lg text-slate-600 mb-8">
              Difficulty: <span className="font-bold">{difficulty.toUpperCase()}</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {recallChoices.map((item) => {
                const wasStudied = memoryItems.includes(item);
                const wasSelected = selected.includes(item);
                let bg = "bg-white";
                let label = "";
                if (wasStudied && wasSelected) {
                  bg = "bg-green-200";
                  label = "✓";
                } else if (!wasStudied && wasSelected) {
                  bg = "bg-red-200";
                  label = "✗";
                } else if (wasStudied && !wasSelected) {
                  bg = "bg-yellow-100";
                  label = "!";
                }
                return (
                  <div
                    key={item}
                    className={`${bg} rounded-2xl shadow-md flex items-center justify-center gap-3 h-28 px-4 relative`}
                  >
                    <span className="text-4xl leading-none flex-none">{splitItem(item)[0]}</span>
                    <span className="text-2xl font-semibold">{splitItem(item)[1]}</span>
                    {label && (
                      <span className="absolute top-2 right-3 text-xl font-bold">
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-lg text-slate-500 mb-6">
              🟢 Correct &nbsp; 🔴 Wrong pick &nbsp; 🟡 Missed
            </p>
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

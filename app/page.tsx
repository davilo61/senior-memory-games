"use client";

import { useState } from "react";

const memoryItems = [
  "🍎 Apple",
  "🐶 Dog",
  "🪑 Chair",
  "🕰️ Clock",
  "🌷 Flower",
  "🎸 Guitar",
];

export default function Home() {
  const [phase, setPhase] = useState<"study" | "recall">("study");
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Memory Lane Games
        </h1>

        <p className="text-center text-xl mb-8">
          {phase === "study" 
            ? "Study these items and remember them."
            : "Recall the items you just studied."}
        </p>
        <p className="text-center text-lg mb-8">
          Currently in {phase} phase.
        </p>
        <div className="mb-8 text-center space-x-4">
          {phase === "study" && (
            <button
              onClick={() => setPhase("recall")}
              className="px-6 py-4 bg-blue-600 text-white rounded-xl text-xl font-bold hover:bg-blue-700 transition"
            >
              Start Recall Phase
            </button>
          )}
          {phase === "recall" && (
            <button
              onClick={() => setPhase("study")}
              className="px-6 py-4 bg-green-600 text-white rounded-xl text-xl font-bold hover:bg-green-700 transition"
            >
              Reset Game
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {memoryItems.map((item) => (
            <div
              key={item}
              className="bg-white rounded-xl shadow p-6 text-center text-2xl"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
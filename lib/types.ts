export type Difficulty = "easy" | "medium" | "hard";
export type GameId = "picture-memory" | "pair-match" | "sequence-recall";

export interface Resident {
  id: string;
  name: string;
  createdAt: string; // ISO date string
}

export interface GameSession {
  id: string;
  residentId: string;
  date: string; // ISO date string
  gameId: GameId;
  score: number;
  total: number;
  difficulty: Difficulty;
}

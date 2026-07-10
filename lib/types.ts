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

export type FeedbackPerspective =
  | "friend"
  | "resident"
  | "caregiver"
  | "clinician"
  | "developer";

export interface PlaytestFeedback {
  id: string;
  date: string; // ISO date string
  name: string;
  perspective: FeedbackPerspective;
  rating: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

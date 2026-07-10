import type { GameId } from "./types";

export interface GameDefinition {
  id: GameId;
  title: string;
  description: string;
  routePrefix: string;
  status: "live" | "planned";
}

export const games: GameDefinition[] = [
  {
    id: "picture-memory",
    title: "Recall",
    description: "Study cards, then recall what you saw.",
    routePrefix: "/play",
    status: "live",
  },
  {
    id: "pair-match",
    title: "Pair Match",
    description: "Flip cards and find matching pairs.",
    routePrefix: "/games/pair-match",
    status: "live",
  },
  {
    id: "sequence-recall",
    title: "Sequence Recall",
    description: "Remember and repeat item order.",
    routePrefix: "/games/sequence-recall",
    status: "live",
  },
];

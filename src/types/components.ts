import { Player } from "./game";

// src/types/components.ts
export type GameResultsProps = {
  players: Player[];
};

export type GameBoardProps = {
  roomId: string;
  playerId: string;
};

export type Score = {
  score: number;
  highlightedCards: Set<number>;
};

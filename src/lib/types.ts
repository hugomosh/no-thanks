export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  deck: number[];
  currentCard: number | null;
  tokensOnCard: number;
  removedCards: number[];
  phase: GamePhase;
  winner: string | null;
}

export enum GamePhase {
  WAITING = "WAITING",
  PLAYING = "PLAYING",
  ENDED = "ENDED",
}

export type GameAction =
  | { type: "TAKE_CARD" }
  | { type: "PLACE_TOKEN" }
  | { type: "JOIN_GAME"; payload: { playerId: string; playerName: string } }
  | { type: "START_GAME" }
  | { type: "END_GAME" };

export type Room = {
  id: string;
  code: string;
  status: "waiting" | "playing" | "ended";
  current_card: number | null;
  tokens_on_card: number;
  deck: number[];
  removed_cards: number[];
  current_player_index: number;
  created_at: string;
};

export type Player = {
  id: string;
  room_id: string;
  name: string;
  tokens: number;
  cards: number[];
  is_active: boolean;
  is_ready: boolean;
  created_at: string;
};

// Type guards for data validation
export const isValidRoom = (data: any): data is Room => {
  return (
    data &&
    typeof data.id === "string" &&
    typeof data.code === "string" &&
    ["waiting", "playing", "ended"].includes(data.status) &&
    Array.isArray(data.deck) &&
    Array.isArray(data.removed_cards) &&
    typeof data.current_player_index === "number"
  );
};

export const isValidPlayer = (data: any): data is Player => {
  return (
    data &&
    typeof data.id === "string" &&
    typeof data.room_id === "string" &&
    typeof data.name === "string" &&
    typeof data.tokens === "number" &&
    Array.isArray(data.cards) &&
    typeof data.is_active === "boolean" &&
    typeof data.is_ready === "boolean"
  );
};

export type Player = {
  id: string;
  name: string;
  cards: number[];
  tokens: number;
  position: number;
};

export type RoomStatus = "waiting" | "playing" | "finished";

export type Room = {
  id: string;
  code: string;
  status: RoomStatus;
  current_player: string;
  current_card: number | null;
  tokens_on_card: number;
};


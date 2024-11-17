import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameLobby from './components/GameLobby';
import NoThanksGameUI from './components/NoThanksGameUI';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameLobby />} />
        <Route path="/room/:roomId" element={<NoThanksGameUI />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// src/game/types.ts
export interface Player {
  id: string;
  name: string;
  tokens: number;
  cards: number[];
  isActive: boolean;
}

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

// src/vite-env.d.ts
/// <reference types="vite/client" />

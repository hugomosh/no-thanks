// src/components/game/players/PlayerInfo.tsx
import { Coins, ChevronRight } from "lucide-react";
import { Player } from "../../../types";

interface PlayerInfoProps {
  players: Record<string, Player>;
  currentTurnPlayerId: string | null;
  currentPlayerId: string;
}

export function PlayerInfo({
  players,
  currentTurnPlayerId,
  currentPlayerId,
}: PlayerInfoProps) {
  return (
    <div className="flex items-center gap-3">
      {Object.values(players).map((player, index) => (
        <div key={player.id} className="flex items-center">
          <div
            className={`flex items-center gap-2 ${
              player.id === currentTurnPlayerId
                ? "bg-blue-50 p-2 rounded-lg ring-2 ring-blue-500"
                : "p-2"
            }`}
          >
            <div
              className={`w-8 h-8 ${
                player.id === currentPlayerId ? "bg-blue-500" : "bg-gray-400"
              } rounded-full flex items-center justify-center`}
            >
              <span className="text-white font-bold">P{index + 1}</span>
            </div>
            <div className="text-sm">
              <p className="font-semibold">{player.name}</p>
              <div className="bg-yellow-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span
                  className="font-semibold text-yellow-800"
                  data-testid={`player-${player.id}-tokens`}
                >
                  {player.tokens}
                </span>
              </div>
            </div>
          </div>
          {index !== Object.values(players).length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
          )}
        </div>
      ))}
    </div>
  );
}

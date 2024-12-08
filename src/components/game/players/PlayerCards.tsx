// src/components/game/players/PlayerCards.tsx
import { Player } from "../../../types";
import { Card } from "../cards/Card";
import { Coins } from "lucide-react";

interface PlayerCardsProps {
  player: Player;
  isCompact?: boolean;
}

export function PlayerCards({ player, isCompact = false }: PlayerCardsProps) {
  return (
    <div
      className={`bg-gray-50 rounded-lg p-4 ${isCompact ? "w-64" : "w-full"}`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">{player.name}</h3>
        <div className="flex items-center gap-2 text-sm bg-yellow-100 px-2 py-1 rounded-full">
          <Coins className="w-4 h-4 text-yellow-600" />
          <span
            className="font-semibold text-yellow-800"
            data-testid={`player-${player.id}-tokens-count`}
          >
            {player.tokens}
          </span>
        </div>
      </div>
      <div
        className="flex flex-wrap gap-2"
        data-testid={`player-${player.id}-cards`}
      >
        {player.cards
          .sort((a, b) => a - b)
          .map((cardNumber) => (
            <Card
              key={cardNumber}
              number={cardNumber}
              size={isCompact ? "small" : "normal"}
            />
          ))}
      </div>
    </div>
  );
}

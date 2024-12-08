import React from "react";
import { Users, Coins, ChevronRight } from "lucide-react";

const GameUI = () => {
  const players = [
    {
      id: 1,
      name: "Player 1",
      tokens: 8,
      cards: [15, 16, 17],
      isCurrentPlayer: true,
      isTurn: false,
    },
    {
      id: 2,
      name: "Player 2",
      tokens: 5,
      cards: [3, 4, 5, 6],
      isCurrentPlayer: false,
      isTurn: true,
    },
    {
      id: 3,
      name: "Player 3",
      tokens: 3,
      cards: [24, 25],
      isCurrentPlayer: false,
      isTurn: false,
    },
  ];

  const Card = ({ number, size = "normal" }) => {
    const sizeClasses = {
      small: "w-10 h-14",
      normal: "w-12 h-16",
      large: "w-16 h-24",
    };

    const numberSizes = {
      small: "text-lg",
      normal: "text-2xl",
      large: "text-4xl",
    };

    return (
      <div
        className={`${sizeClasses[size]} bg-white rounded-lg border border-gray-200 flex items-center justify-center relative shadow-sm hover:shadow transition-shadow`}
      >
        <span className={`${numberSizes[size]} font-medium text-gray-800`}>
          {number}
        </span>
      </div>
    );
  };

  const MainCard = ({ number, tokens }) => (
    <div className="relative">
      <div className="w-32 h-48 bg-white rounded-lg border-4 border-blue-500 flex items-center justify-center shadow-sm hover:shadow transition-shadow relative">
        <span className="text-7xl font-medium text-gray-800">{number}</span>
        <div className="absolute bottom-3 right-3 text-lg font-medium text-gray-600 rotate-180">
          {number}
        </div>
      </div>
      <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-sm border border-yellow-500">
        {tokens}
      </div>
    </div>
  );

  const PlayerCards = ({ player, isCompact = false }) => (
    <div
      className={`bg-gray-50 rounded-lg p-4 ${
        isCompact ? "flex-shrink-0 w-64" : "w-full"
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 ${
              player.isCurrentPlayer ? "bg-blue-500" : "bg-gray-400"
            } rounded-full flex items-center justify-center`}
          >
            <span className="text-white text-sm font-bold">P{player.id}</span>
          </div>
          <h3 className="font-semibold">{player.name}</h3>
        </div>
        <div className="flex items-center gap-2 text-sm bg-yellow-100 px-2 py-1 rounded-full">
          <Coins className="w-4 h-4 text-yellow-600" />
          <span className="font-semibold text-yellow-800">{player.tokens}</span>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
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

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">No Thanks!</h1>
                <p className="text-gray-600">Game #12345</p>
              </div>

              {/* Players List */}
              <div className="flex items-center gap-3">
                {players.map((player, index) => (
                  <div key={player.id} className="flex items-center">
                    <div
                      className={`flex items-center gap-2 ${
                        player.isTurn
                          ? "bg-blue-50 p-2 rounded-lg ring-2 ring-blue-500"
                          : "p-2"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 ${
                          player.isCurrentPlayer ? "bg-blue-500" : "bg-gray-400"
                        } rounded-full flex items-center justify-center`}
                      >
                        <span className="text-white font-bold">
                          P{player.id}
                        </span>
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold">{player.name}</p>
                        <div className="bg-yellow-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-600" />
                          <span className="font-semibold text-yellow-800">
                            {player.tokens}
                          </span>
                        </div>
                      </div>
                    </div>
                    {index !== players.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Game Area */}
          <div className="flex flex-col items-center gap-8 mb-8">
            <MainCard number={23} tokens={3} />

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow transition-all">
                Take Card
              </button>
              <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow transition-all">
                Pass (-1 Token)
              </button>
            </div>
          </div>

          {/* Current Player's Area */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Cards</h2>
            </div>
            <div className="flex gap-4 mb-6">
              {players
                .find((p) => p.isCurrentPlayer)
                ?.cards.sort((a, b) => a - b)
                .map((cardNumber) => (
                  <Card key={cardNumber} number={cardNumber} size="large" />
                ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-yellow-400 rounded-full w-6 h-6 border border-yellow-500"></div>
              <span className="font-bold">
                × {players.find((p) => p.isCurrentPlayer)?.tokens} tokens
              </span>
            </div>
          </div>

          {/* Mobile Other Players */}
          <div className="lg:hidden mt-8 space-y-4">
            <h2 className="text-xl font-bold">Other Players</h2>
            {players
              .filter((p) => !p.isCurrentPlayer)
              .map((player) => (
                <PlayerCards key={player.id} player={player} />
              ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">Other Players</h2>
          <div className="space-y-4">
            {players
              .filter((p) => !p.isCurrentPlayer)
              .map((player) => (
                <PlayerCards key={player.id} player={player} isCompact={true} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameUI;
export function Sandbox() {
  return <GameUI></GameUI>;
}

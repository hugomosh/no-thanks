// src/components/game/GameBoard.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Player, Room } from "../types";
import { PlayerCards } from "../components/game/players/PlayerCards";
import { PlayerInfo } from "../components/game/players/PlayerInfo";
import { MainCard } from "../components/game/cards/MainCard";
import { Card } from "../components/game/cards/Card";

type GameBoardProps = {
  roomId: string;
  roomCode: string;
  playerId: string;
};

export function GameBoard({ roomId, roomCode, playerId }: GameBoardProps) {
  const [currentCard, setCurrentCard] = useState<number | null>(null);
  const [cardTokens, setCardTokens] = useState(0);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<string | null>(
    null
  );
  const [players, setPlayers] = useState<Record<string, Player>>({});

  useEffect(() => {
    const getGameState = async () => {
      // Get room state
      const { data: room } = await supabase
        .from("rooms")
        .select("current_card, current_player, tokens_on_card")
        .eq("id", roomId)
        .single();

      if (room) {
        setCurrentCard(room.current_card);
        setCurrentTurnPlayerId(room.current_player);
        setCardTokens(room.tokens_on_card);
      }

      // Get all players state
      const { data: playersList } = await supabase
        .from("players")
        .select("id, name, tokens, cards")
        .eq("room_id", roomId);

      if (playersList) {
        const playersMap = playersList.reduce(
          (acc, player) => ({
            ...acc,
            [player.id]: player,
          }),
          {}
        );
        setPlayers(playersMap);
      }
    };

    getGameState();

    // Subscribe to game state changes
    const channel = supabase
      .channel("game_state")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload: RealtimePostgresChangesPayload<Room>) => {
          if (!payload.new) return;
          const newRoom = payload.new as Room;
          setCurrentCard(newRoom.current_card);
          setCurrentTurnPlayerId(newRoom.current_player);
          setCardTokens(newRoom.tokens_on_card);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Refresh all players on any player change
          getGameState();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, playerId]);

  const handleMove = async (action: "take" | "pass") => {
    await supabase.rpc("make_move", {
      p_room_id: roomId,
      p_player_id: playerId,
      p_action: action,
    });
  };

  const isMyTurn = currentTurnPlayerId === playerId;
  const myPlayer = players[playerId];
  const currentTurnPlayer = players[currentTurnPlayerId!];

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">No Thanks!</h1>
                <p className="text-gray-600">Game #{roomCode}</p>
                <p data-testid="current-turn" className="text-gray-800">
                  {isMyTurn ? "Your turn" : `${currentTurnPlayer?.name}'s turn`}
                </p>
              </div>

              <PlayerInfo
                players={players}
                currentTurnPlayerId={currentTurnPlayerId}
                currentPlayerId={playerId}
              />
            </div>
          </div>

          {/* Main Game Area */}
          <div className="flex flex-col items-center gap-8 mb-8">
            <MainCard number={currentCard} tokens={cardTokens} />

            {/* Action Buttons */}
            {isMyTurn && (
              <div className="flex gap-4">
                <button
                  onClick={() => handleMove("take")}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow transition-all"
                >
                  Take Card
                </button>
                <button
                  onClick={() => handleMove("pass")}
                  disabled={!myPlayer || myPlayer.tokens <= 0}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow transition-all disabled:bg-gray-300"
                >
                  Pass (-1 Token)
                </button>
              </div>
            )}
          </div>

          {/* Current Player Area */}
          {myPlayer && (
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Your Cards</h2>
              </div>
              <div
                className="flex flex-wrap gap-3 mb-6"
                data-testid="player-cards"
              >
                {myPlayer.cards
                  .sort((a, b) => a - b)
                  .map((cardNumber) => (
                    <Card key={cardNumber} number={cardNumber} size="large" />
                  ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-yellow-400 rounded-full w-6 h-6 border border-yellow-500"></div>
                <span className="font-bold">
                  ×{" "}
                  <span data-testid="player-tokens-count">
                    {myPlayer.tokens}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Mobile Other Players */}
          <div className="lg:hidden mt-8 space-y-4">
            <h2 className="text-xl font-bold">Other Players</h2>
            {Object.values(players)
              .filter((p) => p.id !== playerId)
              .map((player) => (
                <PlayerCards key={player.id} player={player} />
              ))}
          </div>
        </div>

        {/* Sidebar */}

        <div className="hidden lg:block bg-white rounded-lg shadow-sm p-6 overflow-y-auto max-h-[calc(100vh-2rem)]">
          <h2 className="text-xl font-bold mb-4">Other Players</h2>
          <div className="space-y-4">
            {Object.values(players)
              .filter((p) => p.id !== playerId)
              .map((player) => (
                <PlayerCards key={player.id} player={player} isCompact={true} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

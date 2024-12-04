// src/components/game/GameBoard.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Player = {
  id: string;
  name: string;
  tokens: number;
  cards: number[];
};

type GameBoardProps = {
  roomId: string;
  playerId: string;
};

export function GameBoard({ roomId, playerId }: GameBoardProps) {
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
        (payload) => {
          setCurrentCard(payload.new.current_card);
          setCurrentTurnPlayerId(payload.new.current_player);
          setCardTokens(payload.new.tokens_on_card);
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
    <div className="p-4">
      <div className="mb-4">
        <div className="text-2xl">
          Current Card: <span data-testid="current-card">{currentCard}</span>
        </div>
        <div data-testid="card-tokens" className="text-xl">
          Tokens on card:{" "}
          <span data-testid="card-tokens-count">{cardTokens}</span>
        </div>
      </div>

      <div data-testid="current-turn" className="mb-4">
        {isMyTurn ? "Your turn" : `${currentTurnPlayer?.name}'s turn`}
      </div>

      <div className="mb-4">
        <div data-testid="player-tokens">
          Your tokens:{" "}
          <span data-testid="player-tokens-count">{myPlayer?.tokens}</span>
        </div>
        <div data-testid="player-cards">
          Your cards: {myPlayer?.cards.join(", ")}
        </div>
      </div>

      {isMyTurn && (
        <div className="flex gap-4">
          <button
            onClick={() => handleMove("take")}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Take Card
          </button>
          <button
            onClick={() => handleMove("pass")}
            disabled={!myPlayer || myPlayer.tokens <= 0}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Pass
          </button>
        </div>
      )}

      {/* Other players' info */}
      <div className="mt-4">
        <h3>Other Players:</h3>
        {Object.values(players)
          .filter((p) => p.id !== playerId)
          .map((player) => (
            <div key={player.id} className="mb-2">
              <div>{player.name}</div>
              <div>Tokens: {player.tokens}</div>
              <div>Cards: {player.cards.join(", ")}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

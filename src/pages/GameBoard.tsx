// src/components/game/GameBoard.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type GameBoardProps = {
  roomId: string;
  playerId: string;
};

export function GameBoard({ roomId, playerId }: GameBoardProps) {
  const [currentCard, setCurrentCard] = useState<number | null>(null);
  const [tokensCount, setTokensCount] = useState(11);

  useEffect(() => {
    const getGameState = async () => {
      // Get current card
      const { data: room } = await supabase
        .from("rooms")
        .select("current_card")
        .eq("id", roomId)
        .single();

      if (room) {
        setCurrentCard(room.current_card);
      }

      // Get player tokens
      const { data: player } = await supabase
        .from("players")
        .select("tokens")
        .eq("id", playerId)
        .single();

      if (player) {
        setTokensCount(player.tokens);
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
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `id=eq.${playerId}`,
        },
        (payload) => {
          setTokensCount(payload.new.tokens);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, playerId]);

  return (
    <div>
      <div data-testid="current-card">{currentCard}</div>
      <div data-testid="tokens-count">{tokensCount}</div>
      <div data-testid="current-player">{playerId}</div>
    </div>
  );
}

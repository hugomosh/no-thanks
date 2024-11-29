// src/pages/RoomPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { supabase } from "../lib/supabase";

type Player = {
  name: string;
};

export function RoomPage() {
  const { roomCode } = useParams();
  const [playerCount, setPlayerCount] = useState(1);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const getRoom = async () => {
      const { data: room } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", roomCode)
        .single();

      if (room) {
        setRoomId(room.id);

        // Get players
        const { data: playersList } = await supabase
          .from("players")
          .select("name")
          .eq("room_id", room.id)
          .order("position");

        if (playersList) {
          setPlayers(playersList);
          setPlayerCount(playersList.length);
        }
      }
    };

    getRoom();

    // Set up realtime subscription for players
    const channel = supabase
      .channel("room_players")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          // Refresh player count on any change
          if (roomId) {
            const { count } = await supabase
              .from("players")
              .select("id", { count: "exact" })
              .eq("room_id", roomId);

            setPlayerCount(count || 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, roomId]);

  return (
    <div>
      <div data-testid="room-code">{roomCode}</div>
      <div data-testid="waiting-message">Waiting for players to join...</div>
      <div data-testid="player-count">Players: {playerCount}/7</div>
      <div data-testid="players-list">
        {players.map((player, index) => (
          <div key={index}>{player.name}</div>
        ))}
      </div>
    </div>
  );
}

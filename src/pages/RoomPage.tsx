// src/pages/RoomPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { supabase } from "../lib/supabase";
// src/pages/RoomPage.tsx
export function RoomPage() {
  const { roomCode } = useParams();
  const [playerCount, setPlayerCount] = useState(1);
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const getRoom = async () => {
      const { data: room } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", roomCode)
        .single();

      if (room) {
        setRoomId(room.id);

        const { count } = await supabase
          .from("players")
          .select("id", { count: "exact" })
          .eq("room_id", room.id);

        setPlayerCount(count || 1);
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
    </div>
  );
}

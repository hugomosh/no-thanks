// src/pages/RoomPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { supabase } from "../lib/supabase";

export function RoomPage() {
  const { roomCode } = useParams();
  const [playerCount, setPlayerCount] = useState(1);
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const getRoom = async () => {
      // First get the room id
      const { data: room } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", roomCode)
        .single();

      if (room) {
        setRoomId(room.id);

        // Then get the players count
        const { count } = await supabase
          .from("players")
          .select("id", { count: "exact" })
          .eq("room_id", room.id);

        setPlayerCount(count || 1);
      }
    };

    getRoom();
  }, [roomCode]);

  return (
    <div>
      <div data-testid="room-code">{roomCode}</div>
      <div data-testid="waiting-message">Waiting for players to join...</div>
      <div data-testid="player-count">Players: {playerCount}/7</div>
    </div>
  );
}

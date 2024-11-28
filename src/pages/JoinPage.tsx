// src/pages/JoinPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function JoinPage() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");

  const handleJoin = async () => {
    // First get room id
    const { data: room } = await supabase
      .from("rooms")
      .select("id")
      .eq("code", roomCode)
      .single();

    if (room) {
      // Add player to room
      const { error } = await supabase.from("players").insert({
        room_id: room.id,
        name: playerName,
      });

      if (!error) {
        navigate(`/room/${roomCode}`);
      }
    }
  };

  return (
    <div>
      <input
        data-testid="room-input"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
        placeholder="Room Code"
      />
      <input
        data-testid="player-name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Your Name"
      />
      <button onClick={handleJoin}>Join</button>
    </div>
  );
}

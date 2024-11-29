// src/pages/JoinPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";

export function JoinPage() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");

  const handleJoin = async () => {
    const { data, error } = await supabase.rpc("join_room", {
      p_room_code: roomCode,
      p_player_name: playerName,
    });

    if (!error && data) {
      navigate(`/room/${roomCode}`);
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

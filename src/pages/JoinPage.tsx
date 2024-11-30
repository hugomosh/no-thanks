import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function JoinPage() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");

  const handleJoin = async () => {
    setError("");

    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    const { data, error: supabaseError } = await supabase.rpc("join_room", {
      p_room_code: roomCode,
      p_player_name: playerName,
    });

    if (data?.error) {
      setError(data.error);
      return;
    }

    if (supabaseError) {
      setError(supabaseError.message);
      return;
    }

    if (!error && data && !data.error) {
      // Store our player ID
      localStorage.setItem(`player_id_${roomCode}`, data.player_id);
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
      {error && <div data-testid="error-message">{error}</div>}
    </div>
  );
}

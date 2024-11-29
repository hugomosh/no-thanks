import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function HomePage() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");

  const handleCreateRoom = async () => {
    setError("");

    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    const { data, error: supabaseError } = await supabase.rpc("create_room", {
      p_player_name: playerName,
    });

    if (supabaseError) {
      setError(supabaseError.message);
      return;
    }

    if (data) {
      navigate(`/room/${data.room_code}`);
    }
  };

  return (
    <div>
      <input
        data-testid="player-name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Your Name"
      />
      <button onClick={handleCreateRoom}>Create Room</button>
      {error && <div data-testid="error-message">{error}</div>}
    </div>
  );
}

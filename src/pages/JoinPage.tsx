import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users, UserPlus } from "lucide-react";
import { supabase } from "../lib/supabase";

export function JoinPage() {
  const { roomCode: roomCodeParam } = useParams();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(roomCodeParam);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-1 mb-6">
          <h1 className="text-3xl font-bold text-center text-gray-900">
            No Thanks!
          </h1>
          <p className="text-center text-gray-500">
            Join an existing game room
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="playerName"
              className="block text-sm font-medium text-gray-700"
            >
              Your Name
            </label>
            <input
              id="playerName"
              data-testid="player-name"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="roomCode"
              className="block text-sm font-medium text-gray-700"
            >
              Room Code
            </label>
            <input
              id="roomCode"
              data-testid="room-input"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter room code"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {error && (
            <div
              data-testid="error-message"
              className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 text-sm"
            >
              {error}
            </div>
          )}

          <button
            onClick={handleJoin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center justify-center transition-colors"
          >
            <Users className="mr-2 h-5 w-5" />
            Join Room
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full border border-gray-300 hover:border-gray-400 bg-white text-gray-700 px-4 py-3 rounded-md flex items-center justify-center transition-colors"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Create New Room
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const GameLobby = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      // Create room
      const { data: roomId, error: roomError } = await supabase.rpc("create_room");

      if (roomError) throw roomError;

      // Join as first player
      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert({
          room_id: roomId,
          name: playerName,
          is_ready: true,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Store player ID in localStorage
      localStorage.setItem("playerId", player.id);

      // Navigate to room
      navigate(`/room/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      setError("Please enter your name and room code");
      return;
    }

    try {
      // Find room
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", roomCode.toUpperCase())
        .single();

      if (roomError) throw new Error("Room not found");

      // Join room
      const { data: player, error: playerError } = await supabase
        .from("players")
        .insert({
          room_id: room.id,
          name: playerName,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Store player ID in localStorage
      localStorage.setItem("playerId", player.id);

      // Navigate to room
      navigate(`/room/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">No Thanks!</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter your name"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={createRoom}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Create Room
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter room code"
            />
          </div>

          <button
            onClick={joinRoom}
            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;

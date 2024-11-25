import React, { useState } from "react";
import { Users, UserPlus, Link as LinkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

const GameLobby = () => {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<String | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const createRoom = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("Please enter your name first");
      return;
    }
    setError(null);

    try {
      const { data, error: dbError } = await supabase.rpc("create_room", {
        player_name: playerName.trim(),
      });

      if (dbError) throw dbError;

      if (data && data[0]) {
        const { room_id, room_code, player_id } = data[0];
        navigate(`/room/${room_code}`, {
          state: { playerId: player_id, roomId: room_id },
        });
      }
    } catch (err) {
      setError("Failed to create room. Please try again.");
      console.error("Error creating room:", err);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name first");
      return;
    }
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }
    // Add your room joining logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-1 mb-6">
          <h1 className="text-3xl font-bold text-center text-gray-900">
            No Thanks!
          </h1>
          <p className="text-center text-gray-500">
            Join or create a new game room
          </p>
        </div>

        <form onSubmit={createRoom} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label
              htmlFor="playerName"
              className="block text-sm font-medium text-gray-700"
            >
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {isJoining ? (
            <div className="space-y-2">
              <label
                htmlFor="roomCode"
                className="block text-sm font-medium text-gray-700"
              >
                Room Code
              </label>
              <div className="flex space-x-2">
                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Enter room code"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
                <button
                  onClick={joinRoom}
                  className="w-24 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Join
                </button>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center justify-center transition-colors"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Create New Room
            </button>
          )}

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          <button
            className="w-full border border-gray-300 hover:border-gray-400 bg-white text-gray-700 px-4 py-3 rounded-md flex items-center justify-center transition-colors"
            onClick={() => setIsJoining(!isJoining)}
          >
            {isJoining ? (
              <>
                <UserPlus className="mr-2 h-5 w-5" />
                Create New Room Instead
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-5 w-5" />
                Join Existing Room
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GameLobby;

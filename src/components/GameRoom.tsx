import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Copy, Users } from "lucide-react";
import { supabase } from "../lib/supabase";

const GameRoom = () => {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [room, setRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const playerId = location.state?.playerId;

  useEffect(() => {
    // Redirect if no playerId in state
    if (!playerId) {
      navigate("/");
      return;
    }

    const loadRoom = async () => {
      // Get room and player data
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select(
          `
          *,
          players (*)
        `
        )
        .eq("code", code)
        .single();

      if (roomError || !roomData) {
        console.error("Error loading room:", roomError);
        navigate("/");
        return;
      }

      setRoom(roomData);
      setPlayers(roomData.players);
      setIsHost(roomData.host_id === playerId);
    };

    loadRoom();

    const roomId = room?.id! || "no_room_id";
    // Subscribe to player changes
    const playersSubscription = supabase
      .channel("room_players")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log({ payload });

          // Reload room data when players change
          loadRoom();
        }
      )
      .subscribe(console.log);

    // Cleanup subscription
    return () => {
      supabase.removeChannel(playersSubscription);
    };
  }, [code, playerId, navigate]);

  const copyRoomLink = () => {
    const url = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const startGame = async () => {
    if (!isHost) return;

    try {
      const { error } = await supabase.rpc("start_game", { room_code: code });

      if (error) throw error;
    } catch (err) {
      console.error("Error starting game:", err);
    }
  };

  if (!room)
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Room: {code}</h1>
            <button
              onClick={copyRoomLink}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              data-cy="copy-link-button"
            >
              <Copy className="h-4 w-4" />
              {copySuccess ? "Copied!" : "Share Link"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Players Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-900">
              <Users className="h-5 w-5" />
              <h3 className="font-semibold">Players ({players.length}/7)</h3>
            </div>

            <div className="space-y-2">
              <pre>{JSON.stringify(room, 1, 1)}</pre>
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                  data-cy="player-item"
                >
                  <span className="flex-1 text-gray-900">{player.name}</span>
                  {player.is_host && (
                    <span className="text-sm text-gray-500">(Host)</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Game Controls */}
          {isHost ? (
            <button
              onClick={startGame}
              disabled={players.length < 3}
              className={`w-full py-3 px-4 rounded-md text-white font-medium
                ${
                  players.length < 3
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              data-cy="start-game-button"
            >
              {players.length < 3
                ? `Need ${3 - players.length} more players to start`
                : "Start Game"}
            </button>
          ) : (
            <div className="text-center text-gray-500 py-3">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameRoom;

// src/pages/RoomPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Users, PlayCircle, Trophy, RotateCw, Share2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { GameBoard } from "./GameBoard";
import { GameScore } from "../components/game/GameScore";
import { Player, Room } from "../types";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type RoomStatus = "waiting" | "playing" | "finished";

export function RoomPage() {
  const { roomCode } = useParams();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [status, setStatus] = useState<RoomStatus>("waiting");
  const [shareMessage, setShareMessage] = useState<string>("");

  useEffect(() => {
    const getRoom = async () => {
      // First check local storage for our player ID for this room
      const storedPlayerId = localStorage.getItem(`player_id_${roomCode}`);
      if (storedPlayerId) {
        setMyPlayerId(storedPlayerId);
      }

      const { data: room } = await supabase
        .from("rooms")
        .select("id, status, current_player")
        .eq("code", roomCode)
        .single();

      if (room) {
        setRoomId(room.id);
        setStatus(room.status);
        //setCurrentPlayerId(room.current_player);

        const { data: playersList } = await supabase
          .from("players")
          .select("id, name, position, tokens, cards")
          .eq("room_id", room.id)
          .order("position");

        if (playersList) {
          setPlayers(playersList);

          // If we don't have our player ID stored, and we're in the players list
          // This means we just created/joined the room
          if (!storedPlayerId) {
            const me = playersList.find((p) => p.id === room.current_player);
            if (me) {
              setMyPlayerId(me.id);
              localStorage.setItem(`player_id_${roomCode}`, me.id);
            }
          }
        }
      }
    };

    getRoom();

    // Set up realtime subscription
    const channel = supabase
      .channel("room_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `code=eq.${roomCode}`,
        },
        (payload: RealtimePostgresChangesPayload<Room>) => {
          if (!payload.new) return;
          const newRoom = payload.new as Room;
          setStatus(newRoom.status);
          //setCurrentPlayerId(newRoom.current_player);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Refresh players list on any player change
          getRoom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, roomId]);

  const handleStartGame = async () => {
    if (myPlayerId) {
      await supabase.rpc("start_game", {
        p_room_code: roomCode,
        p_player_id: myPlayerId,
      });
    }
  };

  const handleStartNewGame = async () => {
    if (roomId && myPlayerId) {
      await supabase.rpc("start_new_game", {
        p_room_id: roomId,
        p_player_id: myPlayerId,
      });
    }
  };

  const handleShare = async () => {
    const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const shareUrl = `${baseUrl}${base}/join/${roomCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my No Thanks! game",
          text: `Join my game with code: ${roomCode}`,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage("Link copied to clipboard!");
        setTimeout(() => setShareMessage(""), 2000);
      } catch (err) {
        console.log("Error copying to clipboard:", err);
      }
    }
  };

  const isCreator = players.find((p) => p.id === myPlayerId)?.position === 1;
  const canStartGame = isCreator && players.length >= 2 && status === "waiting";

  const WaitingRoom = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Waiting for players...
          </h2>
          <p className="text-gray-500">Share the room code with your friends</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-500">Room:</span>
            <span
              className="font-mono text-lg font-bold text-blue-600"
              data-testid="room-code"
            >
              {roomCode}
            </span>
          </div>
          <button
            onClick={handleShare}
            aria-label="share"
            data-testid="share-button"
            className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {shareMessage && (
        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md">
          {shareMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold" data-testid="player-count">
              Players: {players.length}/7
            </h3>
          </div>
          {canStartGame && (
            <button
              onClick={handleStartGame}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              Start Game
            </button>
          )}
        </div>

        <div className="divide-y" data-testid="players-list">
          {players.map((player, index) => (
            <div key={player.id} className="py-3 flex items-center gap-2">
              <div
                className={`w-8 h-8 ${
                  player.position === 1 ? "bg-blue-500" : "bg-gray-400"
                } rounded-full flex items-center justify-center`}
              >
                <span className="text-white font-bold">P{index + 1}</span>
              </div>
              <span className="font-medium">{player.name}</span>
              {player.position === 1 && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  Creator
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const GameOver = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-2" />
        <h2
          className="text-2xl font-bold text-gray-900"
          data-testid="game-status"
        >
          Game Over!
        </h2>
        <p className="text-gray-500">Here are the final scores</p>
      </div>

      <GameScore players={players} />

      {isCreator && (
        <button
          onClick={handleStartNewGame}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCw className="w-5 h-5" />
          Play Again
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {" "}
        {/* Changed from max-w-2xl to max-w-7xl for GameBoard */}
        {status === "waiting" ? (
          <div className="max-w-2xl mx-auto">
            {" "}
            {/* Keep waiting room narrower */}
            <WaitingRoom />
          </div>
        ) : status === "finished" ? (
          <div className="max-w-2xl mx-auto">
            {" "}
            {/* Keep game over screen narrower */}
            <GameOver />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">No Thanks!</h1>
                <p className="text-gray-500">Game #{roomCode}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-gray-500">Room:</span>
                  <span
                    className="font-mono text-lg font-bold text-blue-600"
                    data-testid="room-code"
                  >
                    {roomCode}
                  </span>
                </div>
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div data-testid="game-status" className="sr-only">
              Game started
            </div>

            <GameBoard
              roomId={roomId!}
              roomCode={roomCode!}
              playerId={myPlayerId!}
            />
          </div>
        )}
      </div>
    </div>
  );
}

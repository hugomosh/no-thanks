// src/pages/RoomPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  //const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [status, setStatus] = useState<RoomStatus>("waiting");

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

  const isCreator = players.find((p) => p.id === myPlayerId)?.position === 1;
  const canStartGame = isCreator && players.length >= 2 && status === "waiting";

  return (
    <div>
      <div data-testid="room-code">{roomCode}</div>
      <div data-testid="player-count">Players: {players.length}/7</div>

      {status === "waiting" ? (
        <>
          <div data-testid="waiting-message">
            Waiting for players to join...
          </div>
          <div data-testid="players-list">
            {players.map((player) => (
              <div key={player.id}>{player.name}</div>
            ))}
          </div>
          {canStartGame && (
            <button onClick={handleStartGame}>Start Game</button>
          )}
        </>
      ) : status === "finished" ? (
        <>
          <div data-testid="game-status">Game Over</div>
          <GameScore players={players} />
          {isCreator && ( // Only show to creator
            <button onClick={handleStartNewGame}>Play Again</button>
          )}
        </>
      ) : (
        <>
          <div data-testid="game-status">Game started</div>
          <GameBoard
            roomId={roomId!}
            roomCode={roomCode}
            playerId={myPlayerId!}
          />
        </>
      )}
    </div>
  );
}

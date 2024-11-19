// src/components/NoThanksGameUI.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Coins, User } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Room, Player } from "../lib/types";

export type PlayerScore = {
  id: string;
  name: string;
  score: number;
  cards: number[];
  tokens: number;
};

const calculatePlayerScore = (player: Player) => {
  const sortedCards = [...(player.cards || [])].sort((a, b) => a - b);
  let score = -(player.tokens || 0); // Start with negative tokens

  let i = 0;
  while (i < sortedCards.length) {
    let j = i;
    // Find consecutive sequence
    while (j + 1 < sortedCards.length && sortedCards[j + 1] === sortedCards[j] + 1) {
      j++;
    }
    // Add only the lowest card in the sequence
    score += sortedCards[i];
    i = j + 1;
  }

  return score;
};

const getCardHighlighting = (cards: number[]) => {
  const sortedCards = [...cards].sort((a, b) => a - b);
  const scoringCards = new Set<number>();

  let i = 0;
  while (i < sortedCards.length) {
    let j = i;
    // Find consecutive sequence
    while (j + 1 < sortedCards.length && sortedCards[j + 1] === sortedCards[j] + 1) {
      j++;
    }
    // Mark the lowest card in the sequence
    scoringCards.add(sortedCards[i]);
    i = j + 1;
  }

  return scoringCards;
};

const NoThanksGameUI = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [showScores, setShowScores] = useState(false);

  // Initialize game and subscriptions
  useEffect(() => {
    if (!roomId) return;

    const playerId = localStorage.getItem("playerId");
    if (!playerId) {
      navigate("/");
      return;
    }

    // Set up real-time subscriptions first
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Room update:", payload);
          setRoom(payload.new as Room);
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
        (payload) => {
          console.log("Player update:", payload);
          if (payload.eventType === "DELETE") {
            setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id));
          } else if (payload.eventType === "INSERT") {
            setPlayers((prev) => [...prev, payload.new as Player]);
          } else if (payload.eventType === "UPDATE") {
            setPlayers((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Player) : p))
            );
            // Update current player if it's us
            if (playerId === payload.new.id) {
              setCurrentPlayer(payload.new as Player);
            }
          }
        }
      );

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // After subscription is confirmed, fetch initial state
        const fetchGameState = async () => {
          try {
            const [roomResponse, playersResponse] = await Promise.all([
              supabase.from("rooms").select("*").eq("id", roomId).single(),
              supabase.from("players").select("*").eq("room_id", roomId),
            ]);

            if (roomResponse.error) throw roomResponse.error;
            if (playersResponse.error) throw playersResponse.error;

            setRoom(roomResponse.data);
            setPlayers(playersResponse.data);

            // Find current player
            const player = playersResponse.data.find((p) => p.id === playerId);
            if (player) {
              setCurrentPlayer(player);
            } else {
              localStorage.removeItem("playerId");
              navigate("/");
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load game");
            console.error("Error fetching game state:", err);
          } finally {
            setLoading(false);
          }
        };

        await fetchGameState();
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, navigate]);

  // Update the useEffect that watches room status to calculate scores
  useEffect(() => {
    if (room?.status === "ended" && players.length > 0 && !showScores) {
      const playerScores = players.map((player) => ({
        id: player.id,
        name: player.name,
        score: calculatePlayerScore(player),
        cards: player.cards || [],
        tokens: player.tokens || 0,
      }));

      // Sort by score (lowest wins)
      playerScores.sort((a, b) => a.score - b.score);
      setScores(playerScores);
      setShowScores(true);
    }
  }, [room?.status, players]);

  useEffect(() => {
    if (room && players.length > 0) {
      console.log("Turn state:", {
        currentPlayerIndex: room.current_player_index,
        players: players.map((p) => ({
          id: p.id,
          name: p.name,
          isActive: p.is_active,
        })),
        activePlayer: players.find((p) => p.is_active)?.name,
      });
    }
  }, [room?.current_player_index, players]);

  // Game actions
  const handleNewGame = async () => {
    if (!room) return;

    try {
      // Reset all players
      const { error: playersError } = await supabase
        .from("players")
        .update({
          cards: [],
          tokens: 11,
          is_active: false,
          is_ready: true,
        })
        .eq("room_id", room.id);

      if (playersError) throw playersError;

      // Reset room
      const { error: roomError } = await supabase
        .from("rooms")
        .update({
          status: "waiting",
          current_card: null,
          tokens_on_card: 0,
          deck: [],
          removed_cards: [],
          current_player_index: 0,
        })
        .eq("id", room.id);

      if (roomError) throw roomError;

      setShowScores(false);
      setScores([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start new game");
    }
  };

  const handleStartGame = async () => {
    if (!room) return;

    try {
      // Initialize deck (3-35)
      const deck = Array.from({ length: 33 }, (_, i) => i + 3);
      // Shuffle deck
      const shuffledDeck = deck.sort(() => Math.random() - 0.5);
      // Remove 9 random cards
      const removedCards = shuffledDeck.splice(0, 9);

      const { error } = await supabase
        .from("rooms")
        .update({
          status: "playing",
          deck: shuffledDeck,
          removed_cards: removedCards,
          current_card: shuffledDeck.pop(),
          current_player_index: 0,
        })
        .eq("id", room.id);

      if (error) throw error;

      // Set first player as active
      const firstPlayer = players[0];
      if (firstPlayer) {
        await supabase.from("players").update({ is_active: true }).eq("id", firstPlayer.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game");
    }
  };

  const handleTakeCard = async () => {
    if (!room || !currentPlayer || room.current_card === null) return;

    try {
      setError(null);
      console.log("Taking card - Current state:", {
        currentCard: room.current_card,
        deck: room.deck,
        currentPlayerIndex: room.current_player_index,
        playerCount: players.length,
        currentPlayerId: currentPlayer.id,
      });

      // Update player state - keep them active since they took a card
      const { error: playerError } = await supabase
        .from("players")
        .update({
          cards: [...(currentPlayer.cards || []), room.current_card],
          tokens: currentPlayer.tokens + (room.tokens_on_card || 0),
        })
        .eq("id", currentPlayer.id);

      if (playerError) throw playerError;

      // Get next card from deck
      const updatedDeck = [...(room.deck || [])];
      const nextCard = updatedDeck.length > 0 ? updatedDeck.pop() : null;

      // Update room state
      const { error: roomError } = await supabase
        .from("rooms")
        .update({
          current_card: nextCard,
          deck: updatedDeck,
          tokens_on_card: 0,
          // Don't change current_player_index since same player continues
          status: nextCard === null ? "ended" : "playing",
        })
        .eq("id", room.id);

      if (roomError) throw roomError;

      console.log("Card taken - New state:", {
        nextCard,
        remainingDeck: updatedDeck?.length,
        currentPlayerStillActive: currentPlayer.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to take card");
      console.error("Error taking card:", err);
    }
  };

  const handlePlaceToken = async () => {
    if (!room || !currentPlayer || currentPlayer.tokens <= 0) return;

    try {
      setError(null);
      console.log("Placing token - Initial state:", {
        currentPlayerIndex: room.current_player_index,
        playerCount: players.length,
        currentPlayerId: currentPlayer.id,
      });

      // Calculate next player index
      const nextPlayerIndex = (room.current_player_index + 1) % players.length;
      const nextPlayer = players[nextPlayerIndex];

      if (!nextPlayer) {
        throw new Error("Next player not found");
      }

      // Deactivate current player
      const { error: currentPlayerError } = await supabase
        .from("players")
        .update({
          tokens: currentPlayer.tokens - 1,
          is_active: false,
        })
        .eq("id", currentPlayer.id);

      if (currentPlayerError) throw currentPlayerError;

      // Activate next player
      const { error: nextPlayerError } = await supabase
        .from("players")
        .update({
          is_active: true,
        })
        .eq("id", nextPlayer.id);

      if (nextPlayerError) throw nextPlayerError;

      // Update room state
      const { error: roomError } = await supabase
        .from("rooms")
        .update({
          tokens_on_card: (room.tokens_on_card || 0) + 1,
          current_player_index: nextPlayerIndex,
        })
        .eq("id", room.id);

      if (roomError) throw roomError;

      console.log("Token placed - New state:", {
        nextPlayerIndex,
        nextPlayerId: nextPlayer.id,
        newTokensOnCard: (room.tokens_on_card || 0) + 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place token");
      console.error("Error placing token:", err);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        Loading game...
      </div>
    );
  }

  if (!room || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        Game not found or you're not a player
      </div>
    );
  }

  const isCurrentTurn = currentPlayer.is_active;
  const canTakeAction = room.status === "playing" && isCurrentTurn;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Game Header */}
        {room.status === "playing" && (
          <div className="mt-4 bg-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-blue-800">
                Current Turn:{" "}
                <span className="font-bold">
                  {players[room.current_player_index]?.name}
                  {players[room.current_player_index]?.id === currentPlayer?.id && " (You)"}
                </span>
              </div>
              <div className="text-sm text-blue-600">
                {players.map((player, index) => (
                  <span
                    key={player.id}
                    className={`mx-1 ${
                      index === room.current_player_index ? "font-bold" : "opacity-50"
                    }`}
                  >
                    {index + 1}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">No Thanks!</h1>
            <div className="text-sm text-gray-500">
              Room Code: <span className="font-mono font-bold">{room.code}</span>
            </div>
          </div>

          {room.status === "waiting" && (
            <div className="mt-4 flex gap-4 items-center">
              <button
                onClick={handleStartGame}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={players.length < 3}
              >
                Start Game
              </button>
              {players.length < 3 && (
                <div className="flex items-center text-amber-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Need at least 3 players to start
                </div>
              )}
            </div>
          )}
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        {/* Game Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Card and Tokens */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Current Card</h2>
              <div className="flex items-center justify-center mb-6">
                {room.current_card !== null ? (
                  <div className="relative">
                    <div className="w-32 h-48 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">{room.current_card}</span>
                    </div>
                    {room.tokens_on_card > 0 && (
                      <div className="absolute -top-3 -right-3 bg-yellow-400 rounded-full w-8 h-8 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-yellow-800" />
                        <span className="absolute -bottom-6 text-sm font-semibold">
                          {room.tokens_on_card}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-32 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">No Card</span>
                  </div>
                )}
              </div>

              {room.status === "playing" && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleTakeCard}
                    disabled={!canTakeAction}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Take Card
                  </button>
                  <button
                    onClick={handlePlaceToken}
                    disabled={!canTakeAction || currentPlayer.tokens === 0}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Place Token
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Players */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Players</h2>
            <div className="space-y-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg ${
                    player.is_active ? "bg-blue-50 border-2 border-blue-500" : "bg-gray-50"
                  } ${player.id === currentPlayer.id ? "ring-2 ring-green-500" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      <span className="font-semibold">
                        {player.name}
                        {player.id === currentPlayer.id && " (You)"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Coins className="w-5 h-5 mr-1 text-yellow-500" />
                      <span>{player.tokens}</span>
                    </div>
                  </div>
                  {player.cards && player.cards.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {player.cards.map((card, cardIndex) => (
                        <div
                          key={cardIndex}
                          className="w-8 h-12 bg-blue-500 rounded flex items-center justify-center"
                        >
                          <span className="text-xs font-bold text-white">{card}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Game Status */}
        {room.status === "ended" && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Game Over!</h2>

            <div className="space-y-4">
              {scores.map((playerScore, index) => {
                const scoringCards = getCardHighlighting(playerScore.cards);

                return (
                  <div
                    key={playerScore.id}
                    className={`p-4 rounded-lg ${
                      index === 0 ? "bg-yellow-50 border-2 border-yellow-500" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {index === 0 && <span className="text-yellow-500 text-2xl">👑</span>}
                        <span className="font-semibold text-lg">
                          {playerScore.name}
                          {playerScore.id === currentPlayer?.id && " (You)"}
                        </span>
                      </div>
                      <div className="text-xl font-bold">{playerScore.score} points</div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        {playerScore.tokens} tokens
                      </div>
                      <div className="flex flex-wrap gap-1">
                        Cards:{" "}
                        {playerScore.cards
                          .sort((a, b) => a - b)
                          .map((card, idx) => (
                            <span
                              key={idx}
                              className={`${
                                scoringCards.has(card) ? "font-bold text-blue-600" : "text-gray-500"
                              }`}
                            >
                              {card}
                              {idx < playerScore.cards.length - 1 ? ", " : ""}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Score = {[...scoringCards].sort((a, b) => a - b).join(" + ")} -{" "}
                      {playerScore.tokens} tokens
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex gap-4 justify-center">
              <button
                onClick={handleNewGame}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Play Again
              </button>
              <button
                onClick={() => navigate("/")}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoThanksGameUI;

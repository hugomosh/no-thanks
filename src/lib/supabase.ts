// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Types for our database
export type Room = {
  id: string;
  code: string;
  status: "waiting" | "playing" | "ended";
  current_card: number | null;
  tokens_on_card: number;
  deck: number[];
  removed_cards: number[];
  current_player_index: number;
  created_at: string;
};

export type Player = {
  id: string;
  room_id: string;
  name: string;
  tokens: number;
  cards: number[];
  is_active: boolean;
  is_ready: boolean;
  created_at: string;
};

// Game room hook
export const useGameRoom = (roomId: string | null) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // Initial fetch
    const fetchRoom = async () => {
      try {
        const [roomResponse, playersResponse] = await Promise.all([
          supabase.from("rooms").select("*").eq("id", roomId).single(),
          supabase.from("players").select("*").eq("room_id", roomId),
        ]);

        if (roomResponse.error) throw roomResponse.error;
        if (playersResponse.error) throw playersResponse.error;

        setRoom(roomResponse.data);
        setPlayers(playersResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();

    // Real-time subscriptions
    const roomSubscription = supabase
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
          if (payload.eventType === "DELETE") {
            setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id));
          } else if (payload.eventType === "INSERT") {
            setPlayers((prev) => [...prev, payload.new as Player]);
          } else if (payload.eventType === "UPDATE") {
            setPlayers((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Player) : p))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomSubscription);
    };
  }, [roomId]);

  return { room, players, loading, error };
};

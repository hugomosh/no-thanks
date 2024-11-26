import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const tasks = {
  async createRoom(playerName: string) {
    const { data, error } = await supabase.rpc("create_room", {
      player_name: playerName,
    });

    if (error) throw error;
    return data[0];
  },

  async joinRoom(roomCode: string, playerName: string) {
    const { data, error } = await supabase.rpc("join_room", {
      input_code: roomCode,
      input_name: playerName,
    });

    if (error) throw error;
    return data[0];
  },

  async getRoomPlayers(roomId: string) {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("room_id", roomId);

    if (error) throw error;
    return data;
  },

  async clearTestData() {
    // Clean up test data older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    await supabase
      .from("rooms")
      .delete()
      .lt("created_at", oneHourAgo.toISOString());
  },
};

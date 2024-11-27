import { createClient } from "@supabase/supabase-js";

console.log("CUYSHBUN");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

//console.log(Cypress.env());

const supabase = createClient(url!, key!);

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
      target_room_code: roomCode,
      player_name: playerName,
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

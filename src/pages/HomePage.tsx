import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";

export function HomePage() {
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    const { data, error } = await supabase.rpc("create_room");

    if (!error && data) {
      navigate(`/room/${data.room_code}`);
    }
  };

  return (
    <div>
      <button onClick={handleCreateRoom}>Create Room</button>
    </div>
  );
}

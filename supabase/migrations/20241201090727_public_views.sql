alter publication supabase_realtime drop table rooms;

alter publication supabase_realtime 
  add table rooms (
    id,          -- Need this for replica identity
    code,
    status,
    current_card,
    current_player,
    tokens_on_card
  );
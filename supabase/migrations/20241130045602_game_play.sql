-- Function to initialize and start game
create or replace function start_game(p_room_code text, p_player_id uuid) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_is_creator boolean;
  v_player_count integer;
  v_deck integer[];
  v_first_card integer;
  v_first_player_id uuid;
begin
  -- Get room and validate caller is creator
  select id into v_room_id 
  from rooms 
  where code = p_room_code;

  select (position = 1) into v_is_creator 
  from players 
  where room_id = v_room_id and id = p_player_id;

  if not v_is_creator then
    return json_build_object('error', 'Only room creator can start the game');
  end if;

  -- Check player count
  select count(*) into v_player_count 
  from players 
  where room_id = v_room_id;

  if v_player_count < 2 then
    return json_build_object('error', 'Need at least 2 players to start');
  end if;

  -- Initialize deck (3-35)
  select array_agg(n order by random())
  into v_deck
  from (
    select n 
    from generate_series(3, 35) n 
    order by random() 
    limit 24  -- 33 - 9 cards
  ) numbers;

  -- Get first card and remove it from deck
  v_first_card := v_deck[1];
  v_deck := v_deck[2:array_length(v_deck, 1)];

  -- Select random first player
  select id into v_first_player_id
  from players
  where room_id = v_room_id
  order by random()
  limit 1;

  -- Update room with initial game state
  update rooms
  set status = 'playing',
      deck = v_deck,
      current_card = v_first_card,
      current_player = v_first_player_id,
      tokens_on_card = 0
  where id = v_room_id;

  return json_build_object(
    'status', 'playing',
    'current_card', v_first_card,
    'current_player', v_first_player_id
  );
end;
$$;
create or replace function start_new_game(p_room_id uuid, p_player_id uuid) returns json
language plpgsql
as $$
declare
  v_is_creator boolean;
  v_player_count integer;
  v_deck integer[];
  v_first_card integer;
  v_first_player_id uuid;
begin
  -- Verify caller is creator
  select (position = 1) into v_is_creator 
  from players 
  where room_id = p_room_id and id = p_player_id;

  if not v_is_creator then
    return json_build_object('error', 'Only room creator can start new game');
  end if;

  -- Check player count
  select count(*) into v_player_count 
  from players 
  where room_id = p_room_id;

  if v_player_count < 2 then
    return json_build_object('error', 'Need at least 2 players to start');
  end if;

  -- Initialize new deck (3-35, minus 9 random cards)
  select array_agg(n order by random())
  into v_deck
  from (
    select n 
    from generate_series(3, 35) n 
    order by random() 
    limit 24
  ) numbers;

  -- Get first card
  v_first_card := v_deck[1];
  v_deck := v_deck[2:array_length(v_deck, 1)];

  -- Select random first player
  select id into v_first_player_id
  from players
  where room_id = p_room_id
  order by random()
  limit 1;

  -- Reset all players
  update players
  set tokens = 11,
      cards = '{}'::integer[]
  where room_id = p_room_id;

  -- Update room with initial game state
  update rooms
  set status = 'playing',
      deck = v_deck,
      current_card = v_first_card,
      current_player = v_first_player_id,
      tokens_on_card = 0
  where id = p_room_id;

  return json_build_object(
    'success', true,
    'current_player', v_first_player_id
  );
end;
$$;
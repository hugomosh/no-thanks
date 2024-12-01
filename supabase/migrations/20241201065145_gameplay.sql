create
or replace function make_move (p_room_id uuid, p_player_id uuid, p_action text) returns json language plpgsql as $$
declare
  v_current_card integer;
  v_card_tokens integer;
  v_next_player_id uuid;
  v_player_tokens integer;
  v_player_position integer;
  v_total_players integer;
  v_deck integer[];
begin
  begin
    -- Get room info
    select current_card, tokens_on_card, deck
    into v_current_card, v_card_tokens, v_deck
    from rooms 
    where id = p_room_id
    for update;

    -- Verify it's player's turn
    if not exists (
      select 1 
      from rooms 
      where id = p_room_id 
      and current_player = p_player_id
    ) then
      raise exception 'Not your turn';
    end if;

    -- Get player info with lock
    select tokens, position
    into v_player_tokens, v_player_position
    from players
    where id = p_player_id
    for update;

    -- Get total players for turn calculation
    select count(*) 
    into v_total_players
    from players 
    where room_id = p_room_id;

    if p_action = 'take' then
      -- Take card: add card and tokens to player
      update players
      set cards = array_append(cards, v_current_card),
          tokens = tokens + v_card_tokens
      where id = p_player_id;

      -- Keep same player as next
      v_next_player_id := p_player_id;

        -- Draw next card
        if v_deck is null or cardinality(v_deck) = 0 then
        -- This was the last card, end game
        update rooms
        set status = 'finished',
            current_card = null,
            tokens_on_card = 0,
            deck = null  -- Explicitly set to null for consistency
        where id = p_room_id;
        else
        -- Get next card from deck
        update rooms
        set current_card = v_deck[1],
            deck = v_deck[2:array_length(v_deck, 1)],
            tokens_on_card = 0
        where id = p_room_id;
        end if;

      -- No change in current_player when taking a card

    elsif p_action = 'pass' then
      -- Check if player has tokens
      if v_player_tokens <= 0 then
        raise exception 'No tokens available to pass';
      end if;

      -- Use token
      update players
      set tokens = tokens - 1
      where id = p_player_id;

      -- Add token to card
      update rooms
      set tokens_on_card = tokens_on_card + 1
      where id = p_room_id;

      -- Get next player
      select id into v_next_player_id
      from players
      where room_id = p_room_id
      and position = (v_player_position % v_total_players) + 1;

      -- Update current player only when passing
      update rooms
      set current_player = v_next_player_id
      where id = p_room_id;

    else
      raise exception 'Invalid action';
    end if;

    return json_build_object(
      'success', true,
      'next_player', v_next_player_id
    );
  exception
    when others then
      return json_build_object(
        'error', SQLERRM
      );
  end;
end;
$$;

-- supabase/migrations/20240328000000_initial_setup.sql

-- Create the basic tables
create table rooms (
  id uuid primary key,
  code text unique,
  status text default 'waiting',
  current_player uuid,
  current_card integer,
  tokens_on_card integer default 0,
  deck integer[],
  created_at timestamp with time zone default now()
);

create table players (
  id uuid primary key,
  room_id uuid references rooms,
  name text,
  tokens integer default 11,
  cards integer[] default '{}',
  position integer,
  created_at timestamp with time zone default now()
);

-- Create table for three letter words
create table word_bank (
  word text primary key
  check (word ~ '^[a-z]{3}$')
);

-- Insert initial three letter words
insert into word_bank (word) values 
  ('cat'), ('dog'), ('bat'), ('pig'), ('fox'), ('owl'), ('rat'), 
  ('ink'), ('jam'), ('key'), ('log'), ('map'), ('nut'), ('orb'),
  ('pen'), ('ray'), ('sky'), ('tax'), ('web'), ('yam'), ('zip');

-- Function to generate room code
create function generate_room_code() returns text
language plpgsql
as $$
declare
  result text;
  word1 text;
  word2 text;
  word3 text;
begin
  -- Select 3 random words
  select word into word1 from word_bank order by random() limit 1;
  select word into word2 from word_bank where word != word1 order by random() limit 1;
  select word into word3 from word_bank where word != word1 and word != word2 order by random() limit 1;
  
  result := word1 || '-' || word2 || '-' || word3;
  return result;
end;
$$;

-- Function to create a new room
create or replace function create_room(p_player_name text) returns json
language plpgsql
as $$
declare
  new_room_code text;
  new_room_id uuid;
  new_player_id uuid;
begin
  -- Generate unique room code
  loop
    new_room_code := generate_room_code();
    begin
      insert into rooms (id, code)
      values (gen_random_uuid(), new_room_code)
      returning id into new_room_id;
      exit; -- Exit loop if insert succeeded
    exception when unique_violation then
      -- If room code already exists, try again
      continue;
    end;
  end loop;

  -- Create first player
  insert into players (id, room_id, name, position)
  values (gen_random_uuid(), new_room_id, p_player_name, 1)
  returning id into new_player_id;

  return json_build_object(
    'room_id', new_room_id,
    'room_code', new_room_code,
    'player_id', new_player_id
  );
end;
$$;

-- Function to join a room
create function join_room(p_room_code text, p_player_name text) returns json
language plpgsql
as $$
declare
  target_room_id uuid;
  new_player_id uuid;
  player_count integer;
  new_position integer;
begin
  -- Get room id and validate room exists
  select id into target_room_id 
  from rooms 
  where code = p_room_code;
  
  if not found then
    return json_build_object(
      'error', 'Room not found'
    );
  end if;

  -- Check number of players
  select count(*) into player_count 
  from players 
  where room_id = target_room_id;

  if player_count >= 7 then
    return json_build_object(
      'error', 'Room is full (maximum 7 players)'
    );
  end if;

  -- Set player position
  new_position := player_count + 1;

  -- Insert new player
  insert into players (id, room_id, name, position)
  values (gen_random_uuid(), target_room_id, p_player_name, new_position)
  returning id into new_player_id;

  return json_build_object(
    'player_id', new_player_id,
    'room_id', target_room_id,
    'position', new_position
  );
end;
$$;

-- Enable realtime for our tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

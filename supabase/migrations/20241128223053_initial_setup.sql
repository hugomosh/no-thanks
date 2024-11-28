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
create function create_room() returns json
language plpgsql
as $$
declare
  new_room_code text;
  new_room_id uuid;
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

  return json_build_object(
    'room_id', new_room_id,
    'room_code', new_room_code
  );
end;
$$;

-- Enable realtime for our tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

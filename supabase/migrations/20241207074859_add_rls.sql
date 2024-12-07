-- Enable RLS for all tables
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.word_bank enable row level security;

-- Rooms: Allow reading for subscriptions and viewing available games
create policy "Rooms are viewable by everyone"
on public.rooms
for select
using (true);

-- Players: Allow reading for game state
create policy "Players are viewable by everyone"
on public.players
for select
using (true);

-- Word bank: No direct access, all access through functions
-- (no policies needed since functions bypass RLS)
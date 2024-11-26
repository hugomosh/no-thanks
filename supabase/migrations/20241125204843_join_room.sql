-- Function to join a room
CREATE OR REPLACE FUNCTION join_room(
    target_room_code TEXT,
    player_name TEXT
)
RETURNS TABLE (
    room_id UUID,
    room_code TEXT,
    player_id UUID
) AS $$
DECLARE
    target_room_id UUID;
    new_player_id UUID;
    player_count INTEGER;
    room_status room_status;
BEGIN
    -- Get room ID and status
    SELECT id, status INTO target_room_id, room_status
    FROM rooms
    WHERE code = target_room_code
    FOR UPDATE;
    
    -- Check if room exists
    IF target_room_id IS NULL THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    -- Check if room is joinable
    IF room_status != 'waiting' THEN
        RAISE EXCEPTION 'Room is not accepting new players';
    END IF;

    -- Count current players
    SELECT COUNT(*) INTO player_count
    FROM players as p
    WHERE p.room_id = target_room_id;

    -- Check if room is full
    IF player_count >= 7 THEN
        RAISE EXCEPTION 'Room is full';
    END IF;

    -- Create new player
    INSERT INTO players (
        room_id,
        name,
        is_host,
        turn_order
    )
    VALUES (
        target_room_id,
        player_name,
        false,
        player_count
    )
    RETURNING id INTO new_player_id;

    RETURN QUERY
    SELECT 
        target_room_id,
        target_room_code,
        new_player_id;
END;
$$ LANGUAGE plpgsql;
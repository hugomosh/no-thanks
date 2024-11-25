-- supabase/migrations/20240101000000_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE room_status AS ENUM ('waiting', 'active', 'finished');
CREATE TYPE player_status AS ENUM ('active', 'disconnected', 'left');

-- Create rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL,
    status room_status DEFAULT 'waiting',
    current_card INTEGER,
    chips_on_card INTEGER DEFAULT 0,
    deck INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    host_id UUID,
    current_turn INTEGER,
    min_players INTEGER DEFAULT 3,
    max_players INTEGER DEFAULT 7,
    CONSTRAINT unique_active_code UNIQUE (code, status)
);

-- Create players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    turn_order INTEGER,
    chips INTEGER DEFAULT 11,
    cards INTEGER[] DEFAULT '{}',
    is_host BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    status player_status DEFAULT 'active',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create function to generate 3-word code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
    simple_words TEXT[] := ARRAY[
        'cat', 'dog', 'pig', 'bat', 'fox', 'owl', 'bee', 'ant', 'fly',
        'rat', 'bug', 'hen', 'cow', 'ape', 'elk', 'eel', 'ram', 'ray',
        'kit', 'pup', 'cub', 'kid', 'hog', 'jay', 'koi', 'yak', 'boa',
        'web', 'egg', 'fin', 'ear', 'eye', 'leg', 'arm', 'sun', 'sky'
    ];
    word1 TEXT;
    word2 TEXT;
    word3 TEXT;
    generated_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Select three random words from the array
        word1 := simple_words[floor(random() * array_length(simple_words, 1) + 1)];
        word2 := simple_words[floor(random() * array_length(simple_words, 1) + 1)];
        word3 := simple_words[floor(random() * array_length(simple_words, 1) + 1)];
        
        -- Combine words with hyphens
        generated_code := word1 || '-' || word2 || '-' || word3;
        
        -- Check if code exists in active rooms
        SELECT EXISTS (
            SELECT 1 
            FROM rooms 
            WHERE code = generated_code 
            AND status != 'finished'
        ) INTO code_exists;
        
        -- Exit loop if code doesn't exist
        IF NOT code_exists THEN
            RETURN generated_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to create a room
CREATE OR REPLACE FUNCTION create_room(player_name TEXT)
RETURNS TABLE (
    room_id UUID,
    room_code TEXT,
    player_id UUID
) AS $$
DECLARE
    new_room_id UUID;
    new_player_id UUID;
    new_room_code TEXT;
BEGIN
    -- Generate room code
    new_room_code := generate_room_code();
    
    -- Create room
    INSERT INTO rooms (code)
    VALUES (new_room_code)
    RETURNING id INTO new_room_id;
    
    -- Create player
    INSERT INTO players (room_id, name, is_host, turn_order)
    VALUES (new_room_id, player_name, true, 0)
    RETURNING id INTO new_player_id;
    
    -- Update room with host_id
    UPDATE rooms
    SET host_id = new_player_id
    WHERE id = new_room_id;
    
    RETURN QUERY
    SELECT new_room_id, new_room_code, new_player_id;
END;
$$ LANGUAGE plpgsql;
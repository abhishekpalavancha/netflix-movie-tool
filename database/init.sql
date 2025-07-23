-- Enables UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

---------------

-- ## Main 'movies' Table ##
-- This table is optimized for fast queries by using native data types
-- for all fields that are frequently filtered or sorted on.
CREATE TABLE IF NOT EXISTS movies (
    -- Core identifiers and timestamps
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_file_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Promoted columns for fast filtering and sorting
    title TEXT NOT NULL,
    year INTEGER,
    rating NUMERIC(3, 1), -- Use NUMERIC for precision (e.g., 9.5)
    genre TEXT,

    -- Columns for unstructured data
    metadata JSONB -- For any extra, non-critical, or varied data
);

------------------

-- ## 'drive_change_tokens' Table ##
-- Stores the page tokens required by the Google Drive crawler
-- to sync only the changes since the last run.
CREATE TABLE IF NOT EXISTS drive_change_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

------------------

-- ## Indexes for Performance ##

-- Indexes on the 'movies' table to accelerate common API queries
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies (year);
CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies (genre);

-- A composite index perfectly optimized for the "top-rated" endpoint
CREATE INDEX IF NOT EXISTS idx_movies_top_rated ON movies (rating DESC NULLS LAST, id ASC);



-- Index on the 'drive_change_tokens' table for fast lookup of the latest token
CREATE INDEX IF NOT EXISTS idx_change_token_created ON drive_change_tokens (created_at DESC);

--------------------


-- ## Sample Data ##
INSERT INTO movies (drive_file_id, title, year, rating, genre, metadata) VALUES
    ('sample-001', 'The Shawshank Redemption', 1994, 9.3, 'Drama', 
     '{"director": "Frank Darabont", "runtime": 142, "language": "English"}'::jsonb),
    ('sample-002', 'The Dark Knight', 2008, 9.0, 'Action',
     '{"director": "Christopher Nolan", "runtime": 152, "language": "English"}'::jsonb)
ON CONFLICT (drive_file_id) DO NOTHING;
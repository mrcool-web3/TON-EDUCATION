-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    username VARCHAR(32),
    first_name VARCHAR(64),
    last_name VARCHAR(64),
    wallet_address VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    content_url TEXT,
    difficulty_level VARCHAR(16) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration INTEGER, -- in minutes
    reward_min DECIMAL(10, 2) DEFAULT 0.1,
    reward_max DECIMAL(10, 2) DEFAULT 0.2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table
CREATE TABLE user_progress (
    user_id INTEGER REFERENCES users(id),
    course_id INTEGER REFERENCES courses(id),
    progress INTEGER CHECK (progress >= 0 AND progress <= 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, course_id)
);

-- Rewards table
CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    course_id INTEGER REFERENCES courses(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(16) CHECK (status IN ('pending', 'claimed', 'failed')) DEFAULT 'pending',
    transaction_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

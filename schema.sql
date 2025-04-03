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
    claimed_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (user_id, course_id) REFERENCES user_progress (user_id, course_id)
);

-- Certificates table
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    course_id INTEGER REFERENCES courses(id),
    reward_amount DECIMAL(10, 2) NOT NULL,
    nft_id VARCHAR(64) NOT NULL,
    transaction_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id, course_id) REFERENCES user_progress (user_id, course_id)
);

-- Referrals table
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES users(id),
    referee_id INTEGER REFERENCES users(id) UNIQUE,
    reward_earned DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TON News table
CREATE TABLE ton_news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    content TEXT NOT NULL,
    source VARCHAR(64),
    url TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample data
INSERT INTO courses (title, description, difficulty_level, estimated_duration, reward_min, reward_max) VALUES
('TON Blockchain Basics', 'Learn the fundamentals of TON Blockchain architecture', 'beginner', 15, 0.01, 0.03),
('FunC Smart Contracts', 'Master writing smart contracts using FunC language', 'intermediate', 45, 0.03, 0.07),
('TON Wallet Integration', 'Learn how to integrate TON wallets into applications', 'advanced', 30, 0.02, 0.05);

INSERT INTO ton_news (title, content, source, published_at) VALUES
('TON Foundation Announces New Grants', 'The TON Foundation has allocated $50M for ecosystem development', 'TON Official', NOW() - INTERVAL '2 hours'),
('New Wallet Feature Released', 'Latest update includes NFT display and improved security', 'TON Wallet Team', NOW() - INTERVAL '5 hours'),
('TON Partners with Major Exchange', 'TON blockchain now integrated with Binance', 'Binance Blog', NOW() - INTERVAL '1 day');

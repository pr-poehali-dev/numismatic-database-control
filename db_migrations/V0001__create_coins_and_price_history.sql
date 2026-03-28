
CREATE TABLE t_p56980273_numismatic_database_.coins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    country VARCHAR(100) NOT NULL,
    metal VARCHAR(50) NOT NULL,
    weight_g NUMERIC(8,3),
    diameter_mm NUMERIC(6,2),
    mintage INTEGER,
    rarity VARCHAR(50),
    condition VARCHAR(10),
    base_price NUMERIC(15,2),
    current_price NUMERIC(15,2),
    description TEXT,
    ruler VARCHAR(150),
    dynasty VARCHAR(100),
    mint VARCHAR(150),
    image_url TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p56980273_numismatic_database_.coin_price_history (
    id SERIAL PRIMARY KEY,
    coin_id INTEGER NOT NULL REFERENCES t_p56980273_numismatic_database_.coins(id),
    price NUMERIC(15,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW(),
    source VARCHAR(100),
    notes TEXT
);

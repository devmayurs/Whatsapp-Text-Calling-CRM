CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  phone_number VARCHAR UNIQUE NOT NULL,
  client_name VARCHAR NOT NULL,
  email VARCHAR,
  preferred_treatment VARCHAR,
  status VARCHAR DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  phone_number VARCHAR NOT NULL,
  client_name VARCHAR NOT NULL,
  treatment VARCHAR NOT NULL,
  appointment_date VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'Booked',
  gemini_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
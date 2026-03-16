-- ═══════════════════════════════════════════════════
--  Inner Hunch — Database Setup Script
--  Run this file once to create all tables
--  Usage: psql -U postgres -f server/db-setup.sql
-- ═══════════════════════════════════════════════════

-- Create database (run this separately if needed)
-- CREATE DATABASE inner_hunch;

-- Connect to database before running the rest
-- \c inner_hunch

-- ── USERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  first_name      VARCHAR(100)  NOT NULL,
  last_name       VARCHAR(100)  NOT NULL DEFAULT '',
  email           VARCHAR(255)  UNIQUE NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  bio             TEXT          DEFAULT 'Finding peace one day at a time 🌿',
  avatar_emoji    VARCHAR(20)   DEFAULT '😊',
  avatar_bg       VARCHAR(300)  DEFAULT 'linear-gradient(135deg,#3ecfbf,#7c6fff)',
  avatar_img      TEXT,
  wellness_goal   VARCHAR(100)  DEFAULT 'Reduce anxiety',
  reminder_time   VARCHAR(20)   DEFAULT '8:00 PM',
  streak          INTEGER       DEFAULT 0,
  sessions_done   INTEGER       DEFAULT 0,
  created_at      TIMESTAMP     DEFAULT NOW(),
  updated_at      TIMESTAMP     DEFAULT NOW()
);

-- ── MOOD LOGS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS mood_logs (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  mood_score    INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  energy_score  INTEGER CHECK (energy_score BETWEEN 1 AND 5),
  note          TEXT    DEFAULT '',
  logged_at     TIMESTAMP DEFAULT NOW()
);

-- ── APPOINTMENTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER REFERENCES users(id) ON DELETE CASCADE,
  doctor_name       VARCHAR(200) NOT NULL,
  doctor_specialty  VARCHAR(200),
  doctor_emoji      VARCHAR(10)  DEFAULT '👨‍⚕️',
  appointment_date  DATE         NOT NULL,
  appointment_time  VARCHAR(20)  NOT NULL,
  appointment_month VARCHAR(10),
  session_type      VARCHAR(50)  DEFAULT 'Video',
  note              TEXT,
  status            VARCHAR(20)  DEFAULT 'upcoming',
  price             VARCHAR(20),
  created_at        TIMESTAMP    DEFAULT NOW()
);

-- ── BOOKMARKS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  article_id  INTEGER NOT NULL,
  saved_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- ── USER PREFERENCES ───────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  id                      SERIAL PRIMARY KEY,
  user_id                 INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  daily_reminder          BOOLEAN DEFAULT TRUE,
  weekly_insights         BOOLEAN DEFAULT TRUE,
  new_articles_notify     BOOLEAN DEFAULT FALSE,
  appointment_reminders   BOOLEAN DEFAULT TRUE,
  theme                   VARCHAR(20) DEFAULT 'dark',
  language                VARCHAR(20) DEFAULT 'English',
  anonymize_data          BOOLEAN DEFAULT TRUE,
  allow_analytics         BOOLEAN DEFAULT FALSE,
  share_with_therapist    BOOLEAN DEFAULT TRUE,
  updated_at              TIMESTAMP DEFAULT NOW()
);

-- ── INDEXES for performance ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_id    ON mood_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_logs_logged_at  ON mood_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date    ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id    ON bookmarks(user_id);

-- ── TRIGGER: auto-update updated_at ────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Done!
SELECT 'Inner Hunch database setup complete ✓' AS status;

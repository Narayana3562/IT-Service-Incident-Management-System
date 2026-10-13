BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee'
    CHECK (role IN ('employee', 'support', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sla_policies (
  id BIGSERIAL PRIMARY KEY,
  priority VARCHAR(20) NOT NULL UNIQUE
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  resolution_hours INTEGER NOT NULL CHECK (resolution_hours > 0)
);

INSERT INTO sla_policies (priority, resolution_hours) VALUES
  ('low', 120), ('medium', 48), ('high', 12), ('critical', 4)
ON CONFLICT (priority) DO NOTHING;

CREATE TABLE IF NOT EXISTS incidents (
  id BIGSERIAL PRIMARY KEY,
  ticket_key VARCHAR(24) UNIQUE,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(60) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  reporter_id BIGINT NOT NULL REFERENCES users(id),
  assignee_id BIGINT REFERENCES users(id),
  sla_due_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter ON incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_incidents_assignee ON incidents(assignee_id);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

CREATE OR REPLACE FUNCTION set_ticket_key() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_key IS NULL THEN
    NEW.ticket_key := 'INC-' || LPAD(NEW.id::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS incidents_ticket_key_trigger ON incidents;
CREATE TRIGGER incidents_ticket_key_trigger
BEFORE INSERT ON incidents
FOR EACH ROW EXECUTE FUNCTION set_ticket_key();

CREATE TABLE IF NOT EXISTS incident_comments (
  id BIGSERIAL PRIMARY KEY,
  incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author_id BIGINT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL CHECK (LENGTH(BTRIM(body)) BETWEEN 1 AND 3000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_history (
  id BIGSERIAL PRIMARY KEY,
  incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  actor_id BIGINT REFERENCES users(id),
  action VARCHAR(60) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;

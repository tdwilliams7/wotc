CREATE TABLE game_templates (
  id                        text PRIMARY KEY,
  name                      text NOT NULL UNIQUE,
  formats                   text[] NOT NULL CHECK (cardinality(formats) > 0),
  default_duration_minutes  int NOT NULL CHECK (default_duration_minutes >= 15),
  default_capacity          int NOT NULL,
  max_capacity              int NOT NULL CHECK (max_capacity BETWEEN 1 AND 30),
  min_players               int NOT NULL CHECK (min_players >= 1),
  CHECK (min_players <= default_capacity AND default_capacity <= max_capacity)
);

CREATE TABLE events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL CHECK (length(trim(name)) > 0),
  game_id           text NOT NULL REFERENCES game_templates(id),
  format            text NOT NULL,
  starts_at         timestamptz NOT NULL,
  duration_minutes  int NOT NULL CHECK (duration_minutes >= 15),
  capacity          int NOT NULL CHECK (capacity BETWEEN 1 AND 30),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_starts_at_idx ON events (starts_at);

CREATE TABLE registrations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_name      text NOT NULL,
  normalized_name  text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, normalized_name)
);
import { Db } from "../../db";
import { GameTemplate, templateSeed } from "./data";

const map = (r: any): GameTemplate => ({
  id: r.id,
  name: r.name,
  formats: r.formats,
  defaultDurationMinutes: r.default_duration_minutes,
  defaultCapacity: r.default_capacity,
  maxCapacity: r.max_capacity,
  minPlayers: r.min_players,
});

export async function listTemplates(db: Db): Promise<GameTemplate[]> {
  const { rows } = await db.query("SELECT * FROM game_templates ORDER BY name");
  return rows.map(map);
}

export async function getTemplate(
  db: Db,
  id: string,
): Promise<GameTemplate | null> {
  const { rows } = await db.query(
    "SELECT * FROM game_templates WHERE id = $1",
    [id],
  );
  return rows[0] ? map(rows[0]) : null;
}

// Idempotent: the registry in data.ts is the source of truth.
export async function upsertTemplates(
  db: Db,
  templates: GameTemplate[] = templateSeed,
) {
  for (const t of templates) {
    await db.query(
      `INSERT INTO game_templates
         (id, name, formats, default_duration_minutes, default_capacity, max_capacity, min_players)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, formats = EXCLUDED.formats,
         default_duration_minutes = EXCLUDED.default_duration_minutes,
         default_capacity = EXCLUDED.default_capacity,
         max_capacity = EXCLUDED.max_capacity, min_players = EXCLUDED.min_players`,
      [
        t.id,
        t.name,
        t.formats,
        t.defaultDurationMinutes,
        t.defaultCapacity,
        t.maxCapacity,
        t.minPlayers,
      ],
    );
  }
}

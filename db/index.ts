import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

let schemaReady: Promise<void> | null = null;

export function getDb() {
  if (!env.DB) throw new Error("La base de dades no està disponible.");
  return drizzle(env.DB, { schema });
}

export async function ensureWorkoutSchema() {
  if (!env.DB) throw new Error("La base de dades no està disponible.");
  schemaReady ??= env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_date TEXT NOT NULL,
      routine TEXT NOT NULL,
      duration_minutes INTEGER,
      rpe INTEGER,
      exercise_data TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(session_date)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_workout_sessions_routine_date ON workout_sessions(routine, session_date)"),
    env.DB.prepare("PRAGMA optimize"),
  ]).then(() => undefined);
  return schemaReady;
}

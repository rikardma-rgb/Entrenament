import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const workoutSessions = sqliteTable(
  "workout_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionDate: text("session_date").notNull(),
    routine: text("routine").notNull(),
    durationMinutes: integer("duration_minutes"),
    rpe: integer("rpe"),
    exerciseData: text("exercise_data").notNull().default("[]"),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_workout_sessions_date").on(table.sessionDate),
    index("idx_workout_sessions_routine_date").on(table.routine, table.sessionDate),
  ],
);

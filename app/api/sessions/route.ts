import { desc } from "drizzle-orm";
import { ensureWorkoutSchema, getDb } from "../../../db";
import { workoutSessions } from "../../../db/schema";

type ExerciseResult = {
  exerciseId: string;
  weight: number | null;
  reps: string;
  completed: boolean;
};

function cleanExercises(value: unknown): ExerciseResult[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const raw = entry as Record<string, unknown>;
    if (typeof raw.exerciseId !== "string") return [];
    const weight = typeof raw.weight === "number" && Number.isFinite(raw.weight) && raw.weight >= 0 && raw.weight <= 500 ? raw.weight : null;
    return [{
      exerciseId: raw.exerciseId.slice(0, 80),
      weight,
      reps: typeof raw.reps === "string" ? raw.reps.slice(0, 40) : "",
      completed: Boolean(raw.completed),
    }];
  });
}

export async function GET() {
  try {
    await ensureWorkoutSchema();
    const rows = await getDb().select().from(workoutSessions).orderBy(desc(workoutSessions.sessionDate), desc(workoutSessions.id)).limit(100);
    return Response.json({
      sessions: rows.map((row) => ({
        id: row.id,
        sessionDate: row.sessionDate,
        routine: row.routine,
        durationMinutes: row.durationMinutes,
        rpe: row.rpe,
        exercises: JSON.parse(row.exerciseData) as ExerciseResult[],
        notes: row.notes,
        createdAt: row.createdAt,
      })),
    });
  } catch {
    return Response.json({ error: "No s’ha pogut carregar l’historial." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const sessionDate = typeof body.sessionDate === "string" ? body.sessionDate : "";
    const routine = body.routine;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) || (routine !== "A" && routine !== "B" && routine !== "C" && routine !== "RUN")) {
      return Response.json({ error: "Dades de sessió no vàlides." }, { status: 400 });
    }
    const duration = typeof body.durationMinutes === "number" && body.durationMinutes >= 1 && body.durationMinutes <= 240 ? Math.round(body.durationMinutes) : null;
    const rpe = typeof body.rpe === "number" && body.rpe >= 1 && body.rpe <= 10 ? Math.round(body.rpe) : null;
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : "";
    const exercises = cleanExercises(body.exercises);

    await ensureWorkoutSchema();
    const [session] = await getDb().insert(workoutSessions).values({
      sessionDate,
      routine,
      durationMinutes: duration,
      rpe,
      exerciseData: JSON.stringify(exercises),
      notes,
    }).returning();
    return Response.json({ session }, { status: 201 });
  } catch {
    return Response.json({ error: "No s’ha pogut desar la sessió." }, { status: 500 });
  }
}

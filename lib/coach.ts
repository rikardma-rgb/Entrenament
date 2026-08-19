export type CoachFeedback = {
  version: 2;
  session: {
    verdict: string;
    evidence: string;
    nextAction: string;
  };
  week: {
    summary: string;
    progress: string;
    watch: string;
    nextAction: string;
  };
  confidence: "alta" | "mitjana" | "baixa";
};

type WorkoutRow = {
  id: number;
  sessionDate: string;
  routine: string;
  durationMinutes: number | null;
  rpe: number | null;
  exerciseData: string;
  notes: string;
  fitData: string;
};

type ExerciseResult = {
  exerciseId: string;
  weight: number | null;
  reps: string;
  completed: boolean;
};

type FitData = {
  distanceKm?: number;
  calories?: number | null;
  pace?: number | null;
  elevation?: number;
  heartRate?: number | null;
  warmupRun?: FitData | null;
  strength?: FitData | null;
};

const exerciseNames: Record<string, string> = {
  "goblet-squat": "Sentadilla goblet",
  "dumbbell-bench": "Press banca amb manuelles",
  "seated-row": "Rem en politja baixa",
  "dumbbell-curl": "Curl de bíceps amb manuelles",
  "seated-calf": "Elevació de talons assegut",
  plank: "Planxa",
  "pallof-press": "Pallof press",
  "romanian-deadlift": "Pes mort romanès",
  "seated-shoulder-press": "Press militar assegut",
  "lat-pulldown": "Jaló al pit",
  "triceps-pushdown": "Extensió de tríceps en politja",
  "alternating-lunge": "Gambades alternes",
  "standing-calf": "Elevació de talons dempeus",
  "runner-hip-thrust": "Hip thrust",
  "runner-leg-curl": "Curl femoral en màquina",
  "runner-lateral-raise": "Elevacions laterals",
  "runner-face-pull": "Face pull en politja",
  "runner-copenhagen": "Planxa Copenhagen",
  "runner-tibialis": "Elevacions de tibial anterior",
  "runner-farmer-carry": "Farmer carry",
  "express-push-up": "Flexions",
  "express-bulgarian-squat": "Sentadilla búlgara",
  "express-plank": "Planxa",
  "express-glute-bridge": "Pont de glutis",
  "express-superman": "Superman altern",
  "express-diamond-or-curl": "Flexió diamant o curl de bíceps",
  "express-standing-calf": "Elevació de talons dempeus",
  "express-monster-walk": "Monster walk o clamshell",
};

const routineNames: Record<string, string> = {
  A: "Base Total",
  B: "Motor Posterior",
  C: "Runner Resilience",
  EXPRESS: "Express 30",
  RUN: "Running lliure",
};

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function weekStart(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function moveDate(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function activityTotals(session: WorkoutRow) {
  const fit = parseJson<FitData>(session.fitData || "{}", {});
  const distanceKm = (session.routine === "RUN" ? Number(fit.distanceKm ?? 0) : 0)
    + Number(fit.warmupRun?.distanceKm ?? 0);
  const calories = Number(fit.calories ?? 0)
    + Number(fit.warmupRun?.calories ?? 0)
    + Number(fit.strength?.calories ?? 0);
  return { fit, distanceKm: round(distanceKm, 2), calories: Math.round(calories) };
}

function summarizeWeek(sessions: WorkoutRow[], start: string) {
  const weekSessions = sessions.filter((session) => weekStart(session.sessionDate) === start);
  const rpes = weekSessions.flatMap((session) => session.rpe === null ? [] : [session.rpe]);
  return {
    inici: start,
    sessions: weekSessions.length,
    força: weekSessions.filter((session) => session.routine !== "RUN").length,
    running: weekSessions.filter((session) => session.routine === "RUN").length,
    minuts: weekSessions.reduce((total, session) => total + Number(session.durationMinutes ?? 0), 0),
    km: round(weekSessions.reduce((total, session) => total + activityTotals(session).distanceKm, 0), 1),
    kcal: weekSessions.reduce((total, session) => total + activityTotals(session).calories, 0),
    rpeMitja: rpes.length ? round(rpes.reduce((total, rpe) => total + rpe, 0) / rpes.length, 1) : null,
  };
}

function isBefore(candidate: WorkoutRow, current: WorkoutRow) {
  return candidate.sessionDate < current.sessionDate
    || (candidate.sessionDate === current.sessionDate && candidate.id < current.id);
}

export function buildCoachContext(sessions: WorkoutRow[], sessionId: number, previousFeedback: CoachFeedback | null) {
  const current = sessions.find((session) => session.id === sessionId);
  if (!current) throw new Error("No s’ha trobat la sessió que s’ha d’analitzar.");

  const previous = sessions.find((session) => session.routine === current.routine && isBefore(session, current));
  const currentExercises = parseJson<ExerciseResult[]>(current.exerciseData, []);
  const previousExercises = new Map(parseJson<ExerciseResult[]>(previous?.exerciseData ?? "[]", []).map((exercise) => [exercise.exerciseId, exercise]));
  const activity = activityTotals(current);
  const currentWeekStart = weekStart(current.sessionDate);
  const currentWeek = summarizeWeek(sessions, currentWeekStart);
  const previousWeek = summarizeWeek(sessions, moveDate(currentWeekStart, -7));
  const recentWeeks = Array.from({ length: 4 }, (_, index) => summarizeWeek(sessions, moveDate(currentWeekStart, index * -7)));

  return {
    sessioNova: {
      data: current.sessionDate,
      rutina: routineNames[current.routine] ?? current.routine,
      duradaMin: current.durationMinutes,
      rpe: current.rpe,
      comentarisUsuari: current.notes || null,
      exercicis: currentExercises.map((exercise) => {
        const old = previousExercises.get(exercise.exerciseId);
        const delta = exercise.weight !== null && old?.weight !== null && old?.weight !== undefined
          ? round(exercise.weight - old.weight, 1)
          : null;
        return {
          nom: exerciseNames[exercise.exerciseId] ?? "Exercici",
          completat: exercise.completed,
          pesKg: exercise.weight,
          repeticions: exercise.reps || null,
          pesAnteriorKg: old?.weight ?? null,
          repeticionsAnteriors: old?.reps || null,
          canviPesKg: delta,
        };
      }),
      running: {
        km: activity.distanceKm || null,
        ritmeSegonsKm: activity.fit.pace ?? activity.fit.warmupRun?.pace ?? null,
        desnivellPositiuM: Number(activity.fit.elevation ?? 0) + Number(activity.fit.warmupRun?.elevation ?? 0) || null,
        polsMitja: activity.fit.heartRate ?? activity.fit.warmupRun?.heartRate ?? activity.fit.strength?.heartRate ?? null,
        kcal: activity.calories || null,
      },
      comparacioDisponible: Boolean(previous),
      sessioAnteriorMateixaRutina: previous ? { data: previous.sessionDate, rpe: previous.rpe, duradaMin: previous.durationMinutes } : null,
    },
    setmana: {
      actual: currentWeek,
      anterior: previousWeek,
      canvi: {
        sessions: currentWeek.sessions - previousWeek.sessions,
        minuts: currentWeek.minuts - previousWeek.minuts,
        km: round(currentWeek.km - previousWeek.km, 1),
        rpeMitja: currentWeek.rpeMitja !== null && previousWeek.rpeMitja !== null ? round(currentWeek.rpeMitja - previousWeek.rpeMitja, 1) : null,
      },
      ultimesQuatreSetmanes: recentWeeks,
    },
    continuïtatCoach: previousFeedback ? {
      accioSessioAnterior: previousFeedback.session.nextAction,
      accioSetmanaAnterior: previousFeedback.week.nextAction,
    } : null,
    qualitatDades: {
      sessionsDisponibles: sessions.length,
      sessionsAmbRpe: sessions.filter((session) => session.rpe !== null).length,
      sessionsAmbFit: sessions.filter((session) => session.fitData && session.fitData !== "{}").length,
      comparacioMateixaRutina: Boolean(previous),
    },
  };
}

function textField(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function parseCoachFeedback(value: string): CoachFeedback | null {
  const parsed = parseJson<unknown>(value, null);
  if (!parsed || typeof parsed !== "object") return null;
  const raw = parsed as Record<string, unknown>;
  const session = raw.session && typeof raw.session === "object" ? raw.session as Record<string, unknown> : null;
  const week = raw.week && typeof raw.week === "object" ? raw.week as Record<string, unknown> : null;
  const confidence = raw.confidence;
  if (!session || !week || (confidence !== "alta" && confidence !== "mitjana" && confidence !== "baixa")) return null;
  const feedback: CoachFeedback = {
    version: 2,
    session: {
      verdict: textField(session.verdict, 420),
      evidence: textField(session.evidence, 420),
      nextAction: textField(session.nextAction, 320),
    },
    week: {
      summary: textField(week.summary, 420),
      progress: textField(week.progress, 420),
      watch: textField(week.watch, 420),
      nextAction: textField(week.nextAction, 360),
    },
    confidence,
  };
  return Object.values(feedback.session).every(Boolean) && Object.values(feedback.week).every(Boolean) ? feedback : null;
}

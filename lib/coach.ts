export type CoachFeedback = {
  version: 3;
  session: {
    focus: "força" | "running" | "global";
    verdict: string;
    evidence: string;
    nextAction: string;
  };
  week: {
    summary: string;
    strength: string;
    running: string;
    progress?: string;
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

type HeartRateZones = {
  belowZone1Minutes?: number;
  zone1Minutes?: number;
  zone2Minutes?: number;
  zone3Minutes?: number;
  zone4Minutes?: number;
  zone5Minutes?: number;
};

type FitData = {
  distanceKm?: number;
  durationMinutes?: number;
  calories?: number | null;
  pace?: number | null;
  elevation?: number;
  heartRate?: number | null;
  maxHeartRate?: number | null;
  heartRateZones?: HeartRateZones | null;
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

function formatPace(secondsPerKm: number | null | undefined) {
  const totalSeconds = Math.round(Number(secondsPerKm ?? 0));
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")} min/km`;
}

function totalHeartRateZones(values: (HeartRateZones | null | undefined)[]) {
  const available = values.filter((value): value is HeartRateZones => Boolean(value));
  if (!available.length) return null;
  const sum = (key: keyof HeartRateZones) => round(available.reduce((total, value) => total + Number(value[key] ?? 0), 0), 1);
  return {
    sotaZ1Min: sum("belowZone1Minutes"),
    z1Min: sum("zone1Minutes"),
    z2Min: sum("zone2Minutes"),
    z3Min: sum("zone3Minutes"),
    z4Min: sum("zone4Minutes"),
    z5Min: sum("zone5Minutes"),
  };
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
  const mainRun = session.routine === "RUN" ? fit : null;
  const warmupRun = session.routine === "RUN" ? null : fit.warmupRun ?? null;
  const strength = session.routine === "RUN" ? null : fit.strength ?? null;
  const runningDistanceKm = Number(mainRun?.distanceKm ?? 0) + Number(warmupRun?.distanceKm ?? 0);
  const runningMinutes = Number(mainRun?.durationMinutes ?? (session.routine === "RUN" ? session.durationMinutes : 0) ?? 0)
    + Number(warmupRun?.durationMinutes ?? 0);
  const warmupMinutes = Number(warmupRun?.durationMinutes ?? 0);
  const strengthMinutes = session.routine === "RUN"
    ? 0
    : Number(strength?.durationMinutes ?? Math.max(0, Number(session.durationMinutes ?? 0) - warmupMinutes));
  const runningCalories = Number(mainRun?.calories ?? 0) + Number(warmupRun?.calories ?? 0);
  const strengthCalories = session.routine === "RUN"
    ? 0
    : Number(strength?.calories ?? (!warmupRun ? fit.calories : 0) ?? 0);
  return {
    fit,
    mainRun,
    warmupRun,
    strength,
    runningDistanceKm: round(runningDistanceKm, 2),
    runningMinutes: round(runningMinutes, 1),
    strengthMinutes: round(strengthMinutes, 1),
    runningCalories: Math.round(runningCalories),
    runningHeartRateZones: totalHeartRateZones([mainRun?.heartRateZones, warmupRun?.heartRateZones]),
    strengthCalories: Math.round(strengthCalories),
    calories: Math.round(runningCalories + strengthCalories),
  };
}

function summarizeWeek(sessions: WorkoutRow[], start: string) {
  const weekSessions = sessions.filter((session) => weekStart(session.sessionDate) === start);
  const strengthSessions = weekSessions.filter((session) => session.routine !== "RUN");
  const runSessions = weekSessions.filter((session) => session.routine === "RUN");
  const strengthRpes = strengthSessions.flatMap((session) => session.rpe === null ? [] : [session.rpe]);
  const runningRpes = runSessions.flatMap((session) => session.rpe === null ? [] : [session.rpe]);
  const activities = weekSessions.map((session) => activityTotals(session));
  const average = (values: number[]) => values.length ? round(values.reduce((total, value) => total + value, 0) / values.length, 1) : null;
  return {
    inici: start,
    sessions: weekSessions.length,
    força: {
      sessions: strengthSessions.length,
      minuts: round(activities.reduce((total, activity) => total + activity.strengthMinutes, 0), 1),
      kcal: activities.reduce((total, activity) => total + activity.strengthCalories, 0),
      rpeMitja: average(strengthRpes),
    },
    running: {
      sessionsLliures: runSessions.length,
      escalfaments: weekSessions.filter((session) => activityTotals(session).warmupRun).length,
      km: round(activities.reduce((total, activity) => total + activity.runningDistanceKm, 0), 1),
      minuts: round(activities.reduce((total, activity) => total + activity.runningMinutes, 0), 1),
      kcal: activities.reduce((total, activity) => total + activity.runningCalories, 0),
      rpeMitjaSessionsLliures: average(runningRpes),
      zonesFC: totalHeartRateZones(activities.map((activity) => activity.runningHeartRateZones ? {
        belowZone1Minutes: activity.runningHeartRateZones.sotaZ1Min,
        zone1Minutes: activity.runningHeartRateZones.z1Min,
        zone2Minutes: activity.runningHeartRateZones.z2Min,
        zone3Minutes: activity.runningHeartRateZones.z3Min,
        zone4Minutes: activity.runningHeartRateZones.z4Min,
        zone5Minutes: activity.runningHeartRateZones.z5Min,
      } : null)),
    },
    minuts: weekSessions.reduce((total, session) => total + Number(session.durationMinutes ?? 0), 0),
    km: round(activities.reduce((total, activity) => total + activity.runningDistanceKm, 0), 1),
    kcal: activities.reduce((total, activity) => total + activity.calories, 0),
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
      modalitatPrincipal: current.routine === "RUN" ? "running" : "força",
      comentarisUsuari: current.notes || null,
      força: current.routine === "RUN" ? null : {
        duradaMin: activity.strengthMinutes || null,
        rpe: current.rpe,
        kcalFit: activity.strengthCalories || null,
        polsMitjaFit: activity.strength?.heartRate ?? null,
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
      },
      running: current.routine !== "RUN" ? null : {
        duradaMin: activity.runningMinutes || current.durationMinutes,
        rpe: current.rpe,
        km: activity.runningDistanceKm || null,
        ritmeMinKm: formatPace(activity.mainRun?.pace),
        desnivellPositiuM: activity.mainRun?.elevation ?? null,
        polsMitja: activity.mainRun?.heartRate ?? null,
        polsMaxim: activity.mainRun?.maxHeartRate ?? null,
        zonesFCMin: activity.runningHeartRateZones,
        kcal: activity.runningCalories || null,
      },
      escalfamentRunning: activity.warmupRun ? {
        duradaMin: activity.warmupRun.durationMinutes ?? null,
        km: activity.warmupRun.distanceKm ?? null,
        ritmeMinKm: formatPace(activity.warmupRun.pace),
        desnivellPositiuM: activity.warmupRun.elevation ?? null,
        polsMitja: activity.warmupRun.heartRate ?? null,
        polsMaxim: activity.warmupRun.maxHeartRate ?? null,
        zonesFCMin: totalHeartRateZones([activity.warmupRun.heartRateZones]),
        kcal: activity.warmupRun.calories ?? null,
      } : null,
      comparacioDisponible: Boolean(previous),
      sessioAnteriorMateixaRutina: previous ? {
        data: previous.sessionDate,
        rpe: previous.rpe,
        duradaMin: previous.durationMinutes,
      } : null,
    },
    setmana: {
      actual: currentWeek,
      anterior: previousWeek,
      canvi: {
        sessions: currentWeek.sessions - previousWeek.sessions,
        minuts: currentWeek.minuts - previousWeek.minuts,
        km: round(currentWeek.km - previousWeek.km, 1),
        sessionsForça: currentWeek.força.sessions - previousWeek.força.sessions,
        minutsForça: round(currentWeek.força.minuts - previousWeek.força.minuts, 1),
        sessionsRunningLliure: currentWeek.running.sessionsLliures - previousWeek.running.sessionsLliures,
        kmRunning: round(currentWeek.running.km - previousWeek.running.km, 1),
      },
      ultimesQuatreSetmanes: recentWeeks,
    },
    historialRunning: sessions.flatMap((session) => {
      const totals = activityTotals(session);
      const run = session.routine === "RUN" ? totals.mainRun : totals.warmupRun;
      if (!run || (!run.distanceKm && !run.durationMinutes && !run.heartRate)) return [];
      return [{
        data: session.sessionDate,
        tipus: session.routine === "RUN" ? "running lliure" : `escalfament de ${routineNames[session.routine] ?? session.routine}`,
        km: run.distanceKm ?? null,
        duradaMin: run.durationMinutes ?? null,
        ritmeMinKm: formatPace(run.pace),
        desnivellPositiuM: run.elevation ?? null,
        polsMitja: run.heartRate ?? null,
        polsMaxim: run.maxHeartRate ?? null,
        zonesFCMin: totalHeartRateZones([run.heartRateZones]),
        rpe: session.routine === "RUN" ? session.rpe : null,
      }];
    }).slice(0, 12),
    continuïtatCoach: previousFeedback ? {
      accioSessioAnterior: previousFeedback.session.nextAction,
      accioSetmanaAnterior: previousFeedback.week.nextAction,
    } : null,
    qualitatDades: {
      sessionsDisponibles: sessions.length,
      força: {
        sessions: sessions.filter((session) => session.routine !== "RUN").length,
        sessionsAmbRpe: sessions.filter((session) => session.routine !== "RUN" && session.rpe !== null).length,
      },
      running: {
        sessionsLliures: sessions.filter((session) => session.routine === "RUN").length,
        activitatsAmbFit: sessions.filter((session) => activityTotals(session).runningDistanceKm > 0).length,
      },
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
    version: 3,
    session: {
      focus: session.focus === "força" || session.focus === "running" ? session.focus : "global",
      verdict: textField(session.verdict, 420),
      evidence: textField(session.evidence, 420),
      nextAction: textField(session.nextAction, 320),
    },
    week: {
      summary: textField(week.summary, 420),
      strength: textField(week.strength, 420),
      running: textField(week.running, 420),
      progress: textField(week.progress, 420) || undefined,
      watch: textField(week.watch, 420),
      nextAction: textField(week.nextAction, 360),
    },
    confidence,
  };
  const hasProgress = Boolean(feedback.week.strength && feedback.week.running) || Boolean(feedback.week.progress);
  return Object.values(feedback.session).every(Boolean)
    && Boolean(feedback.week.summary && feedback.week.watch && feedback.week.nextAction && hasProgress)
    ? feedback
    : null;
}

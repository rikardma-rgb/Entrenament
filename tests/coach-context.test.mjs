import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadCoachModule() {
  const source = await readFile(new URL("../lib/coach.ts", import.meta.url), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
  return import(moduleUrl);
}

const forceWithWarmup = {
  id: 2,
  sessionDate: "2026-08-19",
  routine: "B",
  durationMinutes: 50,
  rpe: 7,
  exerciseData: JSON.stringify([{ exerciseId: "romanian-deadlift", weight: 20, reps: "10", completed: true }]),
  notes: "",
  fitData: JSON.stringify({
    warmupRun: { distanceKm: 3, durationMinutes: 18, pace: 360, heartRate: 140, calories: 180 },
    strength: { durationMinutes: 32, heartRate: 120, calories: 220 },
  }),
};

const freeRun = {
  id: 1,
  sessionDate: "2026-08-18",
  routine: "RUN",
  durationMinutes: 60,
  rpe: 5,
  exerciseData: "[]",
  notes: "",
  fitData: JSON.stringify({ distanceKm: 10, durationMinutes: 60, pace: 360, heartRate: 145, calories: 600 }),
};

test("keeps strength, running and warm-up data separate for Gemini", async () => {
  const { buildCoachContext } = await loadCoachModule();
  const context = buildCoachContext([forceWithWarmup, freeRun], forceWithWarmup.id, null);

  assert.equal(context.sessioNova.modalitatPrincipal, "força");
  assert.equal(context.sessioNova.running, null);
  assert.equal(context.sessioNova.força.duradaMin, 32);
  assert.equal(context.sessioNova.força.rpe, 7);
  assert.equal(context.sessioNova.escalfamentRunning.km, 3);
  assert.equal(context.sessioNova.escalfamentRunning.ritmeMinKm, "6:00 min/km");
  assert.equal(context.setmana.actual.força.rpeMitja, 7);
  assert.equal(context.setmana.actual.running.rpeMitjaSessionsLliures, 5);
  assert.equal(context.setmana.actual.força.kcal, 220);
  assert.equal(context.setmana.actual.running.kcal, 780);
  assert.equal(context.setmana.actual.kcal, 1000);
});

test("accepts both the new split feedback and saved legacy feedback", async () => {
  const { parseCoachFeedback } = await loadCoachModule();
  const legacy = parseCoachFeedback(JSON.stringify({
    version: 2,
    session: { verdict: "Veredicte", evidence: "Evidència", nextAction: "Acció" },
    week: { summary: "Resum", progress: "Progrés", watch: "Vigilar", nextAction: "Acció" },
    confidence: "alta",
  }));
  const split = parseCoachFeedback(JSON.stringify({
    version: 3,
    session: { focus: "força", verdict: "Veredicte", evidence: "Evidència", nextAction: "Acció" },
    week: { summary: "Resum", strength: "Força", running: "Running", watch: "Vigilar", nextAction: "Acció" },
    confidence: "alta",
  }));

  assert.equal(legacy.session.focus, "global");
  assert.equal(legacy.week.progress, "Progrés");
  assert.equal(split.session.focus, "força");
  assert.equal(split.week.strength, "Força");
  assert.equal(split.week.running, "Running");
});

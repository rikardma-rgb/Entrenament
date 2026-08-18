import { desc } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { ensureWorkoutSchema, getDb } from "../../../db";
import { workoutSessions } from "../../../db/schema";

type CoachEnv = { GEMINI_API_KEY?: string; GEMINI_MODEL?: string; ATHLETE_PROFILE?: string };

export async function POST() {
  const bindings = env as unknown as CoachEnv;
  if (!bindings.GEMINI_API_KEY) {
    return Response.json({ configured: false, error: "Falta connectar el teu compte de Gemini amb una clau de Google AI Studio." }, { status: 503 });
  }
  try {
    await ensureWorkoutSchema();
    const sessions = await getDb().select().from(workoutSessions).orderBy(desc(workoutSessions.sessionDate), desc(workoutSessions.id)).limit(30);
    const prompt = `Ets l'entrenador personal d'una única persona. Ets especialista en força, running, trail running, progressió de càrregues, nutrició esportiva i psicologia esportiva. Escriu en català, amb un to proper, directe, exigent i prudent. Sigues honest: no llancis floretes, no felicitis per sistema i no maquillis un rendiment insuficient. Motiva amb arguments i accions concretes. Basa les conclusions en les dades disponibles, diferencia fets d'hipòtesis i no inventis informació. No diagnostiquis, no prescriguis tractaments i no substitueixis un professional sanitari o de la nutrició.

Perfil personal proporcionat per l'usuari:
${bindings.ATHLETE_PROFILE || "Encara no configurat. No inventis dades personals."}

Historial recent (JSON):
${JSON.stringify(sessions.map((session) => ({
  data: session.sessionDate, rutina: session.routine, duradaMin: session.durationMinutes, rpe: session.rpe,
  exercicis: JSON.parse(session.exerciseData), comentaris: session.notes, fit: JSON.parse(session.fitData || "{}"),
})))}

Analitza especialment la setmana actual i compara-la amb les anteriors. Valora la constància, la càrrega, la progressió de força, l'RPE, la recuperació, els comentaris i les dades FIT. Tingues en compte els objectius i antecedents del perfil. Respon amb 3 paràgrafs curts: 1) valoració real del progrés, 2) què funciona i què cal vigilar, 3) recomanació concreta i mesurable per a la pròxima setmana. Esmenta dades reals quan siguin útils i reconeix clarament quan encara hi ha poques dades.`;
    const model = bindings.GEMINI_MODEL || "gemini-3.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": bindings.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.45, maxOutputTokens: 700 } }),
    });
    if (!response.ok) throw new Error(`Gemini ha respost amb l’estat ${response.status}`);
    const result = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const analysis = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!analysis) throw new Error("Gemini no ha retornat cap valoració.");
    return Response.json({ configured: true, analysis });
  } catch {
    return Response.json({ configured: true, error: "No s’ha pogut generar la valoració de Gemini." }, { status: 502 });
  }
}

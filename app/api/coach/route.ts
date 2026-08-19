import { desc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { ensureWorkoutSchema, getDb } from "../../../db";
import { coachFeedback, workoutSessions } from "../../../db/schema";
import { buildCoachContext, parseCoachFeedback } from "../../../lib/coach";

type CoachEnv = { GEMINI_API_KEY?: string; GEMINI_MODEL?: string; ATHLETE_PROFILE?: string };

export async function GET() {
  const bindings = env as unknown as CoachEnv;
  try {
    await ensureWorkoutSchema();
    const [latest] = await getDb().select().from(coachFeedback).orderBy(desc(coachFeedback.id)).limit(1);
    const feedback = latest ? parseCoachFeedback(latest.analysis) : null;
    return Response.json({
      configured: Boolean(bindings.GEMINI_API_KEY),
      feedback,
      analysis: feedback ? "" : latest?.analysis ?? "",
      createdAt: latest?.createdAt ?? null,
      sessionId: latest?.sessionId ?? null,
    });
  } catch {
    return Response.json({ error: "No s’ha pogut carregar l’última valoració." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const bindings = env as unknown as CoachEnv;
  if (!bindings.GEMINI_API_KEY) {
    return Response.json({ configured: false, error: "Falta connectar el teu compte de Gemini amb una clau de Google AI Studio." }, { status: 503 });
  }

  try {
    await ensureWorkoutSchema();
    let requestedSessionId: number | null = null;
    try {
      const body = await request.json() as { sessionId?: unknown };
      if (typeof body.sessionId === "number" && Number.isInteger(body.sessionId) && body.sessionId > 0) requestedSessionId = body.sessionId;
    } catch {
      requestedSessionId = null;
    }

    const history = await getDb().select().from(workoutSessions).orderBy(desc(workoutSessions.sessionDate), desc(workoutSessions.id)).limit(60);
    if (history.length === 0) return Response.json({ error: "Encara no hi ha cap sessió per analitzar." }, { status: 400 });
    const [requestedSession] = requestedSessionId
      ? await getDb().select().from(workoutSessions).where(eq(workoutSessions.id, requestedSessionId)).limit(1)
      : [history[0]];
    if (!requestedSession) return Response.json({ error: "No s’ha trobat la sessió que s’ha d’analitzar." }, { status: 404 });

    const sessions = history.some((session) => session.id === requestedSession.id) ? history : [requestedSession, ...history];
    const [previousStoredFeedback] = await getDb().select().from(coachFeedback).orderBy(desc(coachFeedback.id)).limit(1);
    const previousFeedback = previousStoredFeedback ? parseCoachFeedback(previousStoredFeedback.analysis) : null;
    const sessionId = requestedSession.id;
    const context = buildCoachContext(sessions, sessionId, previousFeedback);
    const prompt = `Perfil personal proporcionat per l'usuari:
${bindings.ATHLETE_PROFILE || "Encara no configurat. No inventis dades personals."}

Dades calculades i verificades per l'app:
${JSON.stringify(context)}

Genera dos nivells de feedback: una lectura específica de la sessió nova i una lectura acumulada de la setmana. Cita xifres reals quan aportin valor. Compara amb la sessió anterior de la mateixa rutina i amb la setmana anterior només quan les dades ho permetin. Si hi ha continuïtat d'una recomanació anterior, comprova si s'ha pogut seguir; no assumeixis que s'ha complert.

El veredicte ha d'explicar què significa la sessió, no limitar-se a descriure-la. L'evidència ha de justificar-lo amb una o dues dades. Cada nextAction ha de ser una única acció concreta i mesurable per al pròxim entrenament o per a la resta de la setmana. El camp watch només ha d'assenyalar un risc sustentat per dades; si no n'hi ha, indica què convé observar sense inventar alarmes. Ajusta confidence a la cobertura i comparabilitat de les dades.`;
    const systemInstruction = `Ets un entrenador personal especialista en força, running i trail running. Escriu sempre en català natural, proper, directe, exigent i prudent. No facis elogis automàtics ni frases genèriques com "continua així". No inventis dades, símptomes, tècnica, recuperació ni causes. Diferencia una observació d'una hipòtesi i reconeix quan falten dades. No diagnostiquis, no prescriguis tractaments ni substitueixis professionals sanitaris o de la nutrició. No mostris noms de camps interns ni JSON. Prioritza els comentaris de l'usuari i dona recomanacions conservadores si l'RPE és alt, hi ha molèsties o la informació és insuficient.`;
    const model = bindings.GEMINI_MODEL || "gemini-3.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": bindings.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1800,
          thinkingConfig: { thinkingLevel: "low" },
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              version: { type: "INTEGER", enum: [2] },
              session: {
                type: "OBJECT",
                properties: {
                  verdict: { type: "STRING", description: "Interpretació honesta i específica de la sessió en 1 o 2 frases." },
                  evidence: { type: "STRING", description: "Justificació amb dades reals en 1 o 2 frases." },
                  nextAction: { type: "STRING", description: "Una acció concreta i mesurable per a la pròxima sessió." },
                },
                required: ["verdict", "evidence", "nextAction"],
              },
              week: {
                type: "OBJECT",
                properties: {
                  summary: { type: "STRING", description: "Lectura breu de la càrrega i constància de la setmana." },
                  progress: { type: "STRING", description: "Progrés detectat o límit de les dades disponibles." },
                  watch: { type: "STRING", description: "Punt justificat que cal vigilar, sense alarmisme." },
                  nextAction: { type: "STRING", description: "Una acció concreta i mesurable per a la resta de la setmana." },
                },
                required: ["summary", "progress", "watch", "nextAction"],
              },
              confidence: { type: "STRING", enum: ["alta", "mitjana", "baixa"] },
            },
            required: ["version", "session", "week", "confidence"],
          },
        },
      }),
    });

    if (!response.ok) {
      const messages: Record<number, string> = {
        400: "La configuració del model de Gemini no és compatible.",
        403: "La clau de Gemini no té permís o ha deixat de ser vàlida.",
        404: "El model de Gemini configurat ja no està disponible.",
        429: "S’ha assolit temporalment la quota gratuïta de Gemini.",
      };
      throw new Error(messages[response.status] ?? `Gemini ha respost amb l’estat ${response.status}.`);
    }

    const result = await response.json() as {
      candidates?: {
        finishReason?: string;
        content?: { parts?: { text?: string; thought?: boolean }[] };
      }[];
    };
    const candidate = result.candidates?.[0];
    if (candidate?.finishReason === "MAX_TOKENS") throw new Error("Gemini ha esgotat el límit de resposta.");
    const analysis = candidate?.content?.parts
      ?.filter((part) => !part.thought)
      .map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!analysis) throw new Error("Gemini no ha retornat cap valoració.");

    const feedback = parseCoachFeedback(analysis);
    if (!feedback) throw new Error("Gemini ha retornat una valoració incompleta. Es manté l’anterior.");
    const storedAnalysis = JSON.stringify(feedback);
    const [saved] = await getDb().insert(coachFeedback).values({ sessionId, analysis: storedAnalysis }).onConflictDoUpdate({
      target: coachFeedback.sessionId,
      set: { analysis: storedAnalysis, createdAt: new Date().toISOString() },
    }).returning();
    return Response.json({ configured: true, feedback, analysis: "", createdAt: saved.createdAt, sessionId: saved.sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No s’ha pogut generar la valoració de Gemini.";
    console.error("Gemini coach error:", message);
    return Response.json({ configured: true, error: message }, { status: 502 });
  }
}

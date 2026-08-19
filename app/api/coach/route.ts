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

Genera dos nivells de feedback: una lectura específica de la sessió nova i una lectura acumulada de la setmana. Les dades ja estan separades entre força, running lliure i escalfaments de running. No barregis mètriques ni conclusions entre disciplines.

REGLES DE SEPARACIÓ:
1. A session.focus copia exactament sessioNova.modalitatPrincipal.
2. Si la modalitat principal és força, session.verdict, session.evidence i session.nextAction han de parlar només de la força. No hi incloguis l'escalfament de running.
3. Si la modalitat principal és running, aquests tres camps han de parlar només del running. No hi incloguis exercicis de força d'altres sessions.
4. week.strength analitza exclusivament sessions, RPE, minuts, exercicis, pesos i repeticions de força.
5. week.running analitza exclusivament running lliure i escalfaments: km, minuts, ritme, desnivell, pols i RPE de les sessions lliures. No tractis l'RPE d'una sessió de força com si fos l'RPE de l'escalfament.
6. week.summary, week.watch i week.nextAction poden integrar les dues disciplines només per valorar constància, càrrega total, recuperació o planificació. No atribueixis causalitat entre força i running sense evidència explícita.

CRITERI D'ENTRENADOR:
1. Dona una opinió clara: la sessió o progressió ha estat ben ajustada, massa exigent, massa conservadora o encara no és valorable. No et limitis a enumerar dades.
2. En força, decideix si convé pujar, mantenir o baixar la càrrega de l'exercici més rellevant. Justifica-ho amb pes, repeticions, RPE, execució completada i comentaris; no assumeixis que qualsevol pujada és excessiva.
3. En running, valora l'eficiència i la intensitat creuant ritme, durada, desnivell, RPE, pols mitjà, pols màxim i historial comparable.
4. Si el FIT inclou zonesFCMin, analitza quant temps s'ha passat a Z1–Z5 segons les zones configurades al rellotge. Per un rodatge suau, valora si predomina la baixa intensitat; per una sessió lliure, interpreta la distribució segons l'objectiu i l'RPE.
5. Si no hi ha zonesFCMin, no dedueixis zones a partir del pols mitjà, del màxim observat ni de l'edat. Indica que falten les zones si aquesta dada és necessària.
6. No interpretis la freqüència cardíaca com un diagnòstic mèdic ni atribueixis canvis només a fatiga, forma física o recuperació: temperatura, desnivell i altres factors poden influir-hi.
7. La pròxima acció ha de contenir una decisió i un criteri condicional quan sigui possible; per exemple, mantenir el pes si l'RPE supera 7 o augmentar-lo només si totes les repeticions són sòlides amb RPE 7 o inferior.

Cita xifres reals quan aportin valor. Compara amb la sessió anterior de la mateixa rutina i amb la setmana anterior només quan les dades ho permetin. Un valor zero en una setmana sense sessions no és una marca esportiva ni una davallada: és absència de dades. Si hi ha continuïtat d'una recomanació anterior, comprova si s'ha pogut seguir; no assumeixis que s'ha complert.

El veredicte ha d'explicar què significa la sessió, no limitar-se a descriure-la. L'evidència ha de justificar-lo amb una o dues dades. Cada nextAction ha de ser una única acció concreta i mesurable per al pròxim entrenament o per a la resta de la setmana. El camp watch només ha d'assenyalar un risc sustentat per dades; si no n'hi ha, indica què convé observar sense inventar alarmes. Ajusta confidence a la cobertura i comparabilitat de les dades.

Retorna exclusivament un objecte JSON amb aquesta estructura: {"session":{"focus":"força|running","verdict":"...","evidence":"...","nextAction":"..."},"week":{"summary":"...","strength":"...","running":"...","watch":"...","nextAction":"..."},"confidence":"alta|mitjana|baixa"}.`;
    const systemInstruction = `Ets un entrenador personal especialista en força, running i trail running. El teu valor és prendre una decisió d'entrenador sustentada per les dades, no repetir-les. Escriu sempre en català natural, proper, directe, exigent i prudent. Tracta força i running com dues línies de progressió independents i integra-les només quan parlis de càrrega global, recuperació o planificació. No facis elogis automàtics ni frases genèriques com "continua així". No inventis dades, símptomes, tècnica, recuperació, zones cardíaques ni causes. Diferencia una observació d'una hipòtesi i reconeix quan falten dades. No diagnostiquis, no prescriguis tractaments ni substitueixis professionals sanitaris o de la nutrició. No mostris noms de camps interns ni JSON. Prioritza els comentaris de l'usuari i dona recomanacions conservadores si l'RPE és alt, hi ha molèsties o la informació és insuficient.`;
    const model = bindings.GEMINI_MODEL || "gemini-3.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const headers = { "content-type": "application/json", "x-goog-api-key": bindings.GEMINI_API_KEY };
    const generationConfig = {
      temperature: 0.3,
      maxOutputTokens: 4096,
      thinkingConfig: { thinkingLevel: "minimal" },
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          session: {
            type: "OBJECT",
            properties: {
              focus: { type: "STRING", enum: ["força", "running"] },
              verdict: { type: "STRING", description: "Opinió clara d'entrenador sobre si la sessió ha estat ben ajustada, exigent, conservadora o no valorable." },
              evidence: { type: "STRING", description: "Justificació amb dades reals en 1 o 2 frases." },
              nextAction: { type: "STRING", description: "Una decisió concreta i mesurable, preferentment amb una condició basada en RPE, repeticions, ritme o zones." },
            },
            required: ["focus", "verdict", "evidence", "nextAction"],
          },
          week: {
            type: "OBJECT",
            properties: {
              summary: { type: "STRING", description: "Lectura breu de la càrrega i constància de la setmana." },
              strength: { type: "STRING", description: "Progrés de força exclusivament, o límit de les dades de força disponibles." },
              running: { type: "STRING", description: "Opinió sobre el running basada en ritme, RPE, pols, zones reals del FIT i historial comparable." },
              watch: { type: "STRING", description: "Punt justificat que cal vigilar, sense alarmisme." },
              nextAction: { type: "STRING", description: "Una acció concreta i mesurable per a la resta de la setmana." },
            },
            required: ["summary", "strength", "running", "watch", "nextAction"],
          },
          confidence: { type: "STRING", enum: ["alta", "mitjana", "baixa"] },
        },
        required: ["session", "week", "confidence"],
      },
    };
    const requestBody = (config: Record<string, unknown>) => JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: config,
      });
    let response = await fetch(endpoint, { method: "POST", headers, body: requestBody(generationConfig) });
    if (response.status === 400) {
      console.error("Gemini structured output rejected:", (await response.text()).slice(0, 1000));
      const fallbackConfig = {
        temperature: generationConfig.temperature,
        maxOutputTokens: generationConfig.maxOutputTokens,
        thinkingConfig: generationConfig.thinkingConfig,
        responseMimeType: generationConfig.responseMimeType,
      };
      response = await fetch(endpoint, { method: "POST", headers, body: requestBody(fallbackConfig) });
    }

    const responseError = (status: number) => {
      const messages: Record<number, string> = {
        400: "La configuració del model de Gemini no és compatible.",
        403: "La clau de Gemini no té permís o ha deixat de ser vàlida.",
        404: "El model de Gemini configurat ja no està disponible.",
        429: "S’ha assolit temporalment la quota gratuïta de Gemini.",
      };
      return messages[status] ?? `Gemini ha respost amb l’estat ${status}.`;
    };
    if (!response.ok) throw new Error(responseError(response.status));

    type GeminiResult = {
      candidates?: {
        finishReason?: string;
        content?: { parts?: { text?: string; thought?: boolean }[] };
      }[];
    };
    let result = await response.json() as GeminiResult;
    let candidate = result.candidates?.[0];
    if (candidate?.finishReason === "MAX_TOKENS") {
      console.error("Gemini reached MAX_TOKENS; retrying once with a larger unstructured budget.");
      const retryConfig = {
        temperature: 0.2,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingLevel: "minimal" },
        responseMimeType: generationConfig.responseMimeType,
      };
      response = await fetch(endpoint, { method: "POST", headers, body: requestBody(retryConfig) });
      if (!response.ok) throw new Error(responseError(response.status));
      result = await response.json() as GeminiResult;
      candidate = result.candidates?.[0];
    }
    if (candidate?.finishReason === "MAX_TOKENS") throw new Error("Gemini ha tallat dues vegades la valoració. Torna-ho a provar d’aquí a un moment.");
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

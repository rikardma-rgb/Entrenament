"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type RoutineId = "A" | "B" | "RUN";
type TabId = "week" | "progress" | "guide";

type Exercise = {
  id: string;
  name: string;
  shortName: string;
  sets: string;
  rest: string;
  focus: string;
  setup: string;
  execution: string;
  cues: string[];
  mistakes: string[];
  weighted: boolean;
};

type ExerciseResult = {
  exerciseId: string;
  weight: number | null;
  reps: string;
  completed: boolean;
};

type WorkoutSession = {
  id: number;
  sessionDate: string;
  routine: RoutineId;
  durationMinutes: number | null;
  rpe: number | null;
  exercises: ExerciseResult[];
  notes: string;
  createdAt: string;
};

const exercisesA: Exercise[] = [
  {
    id: "goblet-squat",
    name: "Sentadilla goblet",
    shortName: "Goblet squat",
    sets: "3 × 10–12",
    rest: "75 s",
    focus: "Quàdriceps, glutis i tronc",
    setup: "Subjecta una manuella vertical davant del pit, colzes apuntant avall. Peus una mica més oberts que els malucs i puntes lleugerament cap enfora.",
    execution: "Agafa aire, activa l’abdomen i baixa portant els malucs entre els talons. Mantén tot el peu a terra. Puja empenyent el terra i deixa anar l’aire al tram final.",
    cues: ["Pit alt i esquena neutra", "Genolls en la direcció dels peus", "Baixa només fins on mantinguis control"],
    mistakes: ["Aixecar els talons", "Deixar caure els genolls cap endins", "Arrodonir l’esquena al fons"],
    weighted: true,
  },
  {
    id: "dumbbell-bench",
    name: "Press banca amb manuelles",
    shortName: "Press banca",
    sets: "3 × 10–12",
    rest: "75 s",
    focus: "Pectoral, tríceps i espatlla anterior",
    setup: "Estira’t amb els peus ferms a terra. Ajunta lleugerament els omòplats i mantén els canells sobre els colzes.",
    execution: "Baixa les manuelles amb control fins que quedin a prop del pit, amb els colzes a uns 45° del cos. Empeny amunt sense xocar les manuelles.",
    cues: ["Peus clavats a terra", "Espatlles lluny de les orelles", "Avantbraços verticals"],
    mistakes: ["Obrir els colzes a 90°", "Perdre la posició dels omòplats", "Rebotar al final de la baixada"],
    weighted: true,
  },
  {
    id: "seated-row",
    name: "Rem en politja baixa",
    shortName: "Rem politja",
    sets: "3 × 10–12",
    rest: "75 s",
    focus: "Esquena mitjana, dorsal i bíceps",
    setup: "Seu alt, genolls lleugerament flexionats i abdomen actiu. Comença amb els braços llargs sense arrodonir la zona lumbar.",
    execution: "Porta el mànec cap a la part baixa de les costelles. Acaba amb els colzes enrere i els omòplats junts; torna lentament fins a estirar els braços.",
    cues: ["Tronc quiet", "Inicia el gest amb els omòplats", "Pausa breu al final"],
    mistakes: ["Balancejar el cos", "Encongir les espatlles", "Estirar només amb els braços"],
    weighted: true,
  },
  {
    id: "dumbbell-curl",
    name: "Curl de bíceps amb manuelles",
    shortName: "Curl bíceps",
    sets: "3 × 12",
    rest: "45 s",
    focus: "Bíceps i flexors del colze",
    setup: "Dempeus, tronc alt, colzes al costat del cos i manuelles agafades amb els palmells endavant.",
    execution: "Flexiona els colzes sense moure’ls endavant. Prem el bíceps a dalt i baixa durant dos segons fins a estirar completament.",
    cues: ["Colzes enganxats al cos", "Canells neutres", "Baixada lenta"],
    mistakes: ["Donar impuls amb l’esquena", "Avançar els colzes", "Tallar el recorregut"],
    weighted: true,
  },
  {
    id: "seated-calf",
    name: "Elevació de talons assegut",
    shortName: "Bessons assegut",
    sets: "3 × 15",
    rest: "45 s",
    focus: "Soli i bessons",
    setup: "Seu amb els genolls a 90°, metatarsos sobre una base i talons lliures. Col·loca la càrrega sobre les cuixes.",
    execution: "Baixa els talons fins a notar estirament, puja tan alt com puguis i mantén un segon a dalt.",
    cues: ["Recorregut complet", "Pausa a dalt", "Moviment vertical"],
    mistakes: ["Fer rebots", "Girar els turmells", "Anar massa ràpid"],
    weighted: true,
  },
  {
    id: "plank",
    name: "Planxa",
    shortName: "Planxa",
    sets: "2 × 30 s",
    rest: "30 s",
    focus: "Estabilitat anterior del tronc",
    setup: "Colzes sota les espatlles, cames estirades i peus separats a l’amplada dels malucs.",
    execution: "Contrau glutis i abdomen com si esperessis un cop. Mantén una línia recta del cap als talons mentre respires curt i controlat.",
    cues: ["Costelles cap avall", "Glutis actius", "Coll llarg"],
    mistakes: ["Deixar caure els malucs", "Elevar massa el cul", "Aguantar la respiració"],
    weighted: false,
  },
  {
    id: "pallof-press",
    name: "Pallof press",
    shortName: "Pallof press",
    sets: "2 × 10 / costat",
    rest: "30 s",
    focus: "Anti-rotació i estabilitat del tronc",
    setup: "Posa’t de costat a una politja, peus ferms i mànec davant l’estèrnum agafat amb dues mans.",
    execution: "Estén els braços al davant sense deixar que el tronc giri cap a la politja. Torna al pit amb control i completa els dos costats.",
    cues: ["Malucs i espatlles de cara", "Abdomen ferm", "Braços rectes al final"],
    mistakes: ["Girar el tronc", "Inclinar-se", "Fer servir massa càrrega"],
    weighted: true,
  },
];

const exercisesB: Exercise[] = [
  {
    id: "romanian-deadlift",
    name: "Pes mort romanès",
    shortName: "Pes mort romanès",
    sets: "3 × 10",
    rest: "75 s",
    focus: "Isquiotibials, glutis i esquena",
    setup: "Peus a l’amplada dels malucs, càrrega davant de les cuixes, genolls suaument flexionats i abdomen actiu.",
    execution: "Porta els malucs enrere mentre la càrrega baixa fregant les cames. Para quan notis tensió als isquiotibials sense perdre l’esquena neutra; empeny els malucs endavant per pujar.",
    cues: ["Malucs enrere, no avall", "Càrrega molt a prop del cos", "Coll alineat amb l’esquena"],
    mistakes: ["Arrodonir la zona lumbar", "Convertir-lo en una sentadilla", "Baixar més enllà del teu control"],
    weighted: true,
  },
  {
    id: "seated-shoulder-press",
    name: "Press militar assegut",
    shortName: "Press militar",
    sets: "3 × 10",
    rest: "75 s",
    focus: "Espatlles i tríceps",
    setup: "Seu amb l’esquena recolzada, peus ferms i manuelles a l’altura de les espatlles. Avantbraços verticals.",
    execution: "Empeny les manuelles amunt i lleugerament cap endins. Baixa fins que els colzes quedin sota els canells, sense arquejar la zona lumbar.",
    cues: ["Abdomen actiu", "Costelles controlades", "Espatlles lluny de les orelles"],
    mistakes: ["Arquejar l’esquena", "Xocar les manuelles", "Baixar sense control"],
    weighted: true,
  },
  {
    id: "lat-pulldown",
    name: "Jaló al pit",
    shortName: "Jaló al pit",
    sets: "3 × 10–12",
    rest: "75 s",
    focus: "Dorsal ample, esquena alta i bíceps",
    setup: "Agafa la barra una mica més ampla que les espatlles. Seu amb les cuixes fixades i el pit alt.",
    execution: "Baixa la barra cap a la part alta del pit portant els colzes avall. Torna a estirar els braços lentament sense perdre la posició del tronc.",
    cues: ["Colzes cap a les butxaques", "Pit alt", "Controla la tornada"],
    mistakes: ["Portar la barra darrere del coll", "Balancejar-se enrere", "Tibar només amb els bíceps"],
    weighted: true,
  },
  {
    id: "triceps-pushdown",
    name: "Extensió de tríceps en politja",
    shortName: "Tríceps politja",
    sets: "3 × 12",
    rest: "45 s",
    focus: "Tríceps",
    setup: "Colzes enganxats al costat del cos, pit alt i una lleugera inclinació endavant.",
    execution: "Estén els colzes fins que els braços quedin rectes. Prem el tríceps un instant i torna sense deixar que els colzes s’avancin.",
    cues: ["Només es mou l’avantbraç", "Canells rectes", "Final complet"],
    mistakes: ["Obrir els colzes", "Ajudar-se amb el tronc", "Carregar massa pes"],
    weighted: true,
  },
  {
    id: "alternating-lunge",
    name: "Gambades alternes",
    shortName: "Gambades",
    sets: "3 × 10 / cama",
    rest: "60 s",
    focus: "Quàdriceps, glutis i estabilitat",
    setup: "Dempeus, peus a l’amplada dels malucs i tronc alt. Deixa espai lateral entre els peus, com si caminessis sobre dues vies.",
    execution: "Fes un pas prou llarg i baixa el genoll posterior cap a terra. Empeny amb tot el peu davanter per tornar i alterna cama.",
    cues: ["Genoll alineat amb el peu", "Tronc estable", "Passa el pes pel taló i mig peu"],
    mistakes: ["Fer el pas massa curt", "Caure cap a un costat", "Impulsar-se amb la cama posterior"],
    weighted: true,
  },
  {
    id: "standing-calf",
    name: "Elevació de talons dempeus",
    shortName: "Bessons dempeus",
    sets: "3 × 15",
    rest: "45 s",
    focus: "Bessons i soli",
    setup: "Metatarsos sobre una base, cames estirades però sense bloquejar els genolls i suport estable per equilibrar-te.",
    execution: "Baixa els talons amb control, puja fins a quedar sobre les puntes i mantén un segon abans de tornar.",
    cues: ["Puja ben amunt", "Turmells rectes", "Ritme controlat"],
    mistakes: ["Rebotar", "Fer mig recorregut", "Desplaçar el pes cap al dit petit"],
    weighted: true,
  },
];

const routines = {
  A: { label: "Full Body A", day: "Dimarts", accent: "lime", exercises: exercisesA },
  B: { label: "Full Body B", day: "Dijous", accent: "orange", exercises: exercisesB },
};

const allExercises = [...exercisesA, ...exercisesB];

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function displayDate(date: string) {
  return new Intl.DateTimeFormat("ca-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function routineLabel(id: RoutineId) {
  return id === "RUN" ? "Running suau" : routines[id].label;
}

function emptyResults(routine: "A" | "B"): ExerciseResult[] {
  return routines[routine].exercises.map((exercise) => ({ exerciseId: exercise.id, weight: null, reps: exercise.sets, completed: false }));
}

export default function Home() {
  const [tab, setTab] = useState<TabId>("week");
  const [routine, setRoutine] = useState<RoutineId>("A");
  const [date, setDate] = useState(localDate);
  const [results, setResults] = useState<ExerciseResult[]>(() => emptyResults("A"));
  const [duration, setDuration] = useState("35");
  const [rpe, setRpe] = useState("6");
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  async function loadSessions() {
    try {
      const response = await fetch("/api/sessions");
      if (!response.ok) throw new Error("No s’ha pogut carregar l’historial");
      const data = (await response.json()) as { sessions: WorkoutSession[] };
      setSessions(data.sessions);
    } catch {
      setMessage("No s’ha pogut connectar amb l’historial. Torna-ho a provar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  function switchRoutine(next: RoutineId) {
    setRoutine(next);
    setMessage("");
    setNotes("");
    if (next === "RUN") {
      setDuration("40");
      setRpe("4");
      setResults([]);
      return;
    }
    setDuration("35");
    setRpe("6");
    const previous = sessions.find((session) => session.routine === next);
    setResults(
      emptyResults(next).map((result) => {
        const old = previous?.exercises.find((entry) => entry.exerciseId === result.exerciseId);
        return old ? { ...result, weight: old.weight } : result;
      }),
    );
  }

  function updateResult(exerciseId: string, patch: Partial<ExerciseResult>) {
    setResults((current) => current.map((entry) => (entry.exerciseId === exerciseId ? { ...entry, ...patch } : entry)));
  }

  async function saveWorkout(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionDate: date,
          routine,
          durationMinutes: Number(duration) || null,
          rpe: Number(rpe) || null,
          exercises: routine === "RUN" ? [] : results,
          notes,
        }),
      });
      if (!response.ok) throw new Error("No s’ha pogut desar");
      setMessage("Sessió desada. Bon entrenament!");
      setNotes("");
      await loadSessions();
    } catch {
      setMessage("No s’ha pogut desar la sessió. Torna-ho a provar.");
    } finally {
      setSaving(false);
    }
  }

  const progressRows = useMemo(() => {
    return allExercises
      .filter((exercise) => exercise.weighted)
      .map((exercise) => {
        const values = sessions
          .flatMap((session) => session.exercises.map((entry) => ({ ...entry, sessionDate: session.sessionDate })))
          .filter((entry) => entry.exerciseId === exercise.id && entry.weight !== null)
          .map((entry) => ({ weight: Number(entry.weight), date: entry.sessionDate }));
        const latest = values[0]?.weight ?? null;
        const previous = values[1]?.weight ?? null;
        const best = values.length ? Math.max(...values.map((value) => value.weight)) : null;
        return { exercise, latest, previous, best, values: values.slice(0, 6).reverse() };
      });
  }, [sessions]);

  const completedThisWeek = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    const day = (now.getDay() + 6) % 7;
    monday.setDate(now.getDate() - day);
    monday.setHours(0, 0, 0, 0);
    return sessions.filter((session) => new Date(`${session.sessionDate}T12:00:00`) >= monday).length;
  }, [sessions]);

  const activeExercises = routine === "RUN" ? [] : routines[routine].exercises;

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Entrena, inici">
          <span className="brand-mark">E</span>
          <span>ENTRENA</span>
        </a>
        <nav className="desktop-nav" aria-label="Navegació principal">
          <button className={tab === "week" ? "active" : ""} onClick={() => setTab("week")}>Setmana</button>
          <button className={tab === "progress" ? "active" : ""} onClick={() => setTab("progress")}>Progrés</button>
          <button className={tab === "guide" ? "active" : ""} onClick={() => setTab("guide")}>Tècnica</button>
        </nav>
        <div className="week-counter"><strong>{completedThisWeek}/3</strong><span>aquesta setmana</span></div>
      </header>

      <section id="top" className="hero">
        <div>
          <p className="eyebrow">EL TEU PLA · 3 DIES / SETMANA</p>
          <h1>Força que<br /><em>es pot mesurar.</em></h1>
        </div>
        <p className="hero-copy">Registra cada quilo, revisa el teu progrés i entrena amb una tècnica sòlida. Simple, constant i teu.</p>
      </section>

      <nav className="mobile-tabs" aria-label="Seccions de l’app">
        <button className={tab === "week" ? "active" : ""} onClick={() => setTab("week")}>Setmana</button>
        <button className={tab === "progress" ? "active" : ""} onClick={() => setTab("progress")}>Progrés</button>
        <button className={tab === "guide" ? "active" : ""} onClick={() => setTab("guide")}>Tècnica</button>
      </nav>

      {tab === "week" && (
        <div className="page-grid">
          <section className="plan-panel" aria-labelledby="weekly-plan-title">
            <div className="section-heading">
              <div><span>01</span><h2 id="weekly-plan-title">Planificació setmanal</h2></div>
              <p>Dos dies combinats de running + força i una sortida suau el cap de setmana.</p>
            </div>

            <div className="schedule">
              <button className={routine === "A" ? "schedule-card selected lime" : "schedule-card"} onClick={() => switchRoutine("A")}>
                <span className="day-index">01</span>
                <div><small>DIMARTS</small><strong>15’ suau + Full Body A</strong><p>RPE 3–4 · 7 exercicis</p></div>
                <span className="arrow">↗</span>
              </button>
              <button className={routine === "B" ? "schedule-card selected orange" : "schedule-card"} onClick={() => switchRoutine("B")}>
                <span className="day-index">02</span>
                <div><small>DIJOUS</small><strong>15’ suau + Full Body B</strong><p>RPE 3–4 · 6 exercicis</p></div>
                <span className="arrow">↗</span>
              </button>
              <button className={routine === "RUN" ? "schedule-card selected cream" : "schedule-card"} onClick={() => switchRoutine("RUN")}>
                <span className="day-index">03</span>
                <div><small>DISSABTE O DIUMENGE</small><strong>Running suau</strong><p>30–45 min · RPE 4–5</p></div>
                <span className="arrow">↗</span>
              </button>
            </div>

            <aside className="run-note">
              <span>RITME</span>
              <p><strong>Pots mantenir una conversa?</strong> Perfecte. Corre molt per sota de 4:20/km; avui l’objectiu és sumar, no competir.</p>
            </aside>
          </section>

          <section className="log-panel" aria-labelledby="log-title">
            <div className="log-title-row">
              <div>
                <p className="eyebrow">REGISTRA LA SESSIÓ</p>
                <h2 id="log-title">{routineLabel(routine)}</h2>
              </div>
              <span className={`routine-badge ${routine === "A" ? "lime" : routine === "B" ? "orange" : "cream"}`}>{routine === "RUN" ? "03" : routine}</span>
            </div>

            <form onSubmit={saveWorkout}>
              <div className="session-meta">
                <label>Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
                <label>Durada<input type="number" min="1" max="240" inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value)} /><span>min</span></label>
                <label>RPE<input type="number" min="1" max="10" inputMode="numeric" value={rpe} onChange={(event) => setRpe(event.target.value)} /><span>/ 10</span></label>
              </div>

              {routine !== "RUN" && (
                <div className="exercise-log">
                  <div className="exercise-log-head"><span>Exercici</span><span>Pes</span><span>Fet</span></div>
                  {activeExercises.map((exercise, index) => {
                    const result = results.find((entry) => entry.exerciseId === exercise.id);
                    return (
                      <div className="exercise-entry" key={exercise.id}>
                        <button type="button" className="exercise-name" onClick={() => setSelectedExercise(exercise)} aria-label={`Veure tècnica de ${exercise.name}`}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <div><strong>{exercise.name}</strong><small>{exercise.sets} · {exercise.rest} descans</small></div>
                        </button>
                        <label className={exercise.weighted ? "weight-input" : "weight-input disabled"}>
                          <input
                            type="number"
                            min="0"
                            max="500"
                            step="0.5"
                            inputMode="decimal"
                            placeholder="—"
                            disabled={!exercise.weighted}
                            value={result?.weight ?? ""}
                            onChange={(event) => updateResult(exercise.id, { weight: event.target.value === "" ? null : Number(event.target.value) })}
                            aria-label={`Pes per ${exercise.name}`}
                          />
                          <span>{exercise.weighted ? "kg" : "temps"}</span>
                        </label>
                        <label className="check-control">
                          <input type="checkbox" checked={result?.completed ?? false} onChange={(event) => updateResult(exercise.id, { completed: event.target.checked })} aria-label={`Marcar ${exercise.name} com completat`} />
                          <span>✓</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}

              {routine === "RUN" && (
                <div className="run-form-card">
                  <span className="run-orbit">RPE<br /><strong>4–5</strong></span>
                  <div><h3>Sortida de gaudi</h3><p>Ritme còmode, respiració controlada i sensació que podries continuar una estona més.</p></div>
                </div>
              )}

              <label className="notes-field">Notes de la sessió<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Sensacions, molèsties, ajustos per a la pròxima..." /></label>
              <button className="save-button" type="submit" disabled={saving}><span>{saving ? "Desant..." : "Desar sessió"}</span><span>→</span></button>
              {message && <p className={message.startsWith("Sessió") ? "form-message success" : "form-message"} role="status">{message}</p>}
            </form>
          </section>
        </div>
      )}

      {tab === "progress" && (
        <section className="content-section">
          <div className="section-heading wide">
            <div><span>02</span><h2>El teu progrés</h2></div>
            <p>Compara l’últim pes amb l’anterior. Augmenta només quan completes totes les repeticions amb bona tècnica.</p>
          </div>
          {loading ? <p className="empty-state">Carregant el teu historial...</p> : sessions.length === 0 ? (
            <div className="empty-state"><strong>Encara no hi ha sessions.</strong><p>Desa el primer entrenament i aquí veuràs com evoluciona cada exercici.</p></div>
          ) : (
            <div className="progress-layout">
              <div className="progress-table">
                <div className="progress-head"><span>Exercici</span><span>Últim</span><span>Canvi</span><span>Millor</span></div>
                {progressRows.map(({ exercise, latest, previous, best, values }) => {
                  const delta = latest !== null && previous !== null ? latest - previous : null;
                  const max = Math.max(...values.map((value) => value.weight), 1);
                  return (
                    <button className="progress-row" key={exercise.id} onClick={() => setSelectedExercise(exercise)}>
                      <div><strong>{exercise.shortName}</strong><span className="mini-bars" aria-hidden="true">{values.map((value, index) => <i key={`${value.date}-${index}`} style={{ height: `${Math.max(18, (value.weight / max) * 100)}%` }} />)}</span></div>
                      <b>{latest === null ? "—" : `${latest} kg`}</b>
                      <span className={delta !== null && delta > 0 ? "delta up" : "delta"}>{delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta} kg`}</span>
                      <span>{best === null ? "—" : `${best} kg`}</span>
                    </button>
                  );
                })}
              </div>
              <aside className="history-card">
                <p className="eyebrow">ÚLTIMES SESSIONS</p>
                <h3>Historial</h3>
                {sessions.slice(0, 8).map((session) => (
                  <div className="history-item" key={session.id}>
                    <span className={`history-dot ${session.routine.toLowerCase()}`} />
                    <div><strong>{routineLabel(session.routine)}</strong><small>{displayDate(session.sessionDate)} · {session.durationMinutes ?? "—"} min</small></div>
                    <b>RPE {session.rpe ?? "—"}</b>
                  </div>
                ))}
              </aside>
            </div>
          )}
        </section>
      )}

      {tab === "guide" && (
        <section className="content-section">
          <div className="section-heading wide">
            <div><span>03</span><h2>Guia de tècnica</h2></div>
            <p>Llegeix-la abans de començar i prioritza sempre un moviment estable, controlat i sense dolor.</p>
          </div>
          <div className="guide-split">
            <div>
              <p className="guide-label"><span className="dot lime" /> FULL BODY A · DIMARTS</p>
              {exercisesA.map((exercise, index) => <ExerciseGuideCard key={exercise.id} exercise={exercise} index={index + 1} onOpen={setSelectedExercise} />)}
            </div>
            <div>
              <p className="guide-label"><span className="dot orange" /> FULL BODY B · DIJOUS</p>
              {exercisesB.map((exercise, index) => <ExerciseGuideCard key={exercise.id} exercise={exercise} index={index + 1} onOpen={setSelectedExercise} />)}
            </div>
          </div>
          <aside className="safety-note"><strong>Important</strong><p>La tècnica s’ha d’adaptar a la teva mobilitat i historial. Para si notes dolor agut, mareig o una sensació inusual, i consulta un professional qualificat si tens dubtes.</p></aside>
        </section>
      )}

      <footer><span>ENTRENA</span><p>Constància &gt; perfecció. Un entrenament cada vegada.</p><small>Les teves dades es guarden de forma privada a l’app.</small></footer>

      {selectedExercise && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedExercise(null)}>
          <section className="technique-modal" role="dialog" aria-modal="true" aria-labelledby="technique-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedExercise(null)} aria-label="Tancar">×</button>
            <p className="eyebrow">GUIA DE TÈCNICA</p>
            <h2 id="technique-title">{selectedExercise.name}</h2>
            <div className="modal-meta"><span>{selectedExercise.sets}</span><span>{selectedExercise.rest} descans</span><span>{selectedExercise.focus}</span></div>
            <div className="technique-step"><span>01</span><div><h3>Posició inicial</h3><p>{selectedExercise.setup}</p></div></div>
            <div className="technique-step"><span>02</span><div><h3>Execució</h3><p>{selectedExercise.execution}</p></div></div>
            <div className="modal-columns">
              <div><h3>Punts clau</h3><ul>{selectedExercise.cues.map((cue) => <li key={cue}>{cue}</li>)}</ul></div>
              <div className="mistakes"><h3>Evita això</h3><ul>{selectedExercise.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></div>
            </div>
            <button className="modal-done" onClick={() => setSelectedExercise(null)}>Entès, a entrenar</button>
          </section>
        </div>
      )}
    </main>
  );
}

function ExerciseGuideCard({ exercise, index, onOpen }: { exercise: Exercise; index: number; onOpen: (exercise: Exercise) => void }) {
  return (
    <button className="guide-card" onClick={() => onOpen(exercise)}>
      <span>{String(index).padStart(2, "0")}</span>
      <div><strong>{exercise.name}</strong><small>{exercise.sets} · {exercise.focus}</small></div>
      <b>Veure tècnica →</b>
    </button>
  );
}

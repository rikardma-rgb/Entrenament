"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type RoutineId = "A" | "B" | "C" | "RUN";
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
  note?: string;
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

const exercisesC: Exercise[] = [
  {
    id: "express-push-up",
    name: "Flexions (push-ups)",
    shortName: "Flexions",
    sets: "10–15",
    rest: "20–30 s",
    focus: "Pectoral, tríceps i tronc",
    setup: "Mans una mica més obertes que les espatlles, dits endavant i cos en una línia recta del cap als talons. Recolza els genolls si ho necessites.",
    execution: "Baixa el pit entre les mans amb els colzes a uns 45° del cos. Empeny el terra fins a estirar els braços sense perdre la línia del tronc.",
    cues: ["Cos recte", "Abdomen i glutis actius", "Pit entre les mans"],
    mistakes: ["Deixar caure els malucs", "Obrir massa els colzes", "Fer només mig recorregut"],
    weighted: false,
    note: "De genolls si cal, mantenint el cos recte",
  },
  {
    id: "express-bulgarian-squat",
    name: "Sentadilla búlgara",
    shortName: "Búlgara",
    sets: "10 / cama",
    rest: "20–30 s",
    focus: "Quàdriceps, glutis i estabilitat",
    setup: "Col·loca el peu del darrere sobre una cadira o banc estable i avança prou el peu davanter. Comença sense pes.",
    execution: "Baixa el genoll posterior cap a terra mantenint el peu davanter completament recolzat. Puja empenyent amb la cama de davant.",
    cues: ["Pes sobre la cama davantera", "Genoll alineat amb el peu", "Cadira completament estable"],
    mistakes: ["Posar el peu davanter massa a prop", "Empènyer amb la cama posterior", "Perdre l’equilibri per anar ràpid"],
    weighted: true,
    note: "Peu del darrere sobre una cadira o banc; manuella opcional",
  },
  {
    id: "express-plank",
    name: "Planxa",
    shortName: "Planxa",
    sets: "30–40 s",
    rest: "20–30 s",
    focus: "Estabilitat del tronc",
    setup: "Colzes sota les espatlles, cames estirades i peus separats a l’amplada dels malucs.",
    execution: "Contrau abdomen i glutis i mantén una línia recta del cap als talons mentre continues respirant.",
    cues: ["Gluti apretat", "Costelles cap avall", "Coll llarg"],
    mistakes: ["Deixar caure els malucs", "Elevar massa el cul", "Aguantar la respiració"],
    weighted: false,
    note: "Cos en línia recta, gluti apretat",
  },
  {
    id: "express-glute-bridge",
    name: "Pont de glutis",
    shortName: "Pont de glutis",
    sets: "15",
    rest: "20–30 s",
    focus: "Glutis i cadena posterior",
    setup: "Estira’t boca amunt, genolls flexionats i peus a terra a prop dels glutis, separats a l’amplada dels malucs.",
    execution: "Empeny el terra amb els talons i eleva els malucs fins que espatlles, malucs i genolls quedin alineats. Prem els glutis a dalt.",
    cues: ["Empenta amb el taló", "Pausa a dalt", "Costelles controlades"],
    mistakes: ["Arquejar la zona lumbar", "Empènyer amb les puntes", "Obrir massa els genolls"],
    weighted: false,
    note: "Empenta amb el taló, apreta a dalt",
  },
  {
    id: "express-superman",
    name: "Superman altern",
    shortName: "Superman",
    sets: "12–15",
    rest: "20–30 s",
    focus: "Esquena, glutis i control creuat",
    setup: "Posa’t a quatre grapes, mans sota espatlles i genolls sota malucs, amb l’esquena neutra.",
    execution: "Allarga alhora un braç i la cama contrària sense girar el tronc. Torna amb control i alterna costat.",
    cues: ["Braç i cama contraris", "Malucs de cara a terra", "Moviment llarg, no alt"],
    mistakes: ["Arquejar la zona lumbar", "Girar la pelvis", "Fer el moviment amb impuls"],
    weighted: false,
    note: "Aixeca braç i cama contraris a la vegada",
  },
  {
    id: "express-diamond-or-curl",
    name: "Flexió diamant o curl de bíceps",
    shortName: "Diamant o curl",
    sets: "10–12",
    rest: "20–30 s",
    focus: "Tríceps o bíceps",
    setup: "Per a la flexió, apropa les mans sota el pit. Si tries curl, agafa dues manuelles amb els colzes al costat del cos.",
    execution: "Flexió: baixa amb el cos recte i els colzes prop del tronc. Curl: flexiona els colzes sense moure’ls endavant i baixa lentament.",
    cues: ["Tria una de les dues opcions", "Sense impuls", "Recorregut controlat"],
    mistakes: ["Obrir els colzes a la flexió", "Balancejar l’esquena al curl", "Sacrificar tècnica per repeticions"],
    weighted: true,
    note: "Diamant = tríceps sense pes; curl si tens manuelles",
  },
  {
    id: "express-standing-calf",
    name: "Elevació de talons dempeus",
    shortName: "Bessons a casa",
    sets: "20",
    rest: "20–30 s",
    focus: "Bessons, soli i peu",
    setup: "Dempeus i descalç sobre una superfície estable, peus paral·lels i un suport a prop si necessites equilibri.",
    execution: "Puja els talons tan alt com puguis, pausa un instant i baixa lentament fins a recolzar tot el peu.",
    cues: ["Superfície estable", "Puja vertical", "Controla la baixada"],
    mistakes: ["Fer rebots", "Girar els turmells", "Perdre l’equilibri per anar ràpid"],
    weighted: false,
    note: "Bo per la fàscia; descalç sobre superfície estable",
  },
  {
    id: "express-monster-walk",
    name: "Monster walk o clamshell",
    shortName: "Monster walk",
    sets: "12–15 / costat",
    rest: "20–30 s",
    focus: "Gluti mitjà i estabilitat de maluc",
    setup: "Monster walk: banda sobre els genolls o turmells i posició de mitja sentadilla. Clamshell: de costat, genolls flexionats i banda sobre els genolls.",
    execution: "Monster walk: fes passos laterals curts mantenint tensió a la banda. Clamshell: obre el genoll superior sense girar la pelvis.",
    cues: ["10 passes per direcció si fas monster walk", "Genolls cap enfora", "Pelvis estable"],
    mistakes: ["Ajuntar completament els peus", "Arrossegar-los", "Girar el tronc o la pelvis"],
    weighted: false,
    note: "12–15/costat o 10 passes/direcció; clau per la mecànica de cursa",
  },
];

const routines = {
  A: { label: "Full Body A", day: "Dimarts", accent: "lime", exercises: exercisesA },
  B: { label: "Full Body B", day: "Dijous", accent: "orange", exercises: exercisesB },
  C: { label: "Express", day: "Opcional", accent: "express", exercises: exercisesC },
};

const allExercises = [...exercisesA, ...exercisesB];

const alternatives: Record<string, { name: string; note: string }[]> = {
  "goblet-squat": [
    { name: "Sentadilla amb dues manuelles", note: "Mateix patró, amb una manuella a cada costat." },
    { name: "Premsa de cames", note: "Opció estable si no hi ha espai lliure." },
  ],
  "dumbbell-bench": [
    { name: "Press de pit en màquina", note: "Més estabilitat i ajust ràpid de la càrrega." },
    { name: "Flexions", note: "Sense material; eleva les mans si cal reduir dificultat." },
  ],
  "seated-row": [
    { name: "Rem amb manuella a una mà", note: "Recolza una mà al banc i treballa cada costat." },
    { name: "Rem amb pit recolzat", note: "Evita impuls del tronc i manté el gest molt estable." },
  ],
  "dumbbell-curl": [
    { name: "Curl en politja baixa", note: "Tensió contínua durant tot el recorregut." },
    { name: "Curl martell", note: "Manuelles amb palmells enfrontats; molt fàcil de substituir." },
  ],
  "seated-calf": [
    { name: "Bessons dempeus", note: "Fes-los en màquina o amb una manuella a la mà." },
    { name: "Bessons a la premsa", note: "Només mou els turmells i mantén els genolls estables." },
  ],
  plank: [
    { name: "Dead bug", note: "Alternativa a terra amb menys càrrega sobre les espatlles." },
    { name: "Planxa amb genolls", note: "Mateix control del tronc amb una palanca més curta." },
  ],
  "pallof-press": [
    { name: "Pallof amb banda", note: "Fixa una goma a un punt estable a l’altura del pit." },
    { name: "Suitcase carry", note: "Camina amb una manuella en una sola mà sense inclinar-te." },
  ],
  "romanian-deadlift": [
    { name: "Pes mort amb kettlebell", note: "Una sola càrrega entre les cames; gest fàcil d’aprendre." },
    { name: "Curl femoral", note: "Alternativa en màquina per treballar isquiotibials." },
  ],
  "seated-shoulder-press": [
    { name: "Press d’espatlla en màquina", note: "Trajectòria guiada i canvi de pes ràpid." },
    { name: "Landmine press", note: "Press diagonal més amable amb algunes espatlles." },
  ],
  "lat-pulldown": [
    { name: "Dominada assistida", note: "Mantén el pit alt i controla tota la baixada." },
    { name: "Jaló amb agarre neutre", note: "Mateixa màquina amb un mànec diferent i còmode." },
  ],
  "triceps-pushdown": [
    { name: "Extensió sobre el cap amb manuella", note: "Una manuella agafada amb dues mans." },
    { name: "Flexió amb mans juntes", note: "Opció sense màquina; adapta l’alçada de les mans." },
  ],
  "alternating-lunge": [
    { name: "Split squat estàtic", note: "Mateixa posició, sense alternar ni avançar." },
    { name: "Step-up al banc", note: "Puja a un banc estable empenyent amb la cama de treball." },
  ],
  "standing-calf": [
    { name: "Bessons assegut", note: "Més èmfasi al soli i molt poc espai necessari." },
    { name: "Bessons a una cama", note: "Sense màquina; subjecta una manuella si cal càrrega." },
  ],
  "express-push-up": [
    { name: "Flexions amb genolls", note: "Redueix la palanca mantenint el tronc recte." },
    { name: "Flexions inclinades", note: "Mans sobre una taula o banc estable." },
  ],
  "express-bulgarian-squat": [
    { name: "Gambada enrere", note: "Sense banc i amb menys exigència d’equilibri." },
    { name: "Step-up", note: "Puja a una superfície baixa i estable." },
  ],
  "express-plank": [
    { name: "Planxa amb genolls", note: "Mateixa tensió amb una palanca més curta." },
    { name: "Dead bug", note: "Opció boca amunt sense càrrega sobre les espatlles." },
  ],
  "express-glute-bridge": [
    { name: "Hip thrust al sofà", note: "Recolza la part alta de l’esquena i amplia el recorregut." },
    { name: "Frog pumps", note: "Plantes dels peus juntes i genolls oberts." },
  ],
  "express-superman": [
    { name: "Superman a terra", note: "Boca avall, eleva lleugerament braços i cames." },
    { name: "Dead bug altern", note: "Opció boca amunt amb control creuat." },
  ],
  "express-diamond-or-curl": [
    { name: "Extensió de tríceps en cadira", note: "Fes-la només amb una cadira molt estable." },
    { name: "Curl amb banda", note: "Trepitja una goma i mantén els colzes quiets." },
  ],
  "express-standing-calf": [
    { name: "Bessons a una cama", note: "Més intensitat sense afegir material." },
    { name: "Bessons en un esglaó", note: "Afegeix recorregut si l’esglaó és estable." },
  ],
  "express-monster-walk": [
    { name: "Clamshell", note: "De costat, obre el genoll sense girar la pelvis." },
    { name: "Elevació lateral de cama", note: "Sense banda i amb el peu mirant endavant." },
  ],
};

function exerciseVisual(exercise: Exercise) {
  const aIndex = exercisesA.findIndex((item) => item.id === exercise.id);
  const isA = aIndex >= 0;
  const bIndex = exercisesB.findIndex((item) => item.id === exercise.id);
  const isB = bIndex >= 0;
  const index = isA ? aIndex : isB ? bIndex : exercisesC.findIndex((item) => item.id === exercise.id);
  const columns = isB ? 3 : 4;
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    backgroundImage: `url("/${isA ? "exercises-a" : isB ? "exercises-b" : "exercises-c"}.png")`,
    backgroundSize: `${columns * 100}% 200%`,
    backgroundPosition: `${columns === 1 ? 0 : (column / (columns - 1)) * 100}% ${row * 100}%`,
    aspectRatio: isB ? "1 / 1" : "3 / 4",
  };
}

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function displayDate(date: string) {
  return new Intl.DateTimeFormat("ca-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function routineLabel(id: RoutineId) {
  return id === "RUN" ? "Running lliure" : routines[id].label;
}

function emptyResults(routine: "A" | "B" | "C"): ExerciseResult[] {
  return routines[routine].exercises.map((exercise) => ({ exerciseId: exercise.id, weight: null, reps: exercise.sets, completed: false }));
}

async function fetchSessions(): Promise<WorkoutSession[]> {
  const response = await fetch("/api/sessions");
  if (!response.ok) throw new Error("No s’ha pogut carregar l’historial");
  const data = (await response.json()) as { sessions: WorkoutSession[] };
  return data.sessions;
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
      setSessions(await fetchSessions());
    } catch {
      setMessage("No s’ha pogut connectar amb l’historial. Torna-ho a provar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void fetchSessions()
      .then((loadedSessions) => {
        if (active) setSessions(loadedSessions);
      })
      .catch(() => {
        if (active) setMessage("No s’ha pogut connectar amb l’historial. Torna-ho a provar.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function switchRoutine(next: RoutineId) {
    setRoutine(next);
    setMessage("");
    setNotes("");
    if (next === "RUN") {
      setDuration("65");
      setRpe("5");
      setResults([]);
      return;
    }
    setDuration(next === "C" ? "30" : "35");
    setRpe(next === "C" ? "7" : "6");
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

  const weeklyProgress = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    const day = (now.getDay() + 6) % 7;
    monday.setDate(now.getDate() - day);
    monday.setHours(0, 0, 0, 0);
    const thisWeek = sessions.filter((session) => new Date(`${session.sessionDate}T12:00:00`) >= monday);
    return {
      base: thisWeek.filter((session) => session.routine !== "C").length,
      express: thisWeek.filter((session) => session.routine === "C").length,
    };
  }, [sessions]);

  const progressSummary = useMemo(() => {
    const tracked = progressRows.filter((row) => row.latest !== null);
    const improved = tracked.filter((row) => row.previous !== null && Number(row.latest) > Number(row.previous)).length;
    const atBest = tracked.filter((row) => row.previous !== null && row.latest === row.best).length;
    return { tracked: tracked.length, improved, atBest };
  }, [progressRows]);

  const activeExercises = routine === "RUN" ? [] : routines[routine].exercises;

  return (
    <main id="top">
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
        <div className="week-counter"><strong>{Math.min(weeklyProgress.base, 3)}/3</strong><span>aquesta setmana</span>{weeklyProgress.express > 0 && <em>+{weeklyProgress.express} Express</em>}</div>
      </header>

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
              <p>Tres sessions base i un Full Body C Express opcional per a les setmanes en què et vingui de gust sumar.</p>
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
                <div><small>DISSABTE O DIUMENGE</small><strong>Running lliure</strong><p>50–80 min · registre amb Suunto / Strava</p></div>
                <span className="arrow">↗</span>
              </button>
              <button className={routine === "C" ? "schedule-card selected express" : "schedule-card"} onClick={() => switchRoutine("C")}>
                <span className="day-index">+</span>
                <div><small>OPCIONAL · QUAN ET VAGI BÉ</small><strong>Full Body C · Express</strong><p>30 min · sense running · 8 exercicis</p></div>
                <span className="arrow">↗</span>
              </button>
            </div>

            <aside className="run-note">
              <span>RUNNING</span>
              <p><strong>Entrenament completament lliure.</strong> Guarda ritme, distància, desnivell i recorregut a Suunto i Strava; aquí només cal que desis la sessió si vols que compti al teu 3/3.</p>
            </aside>
          </section>

          <section className="log-panel" aria-labelledby="log-title">
            <div className="log-title-row">
              <div>
                <p className="eyebrow">REGISTRA LA SESSIÓ</p>
                <h2 id="log-title">{routineLabel(routine)}</h2>
              </div>
              <span className={`routine-badge ${routine === "A" ? "lime" : routine === "B" ? "orange" : routine === "C" ? "express" : "cream"}`}>{routine === "RUN" ? "03" : routine}</span>
            </div>

            <form onSubmit={saveWorkout}>
              <div className="session-meta">
                <label>Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
                <label>Durada<input type="number" min="1" max="240" inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value)} /><span>min</span></label>
                <label>RPE<input type="number" min="1" max="10" inputMode="numeric" value={rpe} onChange={(event) => setRpe(event.target.value)} /><span>/ 10</span></label>
              </div>

              {routine !== "RUN" && (
                <div className="exercise-log">
                  {routine === "C" && <div className="express-instructions"><strong>Circuit Express</strong><span>Fes 2–3 rondes · 20–30 s entre exercicis · 60 s entre rondes</span></div>}
                  <div className="exercise-log-head"><span>Exercici</span><span>Pes</span><span>Fet</span></div>
                  {activeExercises.map((exercise, index) => {
                    const result = results.find((entry) => entry.exerciseId === exercise.id);
                    return (
                      <div className="exercise-entry" key={exercise.id}>
                        <button type="button" className="exercise-name" onClick={() => setSelectedExercise(exercise)} aria-label={`Veure tècnica de ${exercise.name}`}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <div><strong>{exercise.name}</strong><small>{exercise.sets} · {exercise.note ?? `${exercise.rest} descans`}</small></div>
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
                          <span>{exercise.weighted ? "kg" : "cos"}</span>
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
                  <span className="run-orbit">50–80<br /><strong>MIN</strong></span>
                  <div><h3>Entrenament lliure</h3><p>Tu tries ritme, terreny i objectiu. El detall complet de la sessió queda registrat al teu rellotge.</p><div className="tracker-badges"><span>SUUNTO</span><span>STRAVA</span></div></div>
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
            <p>Una lectura ràpida: últim pes, canvi respecte a la sessió anterior i millor marca de cada exercici.</p>
          </div>
          {loading ? <p className="empty-state">Carregant el teu historial...</p> : sessions.length === 0 ? (
            <div className="empty-state"><strong>Encara no hi ha sessions.</strong><p>Desa el primer entrenament i aquí veuràs com evoluciona cada exercici.</p></div>
          ) : (
            <>
              <div className="progress-summary">
                <div><span>Sessions</span><strong>{sessions.length}</strong><small>registrades</small></div>
                <div><span>Exercicis</span><strong>{progressSummary.tracked}</strong><small>amb pes guardat</small></div>
                <div className="positive"><span>Han pujat</span><strong>{progressSummary.improved}</strong><small>des de l’última sessió</small></div>
                <div><span>En millor marca</span><strong>{progressSummary.atBest}</strong><small>ara mateix</small></div>
              </div>
              <div className="progress-layout">
                <div className="progress-groups">
                  <ProgressGroup title="Full Body A" day="Dimarts" accent="lime" rows={progressRows.filter((row) => exercisesA.some((exercise) => exercise.id === row.exercise.id))} onOpen={setSelectedExercise} />
                  <ProgressGroup title="Full Body B" day="Dijous" accent="orange" rows={progressRows.filter((row) => exercisesB.some((exercise) => exercise.id === row.exercise.id))} onOpen={setSelectedExercise} />
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
            </>
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
            <div>
              <p className="guide-label"><span className="dot express" /> EXPRESS · OPCIONAL</p>
              {exercisesC.map((exercise, index) => <ExerciseGuideCard key={exercise.id} exercise={exercise} index={index + 1} onOpen={setSelectedExercise} />)}
            </div>
          </div>
          <aside className="safety-note"><strong>Important</strong><p>La tècnica s’ha d’adaptar a la teva mobilitat i historial. Para si notes dolor agut, mareig o una sensació inusual, i consulta un professional qualificat si tens dubtes.</p></aside>
        </section>
      )}

      <footer><span>ENTRENA</span><p>Constància &gt; perfecció. Un entrenament cada vegada.</p><small>Les teves dades es guarden de forma privada a l’app.</small></footer>

      {selectedExercise && (
        <div
          className="modal-backdrop"
          role="button"
          tabIndex={0}
          aria-label="Tancar la guia de tècnica"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedExercise(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Enter" || event.key === " ") setSelectedExercise(null);
          }}
        >
          <section className="technique-modal" role="dialog" aria-modal="true" aria-labelledby="technique-title">
            <button className="modal-close" onClick={() => setSelectedExercise(null)} aria-label="Tancar">×</button>
            <p className="eyebrow">GUIA DE TÈCNICA</p>
            <h2 id="technique-title">{selectedExercise.name}</h2>
            <div className="technique-visual" style={exerciseVisual(selectedExercise)} role="img" aria-label={`Il·lustració de ${selectedExercise.name}`} />
            <div className="modal-meta"><span>{selectedExercise.sets}</span><span>{selectedExercise.rest} descans</span><span>{selectedExercise.focus}</span></div>
            <div className="technique-step"><span>01</span><div><h3>Posició inicial</h3><p>{selectedExercise.setup}</p></div></div>
            <div className="technique-step"><span>02</span><div><h3>Execució</h3><p>{selectedExercise.execution}</p></div></div>
            <div className="modal-columns">
              <div><h3>Punts clau</h3><ul>{selectedExercise.cues.map((cue) => <li key={cue}>{cue}</li>)}</ul></div>
              <div className="mistakes"><h3>Evita això</h3><ul>{selectedExercise.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></div>
            </div>
            <div className="alternatives-block">
              <div><p className="eyebrow">{selectedExercise.id.startsWith("express-") ? "SI VOLS CANVIAR-LO" : "SI ESTÀ OCUPAT"}</p><h3>Alternatives equivalents</h3></div>
              <div className="alternatives-grid">{alternatives[selectedExercise.id].map((alternative, index) => (
                <div key={alternative.name}><span>0{index + 1}</span><strong>{alternative.name}</strong><p>{alternative.note}</p></div>
              ))}</div>
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
      <span className="guide-thumb" style={exerciseVisual(exercise)}><i>{String(index).padStart(2, "0")}</i></span>
      <div className="guide-card-copy"><strong>{exercise.name}</strong><small>{exercise.sets} · {exercise.focus}</small><em>2 alternatives disponibles</em></div>
      <b>Veure tècnica →</b>
    </button>
  );
}

type ProgressRow = { exercise: Exercise; latest: number | null; previous: number | null; best: number | null; values: { weight: number; date: string }[] };

function ProgressGroup({ title, day, accent, rows, onOpen }: { title: string; day: string; accent: "lime" | "orange"; rows: ProgressRow[]; onOpen: (exercise: Exercise) => void }) {
  return (
    <section className="progress-group">
      <div className="progress-group-title"><span className={`dot ${accent}`} /><div><strong>{title}</strong><small>{day}</small></div></div>
      <div className="progress-cards">
        {rows.map(({ exercise, latest, previous, best, values }) => {
          const delta = latest !== null && previous !== null ? latest - previous : null;
          const max = Math.max(...values.map((value) => value.weight), 1);
          return (
            <button className="progress-card" key={exercise.id} onClick={() => onOpen(exercise)}>
              <div className="progress-card-top"><strong>{exercise.shortName}</strong><span>{exercise.sets}</span></div>
              <div className="progress-number"><strong>{latest ?? "—"}</strong><span>{latest === null ? "sense registre" : "kg · últim pes"}</span></div>
              <div className="progress-compare">
                <span>Anterior <b>{previous === null ? "—" : `${previous} kg`}</b></span>
                <span>Canvi <b className={delta !== null && delta > 0 ? "up" : delta !== null && delta < 0 ? "down" : ""}>{delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta} kg`}</b></span>
                <span>Millor <b>{best === null ? "—" : `${best} kg`}</b></span>
              </div>
              <div className="clear-trend" aria-label="Evolució de les últimes sessions">
                {values.length ? values.map((value, index) => <i key={`${value.date}-${index}`} title={`${displayDate(value.date)}: ${value.weight} kg`} style={{ height: `${Math.max(12, (value.weight / max) * 100)}%` }} />) : <span>Desa una sessió per començar el gràfic</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

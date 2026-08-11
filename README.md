# ENTRENA

App personal d’entrenament per seguir un pla de tres dies per setmana:

- Dimarts: 15 minuts de running suau + Full Body A
- Dijous: 15 minuts de running suau + Full Body B
- Dissabte o diumenge: 30–45 minuts de running suau

Permet registrar el pes utilitzat a cada exercici, marcar les sèries completades, guardar RPE, durada i notes, consultar l’historial i veure el progrés. També inclou una guia tècnica detallada per a tots els exercicis de força.

## Desenvolupament local

Requisits: Node.js 22.13 o superior i pnpm.

```bash
pnpm install
pnpm run dev
```

L’app s’obrirà normalment a `http://localhost:3000`.

## Base de dades

Les sessions es guarden en una base de dades D1. La configuració lògica és a `.openai/hosting.json` i l’esquema és a `db/schema.ts`.

Per generar una migració després de canviar l’esquema:

```bash
pnpm run db:generate
```

## Validació

```bash
pnpm run build
```

## GitHub

El projecte es pot guardar en un repositori GitHub com qualsevol projecte web. La versió completa necessita un entorn compatible amb Cloudflare Workers i D1; GitHub Pages, per si sol, només serveix fitxers estàtics i no executa la base de dades.

# ENTRENA

App personal d’entrenament per seguir un pla de tres dies per setmana:

- Full Body A i Full Body B com a sessions principals
- Full Body C «Express» opcional de 30 minuts
- Running lliure de 50–80 minuts, registrat amb Suunto i Strava

Permet registrar el pes utilitzat a cada exercici, marcar les sèries completades, guardar RPE, durada i notes, consultar l’historial i veure el progrés. També inclou una guia tècnica detallada per a tots els exercicis de força.

## Desenvolupament local

Requisits: Node.js 22.13 o superior i pnpm.

```bash
pnpm install
pnpm run dev
```

L’app s’obrirà normalment a `http://localhost:3000`.

## Base de dades

Les sessions es guarden en una base de dades Cloudflare D1. La configuració de desplegament és a `wrangler.jsonc` i l’esquema és a `db/schema.ts`.

Per generar una migració després de canviar l’esquema:

```bash
pnpm run db:generate
```

## Validació

```bash
pnpm run build
```

## GitHub

El codi viu al repositori privat de GitHub. La versió completa s’executa a Cloudflare Workers amb D1 i no depèn de ChatGPT ni requereix iniciar-hi sessió.

L’accés està protegit amb la variable secreta `APP_PASSWORD`. En iniciar sessió, l’app crea una cookie segura vàlida durant 30 dies; la contrasenya no es desa al navegador ni a la base de dades.

## Desplegament

Després d’autenticar Wrangler amb el compte de Cloudflare:

```bash
pnpm run deploy
```

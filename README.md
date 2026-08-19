# ENTRENA

App personal d’entrenament per seguir un pla de tres dies per setmana:

- Full Body A i Full Body B com a sessions principals
- Full Body C complementari per a running i resistència estructural
- Circuit «Express» opcional de 30 minuts
- Running lliure de 50–80 minuts, registrat amb Suunto i Strava

Permet registrar el pes utilitzat a cada exercici, marcar les sèries completades, guardar RPE, durada i notes, consultar l’historial i veure el progrés. També inclou una guia tècnica detallada per a tots els exercicis de força.

## Desenvolupament local

Requisits: Node.js 22.13 o superior i pnpm.

```bash
pnpm install
pnpm run dev
```

L’app s’obrirà normalment a `http://localhost:3000`.

## Importació des de Suunto

A l’apartat Running es pot seleccionar un entrenament `.FIT` exportat des de
Suunto. El fitxer es llegeix localment al navegador i omple automàticament la
data, la durada, la distància, el ritme, el desnivell i les pulsacions disponibles.

## Entrenador Gemini

Quan deses una sessió, el Calendari setmanal genera automàticament una valoració amb Gemini a partir de l’historial,
les càrregues, l’RPE, els FIT i els comentaris. L’app calcula les comparacions abans d’enviar-les i Gemini retorna un comentari específic de l’última sessió i una visió setmanal desplegable, amb accions mesurables. L’última valoració queda desada i torna a aparèixer quan obres l’app. Configura `GEMINI_API_KEY` i
`ATHLETE_PROFILE` a `.dev.vars`. La clau només s’utilitza al servidor.

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

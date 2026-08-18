import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  APP_PASSWORD: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const COOKIE_NAME = "entrena_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get("cookie") ?? "";
  for (const part of cookies.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

async function safeEqual(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([sha256(left), sha256(right)]);
  let difference = 0;
  for (let index = 0; index < leftHash.length; index += 1) {
    difference |= leftHash[index] ^ rightHash[index];
  }
  return difference === 0;
}

async function sessionToken(password: string): Promise<string> {
  const digest = await sha256(`entrena-session:${password}`);
  let binary = "";
  for (const byte of digest) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  if (!env.APP_PASSWORD) return false;
  const cookie = getCookie(request, COOKIE_NAME);
  if (!cookie) return false;
  return safeEqual(cookie, await sessionToken(env.APP_PASSWORD));
}

function sessionCookie(token: string, requestUrl: string): string {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly${secure}; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

function expiredSessionCookie(requestUrl: string): string {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly${secure}; SameSite=Strict; Max-Age=0`;
}

async function login(request: Request, env: Env): Promise<Response> {
  if (!env.APP_PASSWORD) {
    return Response.json({ error: "La contrasenya encara no està configurada." }, { status: 503 });
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return Response.json({ error: "Sol·licitud no vàlida." }, { status: 400 });
  }

  if (!password || !(await safeEqual(password, env.APP_PASSWORD))) {
    return Response.json({ error: "Contrasenya incorrecta." }, { status: 401 });
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        "cache-control": "no-store",
        "set-cookie": sessionCookie(await sessionToken(env.APP_PASSWORD), request.url),
      },
    },
  );
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/login" && request.method === "POST") {
      return login(request, env);
    }

    const authorized = await isAuthorized(request, env);

    if (url.pathname === "/api/logout") {
      return new Response(null, {
        status: 302,
        headers: {
          location: "/login",
          "set-cookie": expiredSessionCookie(request.url),
        },
      });
    }

    if (url.pathname === "/login") {
      if (authorized) return Response.redirect(new URL("/", request.url), 302);
      return handler.fetch(request, env, ctx);
    }

    if (!authorized) {
      if (url.pathname.startsWith("/api/")) {
        return Response.json({ error: "Cal introduir la contrasenya." }, { status: 401 });
      }
      return Response.redirect(new URL("/login", request.url), 302);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;

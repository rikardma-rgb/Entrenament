import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const testPassword = "test-password-only";

async function requestWorker(path = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
      ...init,
    }),
    {
      APP_PASSWORD: testPassword,
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("protects and server-renders the workout tracker", async () => {
  const anonymous = await requestWorker();
  assert.equal(anonymous.status, 302);
  assert.equal(anonymous.headers.get("location"), "http://localhost/login");

  const wrongPassword = await requestWorker("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "wrong" }),
  });
  assert.equal(wrongPassword.status, 401);

  const login = await requestWorker("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: testPassword }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie");
  assert.match(cookie ?? "", /^entrena_session=/);

  const response = await requestWorker("/", {
    headers: { accept: "text/html", cookie: cookie.split(";")[0] },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>ENTRENA — El teu pla de força<\/title>/i);
  assert.match(html, /Planificació setmanal/);
  assert.match(html, /Full Body C/);
  assert.match(html, /Full Body Express/);
  assert.match(html, /Running lliure/);
  assert.match(html, /Adjunta el FIT de l’escalfament/);
  assert.match(html, /Progrés/);
  assert.doesNotMatch(html, /codex-preview|signin-with-chatgpt/i);
});

test("uses independent Cloudflare configuration", async () => {
  const [page, packageJson, viteConfig, wranglerConfig, worker] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /ChatGPT|signin-with-chatgpt/i);
  assert.match(page, /KCAL SETMANALS/);
  assert.match(page, /KM SETMANALS/);
  assert.doesNotMatch(viteConfig, /hosting\.json|sites-vite-plugin/i);
  assert.match(packageJson, /"deploy": "vinext-cloudflare deploy"/);
  assert.match(wranglerConfig, /"binding": "DB"/);
  assert.match(wranglerConfig, /"database_name": "entrena-progress-db"/);
  assert.match(wranglerConfig, /"main": "\.\/worker\/index\.ts"/);
  assert.match(worker, /APP_PASSWORD/);
  assert.match(worker, /HttpOnly\$\{secure\}; SameSite=Strict/);
  assert.match(worker, /protocol === "https:" \? "; Secure"/);

  await Promise.all([
    access(new URL("../public/exercises-a.png", import.meta.url)),
    access(new URL("../public/exercises-b.png", import.meta.url)),
    access(new URL("../public/exercises-c.png", import.meta.url)),
  ]);
});

"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "No s’ha pogut iniciar la sessió.");
      window.location.replace("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No s’ha pogut iniciar la sessió.");
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-brand"><span className="brand-mark">E</span><span>ENTRENA</span></div>
        <p className="eyebrow">ACCÉS PERSONAL</p>
        <h1>El teu progrés,<br />només per a tu.</h1>
        <p className="login-copy">Introdueix la contrasenya de l’app. El mòbil recordarà l’accés durant 30 dies.</p>
        <form onSubmit={submit}>
          <label htmlFor="app-password">Contrasenya</label>
          <input
            id="app-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading || !password}>
            <span>{loading ? "Comprovant…" : "Entrar"}</span><span>→</span>
          </button>
        </form>
        <small>Sense ChatGPT · Dades guardades al teu Cloudflare</small>
      </section>
      <aside className="login-visual" aria-hidden="true">
        <span>03</span><strong>DIES</strong><i>FORÇA · RUNNING · PROGRÉS</i>
      </aside>
    </main>
  );
}

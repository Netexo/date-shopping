"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminLogin() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: new FormData(form).get("password") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Anmeldung fehlgeschlagen.");
      form.reset();
      // A full navigation makes the server check the new session before rendering.
      window.location.replace("/admin");
    } catch (failure) {
      setError(failure.message || "Keine Verbindung zum Server. Bitte versuche es erneut.");
      setBusy(false);
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-nav"><Link href="/">DATE SHOPPING</Link><span>PRIVATE / ADMIN</span></header>
      <div className="admin-content admin-centered">
        <section className="admin-login" aria-labelledby="admin-title">
          <h1 id="admin-title">Admin Dashboard</h1>
          <p>Melde dich mit deinem Admin-Passwort an.</p>
          <form onSubmit={login}>
            <label>Passwort<input name="password" type="password" required autoComplete="current-password" maxLength={1024} /></label>
            {error && <p className="admin-error" role="alert">{error}</p>}
            <button type="submit" className="admin-button" disabled={busy}>{busy ? "ANMELDEN …" : "ANMELDEN"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}

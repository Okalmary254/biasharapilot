import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

const input =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-gold";

export default function AuthPage() {
  const { session } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ email: "", password: "", name: "" });
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setInfo("");

    if (mode === "login") {
      const { error } = await neon.auth.signInWithPassword({
        email: f.email,
        password: f.password,
      });
      if (error) setErr(error.message);
    } else {
      const { error } = await neon.auth.signUp({
        email: f.email,
        password: f.password,
        options: { data: { displayName: f.name.trim() || f.email.split("@")[0] } },
      });
      if (error) setErr(error.message);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-midnight flex flex-col justify-center px-6">
      <h1 className="text-3xl font-bold text-white">
        Biashara<span className="text-gold">Pilot</span> AI
      </h1>
      <p className="mb-8 text-white/60">Run your business smarter.</p>

      <form onSubmit={submit} className="space-y-3">
        {mode === "register" && (
          <>
            <input
              className={input}
              placeholder="Full name"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
          </>
        )}
        <input
          className={input}
          type="email"
          placeholder="Email"
          required
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
        />
        <input
          className={input}
          type="password"
          placeholder="Password (min 8 characters)"
          required
          minLength={8}
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
        />
        {err && <p className="text-sm text-red-400">{err}</p>}
        {info && <p className="text-sm text-emerald-300">{info}</p>}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-emerald py-3 font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <button
        className="mt-4 text-sm text-gold"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setErr("");
          setInfo("");
        }}
      >
        {mode === "login" ? "New here? Register" : "Have an account? Log in"}
      </button>
    </div>
  );
}

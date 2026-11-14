import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

const field = "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-midnight outline-none placeholder:text-slate-400 focus:border-emerald focus:ring-2 focus:ring-emerald/10";

export default function AuthPage() {
  const { session, syncSession } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  if (session) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "login") {
        const { error: e } = await neon.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
        if (e) setError(e.message);
        else if (await syncSession()) navigate("/", { replace: true });
      } else {
        const { data, error: e } = await neon.auth.signUp({
          email: form.email.trim(), password: form.password,
          options: {
            data: { name: form.name.trim(), displayName: form.name.trim() },
          },
        });
        if (e) setError(e.message);
        else if (!data.session) {
          setNotice("Your account was created. You can now sign in with your email and password.");
          setMode("login");
          setForm(current => ({ ...current, password: "" }));
        } else {
          setNotice("Account created successfully. Redirecting…");
          await syncSession();
          navigate("/", { replace: true });
        }
      }
    } catch { setError("We couldn't complete that request. Check your connection and try again."); }
    finally { setBusy(false); }
  };
  const switchMode = (m: "login" | "register") => { setMode(m); setError(""); setNotice(""); };

  const signInWithGoogle = async () => {
    setGoogleBusy(true); setError(""); setNotice("");
    try {
      const { error: oauthError } = await neon.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (oauthError) setError(oauthError.message);
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : "Google sign-in could not be started. Please try again.");
    } finally {
      setGoogleBusy(false);
    }
  };

  return <main className="min-h-screen bg-cloud lg:grid lg:grid-cols-[1.05fr_.95fr]">
    <section className="relative hidden overflow-hidden bg-midnight p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-28 -top-28 size-96 rounded-full border border-white/10"/><div className="absolute -bottom-40 -left-20 size-[30rem] rounded-full border border-gold/20"/>
      <div className="relative flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-emerald text-xl font-black text-gold">B</div><span className="text-xl font-bold">Biashara<span className="text-gold">Pilot</span> AI</span></div>
      <div className="relative max-w-xl"><span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-gold"><Sparkles size={14}/> Your business, in control</span><h1 className="text-5xl font-bold leading-tight">Make every business decision count.</h1><p className="mt-5 max-w-md text-base leading-7 text-white/65">Track sales, stock, customers and expenses — with practical AI insights to help you grow.</p></div>
      <p className="relative text-xs text-white/40">Built for the ambition of Kenyan businesses.</p>
    </section>
    <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="grid size-10 place-items-center rounded-xl bg-midnight text-lg font-black text-gold">B</div><span className="text-lg font-bold text-midnight">Biashara<span className="text-emerald">Pilot</span> AI</span></div>
        <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-emerald">{mode === "login" ? "Welcome back" : "Get started"}</p><h2 className="text-3xl font-bold tracking-tight text-midnight">{mode === "login" ? "Sign in to your account" : "Create your account"}</h2><p className="mt-2 text-sm text-slate-500">{mode === "login" ? "Pick up where you left off." : "A smarter way to run your business starts here."}</p></div>
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => switchMode("login")} className={`rounded-lg py-2.5 text-sm font-semibold ${mode === "login" ? "bg-white text-midnight shadow-sm" : "text-slate-500"}`}>Sign in</button><button type="button" onClick={() => switchMode("register")} className={`rounded-lg py-2.5 text-sm font-semibold ${mode === "register" ? "bg-white text-midnight shadow-sm" : "text-slate-500"}`}>Register</button></div>
        <button type="button" onClick={() => void signInWithGoogle()} disabled={busy || googleBusy} className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-midnight shadow-sm transition hover:bg-slate-50 disabled:opacity-60"><span className="grid size-5 place-items-center rounded-full border border-slate-200 text-sm font-bold text-[#4285F4]">G</span>{googleBusy ? "Connecting to Google…" : "Continue with Google"}</button>
        <div className="mb-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200"/><span className="text-xs text-slate-400">or continue with email</span><span className="h-px flex-1 bg-slate-200"/></div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span><span className="relative block"><UserRound className="absolute left-3.5 top-3.5 text-slate-400" size={17}/><input className={field} autoComplete="name" placeholder="Your full name" required minLength={2} value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></span></label>}
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Email address</span><span className="relative block"><Mail className="absolute left-3.5 top-3.5 text-slate-400" size={17}/><input className={field} type="email" autoComplete="email" placeholder="you@example.com" required value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></span></label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span><span className="relative block"><LockKeyhole className="absolute left-3.5 top-3.5 text-slate-400" size={17}/><input className={field+" pr-12"} type={visible?"text":"password"} autoComplete={mode==="login"?"current-password":"new-password"} placeholder="At least 8 characters" required minLength={8} value={form.password} onChange={e => setForm({...form,password:e.target.value})}/><button type="button" aria-label={visible?"Hide password":"Show password"} onClick={()=>setVisible(v=>!v)} className="absolute right-3 top-3 text-slate-400">{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald/10 px-3 py-2.5 text-sm text-emerald">{notice}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald/90 disabled:opacity-60">{busy?"Please wait…":mode==="login"?"Sign in":"Create account"}{!busy&&<ArrowRight size={17}/>}</button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500">{mode==="login"?"New to BiasharaPilot?":"Already have an account?"} <button type="button" onClick={()=>switchMode(mode==="login"?"register":"login")} className="font-semibold text-emerald hover:underline">{mode==="login"?"Create an account":"Sign in instead"}</button></p>
        <p className="mt-10 text-center text-xs leading-5 text-slate-400">Keep your password private. BiasharaPilot will never ask you to share it.</p>
      </div>
    </section>
  </main>;
}

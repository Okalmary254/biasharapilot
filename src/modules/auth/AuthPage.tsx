import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound, ShieldCheck } from "lucide-react";
import { neon, authClient } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

const field = "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-midnight outline-none placeholder:text-slate-400 focus:border-emerald focus:ring-2 focus:ring-emerald/10";

type AuthError = { message?: string; code?: string };
type EmailOtpClient = {
  emailOtp: {
    sendVerificationOtp: (input: { email: string; type: "email-verification" }) => Promise<{ error: AuthError | null }>;
    verifyEmail: (input: { email: string; otp: string }) => Promise<{ data?: unknown; error: AuthError | null }>;
  };
};
const emailOtpClient = authClient as unknown as EmailOtpClient;

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Authentication request failed. Please try again.";
}

function isEmailVerificationError(error: unknown): boolean {
  const value = typeof error === "object" && error !== null
    ? error as { message?: unknown; code?: unknown }
    : {};
  const text = [value.message, value.code].filter(Boolean).join(" ").toLowerCase();
  return text.includes("email_not_verified") || text.includes("email not verified") || text.includes("email is not verified") || text.includes("verify your email");
}

export default function AuthPage() {
  const { session, syncSession } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  if (session) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "login") {
        const { error: authError } = await neon.auth.signIn.email({ email: form.email.trim(), password: form.password });
        if (authError) {
          if (isEmailVerificationError(authError)) {
            setVerificationStep(true);
            setNotice("We've sent a verification code to your email. Enter it below to finish signing in.");
          } else {
            setError(errorMessage(authError));
          }
        } else if (await syncSession()) {
          navigate("/", { replace: true });
        } else {
          setError("Sign-in succeeded, but your session could not be loaded. Please try again.");
        }
      } else {
        const { error: authError } = await neon.auth.signUp.email({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        if (authError) setError(errorMessage(authError));
        else if (!(await syncSession())) {
          setNotice("Your account was created. Sign in with your email and password; we'll ask you to verify your email before opening your workspace.");
          setMode("login");
          setForm(current => ({ ...current, password: "" }));
        } else {
          setNotice("Account created successfully. Redirecting…");
          navigate("/", { replace: true });
        }
      }
    } catch (authError) {
      console.error("[BiasharaPilot auth] Request failed", { origin: window.location.origin, mode, error: authError });
      setError(errorMessage(authError));
    } finally {
      setBusy(false);
    }
  };

  const verifyEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVerifyBusy(true); setError(""); setNotice("");
    try {
      const { error: verifyError } = await emailOtpClient.emailOtp.verifyEmail({
        email: form.email.trim(),
        otp: verificationCode.trim(),
      });
      if (verifyError) throw verifyError;
      if (await syncSession()) {
        navigate("/", { replace: true });
        return;
      }
      const { error: signInError } = await neon.auth.signIn.email({
        email: form.email.trim(),
        password: form.password,
      });
      if (signInError) throw signInError;
      if (await syncSession()) navigate("/", { replace: true });
      else setError("Your email is verified, but we couldn't restore your session. Please sign in again.");
    } catch (verificationError) {
      setError(errorMessage(verificationError));
    } finally {
      setVerifyBusy(false);
    }
  };

  const resendCode = async () => {
    setResendBusy(true); setError(""); setNotice("");
    try {
      const { error: resendError } = await emailOtpClient.emailOtp.sendVerificationOtp({
        email: form.email.trim(),
        type: "email-verification",
      });
      if (resendError) throw resendError;
      setNotice("A new verification code has been sent. Check your inbox and spam folder.");
    } catch (resendError) {
      setError(errorMessage(resendError));
    } finally {
      setResendBusy(false);
    }
  };

  const startVerification = async () => {
    if (!form.email.trim()) {
      setError("Enter your email address first, then request a verification code.");
      return;
    }
    setResendBusy(true); setError(""); setNotice("");
    try {
      const { error: sendError } = await emailOtpClient.emailOtp.sendVerificationOtp({
        email: form.email.trim(),
        type: "email-verification",
      });
      if (sendError) throw sendError;
      setVerificationStep(true);
      setVerificationCode("");
      setNotice("A verification code has been sent. Enter it below to continue.");
    } catch (sendError) {
      setError(errorMessage(sendError));
    } finally {
      setResendBusy(false);
    }
  };

  const switchMode = (nextMode: "login" | "register") => {
    setMode(nextMode); setVerificationStep(false); setVerificationCode(""); setError(""); setNotice("");
  };

  const signInWithGoogle = async () => {
    setGoogleBusy(true); setError(""); setNotice("");
    try {
      const { error: oauthError } = await neon.auth.signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      });
      if (oauthError) setError(errorMessage(oauthError));
    } catch (oauthError) {
      setError(errorMessage(oauthError));
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
        <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-emerald">{verificationStep ? "Account security" : mode === "login" ? "Welcome back" : "Get started"}</p><h2 className="text-3xl font-bold tracking-tight text-midnight">{verificationStep ? "Verify your email" : mode === "login" ? "Sign in to your account" : "Create your account"}</h2><p className="mt-2 text-sm text-slate-500">{verificationStep ? "Enter the one-time code sent to your email address to continue." : mode === "login" ? "Pick up where you left off." : "A smarter way to run your business starts here."}</p></div>
        {!verificationStep && <>
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => switchMode("login")} className={`rounded-lg py-2.5 text-sm font-semibold ${mode === "login" ? "bg-white text-midnight shadow-sm" : "text-slate-500"}`}>Sign in</button><button type="button" onClick={() => switchMode("register")} className={`rounded-lg py-2.5 text-sm font-semibold ${mode === "register" ? "bg-white text-midnight shadow-sm" : "text-slate-500"}`}>Register</button></div>
          <button type="button" onClick={() => void signInWithGoogle()} disabled={busy || googleBusy} className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-midnight shadow-sm transition hover:bg-slate-50 disabled:opacity-60"><span className="grid size-5 place-items-center rounded-full border border-slate-200 text-sm font-bold text-[#4285F4]">G</span>{googleBusy ? "Connecting to Google…" : "Continue with Google"}</button>
          <div className="mb-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200"/><span className="text-xs text-slate-400">or continue with email</span><span className="h-px flex-1 bg-slate-200"/></div>
        </>}
        {verificationStep ? <form onSubmit={verifyEmail} className="space-y-4">
          <div className="rounded-xl border border-emerald/15 bg-emerald/5 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-midnight"><ShieldCheck size={17} className="text-emerald"/> Verification required</div><p className="mt-1 text-xs text-slate-500">Code sent to <strong>{form.email}</strong></p></div>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Email verification code</span><span className="relative block"><Mail className="absolute left-3.5 top-3.5 text-slate-400" size={17}/><input className={field} inputMode="numeric" autoComplete="one-time-code" placeholder="Enter your code" required value={verificationCode} onChange={e=>setVerificationCode(e.target.value)}/></span></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald/10 px-3 py-2.5 text-sm text-emerald">{notice}</p>}
          <button disabled={verifyBusy || !verificationCode.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald py-3.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60">{verifyBusy?"Verifying…":"Verify email & continue"}{!verifyBusy&&<ArrowRight size={17}/>}</button>
          <button type="button" disabled={resendBusy} onClick={()=>void resendCode()} className="w-full py-2 text-sm font-semibold text-emerald disabled:opacity-50">{resendBusy?"Sending a new code…":"Resend verification code"}</button>
          <button type="button" onClick={()=>{setVerificationStep(false);setVerificationCode("");setError("");setNotice("");}} className="w-full py-2 text-xs font-medium text-slate-500 hover:text-midnight">Back to sign in</button>
        </form> : <form onSubmit={submit} className="space-y-4">
          {mode === "register" && <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span><span className="relative block"><UserRound className="absolute left-3.5 top-3.5 text-slate-400" size={17}/><input className={field} autoComplete="name" placeholder="Your full name" required minLength={2} value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></span></label>}
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Email address</span><span className="relative block"><Mail className="absolute left-3.5 top-3.5 text-slate-400" size={17}/><input className={field} type="email" autoComplete="email" placeholder="you@example.com" required value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></span></label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span><span className="relative block"><LockKeyhole className="absolute left-3.5 top-3.5 text-slate-400" size={17}/><input className={field+" pr-12"} type={visible?"text":"password"} autoComplete={mode==="login"?"current-password":"new-password"} placeholder="At least 8 characters" required minLength={8} value={form.password} onChange={e => setForm({...form,password:e.target.value})}/><button type="button" aria-label={visible?"Hide password":"Show password"} onClick={()=>setVisible(v=>!v)} className="absolute right-3 top-3 text-slate-400">{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald/10 px-3 py-2.5 text-sm text-emerald">{notice}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald/90 disabled:opacity-60">{busy?"Please wait…":mode==="login"?"Sign in":"Create account"}{!busy&&<ArrowRight size={17}/>}</button>
        </form>}
        {!verificationStep && mode === "login" && <button type="button" onClick={() => void startVerification()} disabled={resendBusy || busy || !form.email.trim()} className="mt-4 w-full rounded-xl border border-emerald/20 bg-emerald/5 py-3 text-sm font-semibold text-emerald hover:bg-emerald/10 disabled:opacity-50">{resendBusy ? "Sending verification code…" : "Need to verify your email? Enter a code"}</button>}
        {!verificationStep && <p className="mt-7 text-center text-sm text-slate-500">{mode==="login"?"New to BiasharaPilot?":"Already have an account?"} <button type="button" onClick={()=>switchMode(mode==="login"?"register":"login")} className="font-semibold text-emerald hover:underline">{mode==="login"?"Create an account":"Sign in instead"}</button></p>}
        <p className="mt-10 text-center text-xs leading-5 text-slate-400">Keep your password private. BiasharaPilot will never ask you to share it.</p>
      </div>
    </section>
  </main>;
}

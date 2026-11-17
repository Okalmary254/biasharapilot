import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

const field = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3";
const types = ["Retail shop", "Wholesale", "Salon / Barber", "Food & Beverage", "Services", "Other"];

function BackHomeButton() {
  const nav = useNavigate();
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center border-t border-gray-200 bg-white/95 px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
      <button
        type="button"
        onClick={() => nav("/", { replace: true })}
        className="w-full max-w-sm rounded-xl bg-emerald px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald/20 transition hover:bg-emerald/90 focus:outline-none focus:ring-4 focus:ring-emerald/20"
      >
        Back to home
      </button>
    </div>
  );
}

export default function Onboarding() {
  const { refreshBusiness, businessId } = useAuth();
  const [name, setName] = useState("");
  const [type, setType] = useState(types[0]);
  const [county, setCounty] = useState("Nairobi");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  // Only show the completion screen immediately after this visit creates a business.
  const [justCompleted, setJustCompleted] = useState(false);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { error } = await neon.rpc("create_business", {
        p_name: name,
        p_type: type,
        p_county: county,
        p_phone: phone.trim() || null,
      });
      if (error) {
        setErr(error.message);
        return;
      }
      await refreshBusiness();
      setJustCompleted(true);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "We couldn't finish setting up your business. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Returning business owners continue directly to the dashboard on sign-in.
  if (businessId && !justCompleted) return <Navigate to="/" replace />;

  if (businessId && justCompleted) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-cloud p-6 pb-28 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-emerald/10 text-emerald text-2xl font-bold">✓</div>
      <h2 className="text-2xl font-bold text-midnight">Your business is ready</h2>
      <p className="max-w-sm text-sm text-slate-500">Your workspace has been set up. Continue to your dashboard to start managing sales, stock and customers.</p>
      <BackHomeButton />
    </main>
  );

  return (
    <main className="min-h-screen bg-cloud px-6 py-6 pb-28">
      <form onSubmit={create} className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg flex-col justify-center gap-3">
        <h2 className="text-2xl font-bold text-midnight">Set up your business</h2>
        <p className="text-sm text-gray-500">Tell us a little so we can tailor BiasharaPilot to you.</p>
        <input className={field} placeholder="Business name" required value={name} onChange={(e) => setName(e.target.value)} />
        <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input className={field} placeholder="Your phone (07...)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className={field} placeholder="County" value={county} onChange={(e) => setCounty(e.target.value)} />
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button type="submit" disabled={busy} className="rounded-xl bg-emerald py-3 font-semibold text-white disabled:opacity-60">
          {busy ? "Creating..." : "Continue"}
        </button>
      </form>
      <BackHomeButton />
    </main>
  );
}

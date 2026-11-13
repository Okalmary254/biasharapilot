import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

const field = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3";
const types = ["Retail shop", "Wholesale", "Salon / Barber", "Food & Beverage", "Services", "Other"];

export default function Onboarding() {
  const { refreshBusiness } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState(types[0]);
  const [county, setCounty] = useState("Nairobi");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await neon.rpc("create_business", {
      p_name: name,
      p_type: type,
      p_county: county,
      p_phone: phone.trim() || null,
    });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    await refreshBusiness();
    nav("/", { replace: true });
  };

  return (
    <form onSubmit={create} className="min-h-screen bg-cloud p-6 flex flex-col justify-center gap-3">
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
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={busy} className="rounded-xl bg-emerald py-3 font-semibold text-white disabled:opacity-60">
        {busy ? "Creating..." : "Continue"}
      </button>
    </form>
  );
}

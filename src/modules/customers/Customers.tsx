import { useCallback, useEffect, useState } from "react";
import { Search, UserRound, UserPlus } from "lucide-react";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

type Customer = { id: string; full_name: string; phone: string | null; email: string | null; created_at: string };
const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald";

export default function Customers() {
  const { businessId } = useAuth();
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data, error: e } = await neon.from("customers").select("id,full_name,phone,email,created_at").eq("business_id", businessId).order("created_at", { ascending: false });
    if (e) setError(e.message); else { setItems((data ?? []) as Customer[]); setError(""); }
    setLoading(false);
  }, [businessId]);
  useEffect(() => { void load(); }, [load]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!businessId) return;
    setSaving(true); setError("");
    const { error: e } = await neon.from("customers").insert({ business_id: businessId, full_name: form.full_name.trim(), phone: form.phone.trim() || null, email: form.email.trim() || null });
    if (e) setError(e.message); else { setForm({ full_name: "", phone: "", email: "" }); setOpen(false); await load(); }
    setSaving(false);
  };
  const filtered = items.filter((c) => `${c.full_name} ${c.phone ?? ""} ${c.email ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  return <main className="space-y-4 p-4">
    <header className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald">Relationships</p><h1 className="text-2xl font-bold text-midnight">Customers</h1><p className="text-sm text-slate-500">{items.length} saved customers</p></div><button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-xl bg-emerald px-3 py-3 text-sm font-semibold text-white"><UserPlus size={17} /> Add</button></header>
    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><Search size={18} className="text-slate-400" /><input className="w-full py-3 text-sm outline-none" placeholder="Search customers" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
    {open && <form onSubmit={save} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"><h2 className="font-semibold text-midnight">Add customer</h2><input className={field} placeholder="Full name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /><input className={field} placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><input className={field} type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><div className="flex gap-2"><button disabled={saving} className="flex-1 rounded-xl bg-midnight py-3 text-sm font-semibold text-white">{saving ? "Saving…" : "Save customer"}</button><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 text-sm">Cancel</button></div></form>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading customers…</p> : filtered.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center"><UserRound className="mx-auto mb-2 text-slate-300" size={30} /><p className="font-medium text-midnight">No customers yet</p><p className="mt-1 text-sm text-slate-500">Save customer contacts here for easier follow-up.</p></div> : <section className="space-y-2">{filtered.map((c) => <article key={c.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald/10 font-semibold text-emerald">{c.full_name.slice(0,1).toUpperCase()}</div><div className="min-w-0"><h2 className="truncate font-semibold text-midnight">{c.full_name}</h2><p className="truncate text-xs text-slate-500">{c.phone || c.email || "No contact details"}</p></div></article>)}</section>}
  </main>;
}

import { useCallback, useEffect, useState } from "react";
import { Plus, ReceiptText, Wallet } from "lucide-react";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

type Expense = { id: string; category: string; description: string | null; amount: number | string; expense_date: string; payment_method: string | null };
const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald";
const kes = (n: number | string) => `KSh ${Number(n).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
const categories = ["Rent", "Transport", "Utilities", "Salaries", "Stock purchases", "Marketing", "Other"];

export default function Expenses() {
  const { businessId } = useAuth();
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: categories[0], description: "", amount: "", expense_date: new Date().toISOString().slice(0,10), payment_method: "cash" });

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data, error: e } = await neon.from("expenses").select("id,category,description,amount,expense_date,payment_method").eq("business_id", businessId).order("expense_date", { ascending: false }).limit(100);
    if (e) setError(e.message); else { setItems((data ?? []) as Expense[]); setError(""); }
    setLoading(false);
  }, [businessId]);
  useEffect(() => { void load(); }, [load]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!businessId) return;
    setSaving(true); setError("");
    const { error: e } = await neon.from("expenses").insert({ business_id: businessId, category: form.category, description: form.description.trim() || null, amount: Number(form.amount), expense_date: form.expense_date, payment_method: form.payment_method });
    if (e) setError(e.message); else { setForm({ category: categories[0], description: "", amount: "", expense_date: new Date().toISOString().slice(0,10), payment_method: "cash" }); setOpen(false); await load(); }
    setSaving(false);
  };
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);

  return <main className="space-y-4 p-4">
    <header className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald">Cash flow</p><h1 className="text-2xl font-bold text-midnight">Expenses</h1><p className="text-sm text-slate-500">Recent business spending</p></div><button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-xl bg-emerald px-3 py-3 text-sm font-semibold text-white"><Plus size={17} /> Add</button></header>
    <section className="rounded-2xl bg-midnight p-5 text-white"><div className="flex items-center gap-2 text-white/60"><Wallet size={17} /><span className="text-sm">Total in latest 100 records</span></div><p className="mt-2 text-3xl font-bold text-gold">{kes(total)}</p></section>
    {open && <form onSubmit={save} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"><h2 className="font-semibold text-midnight">Record expense</h2><select className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select><input className={field} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><input className={field} type="number" min="0.01" step="0.01" placeholder="Amount (KES)" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /><input className={field} type="date" required value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /><select className={field} value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}><option value="cash">Cash</option><option value="mpesa">M-Pesa</option><option value="bank">Bank</option><option value="card">Card</option><option value="other">Other</option></select><div className="flex gap-2"><button disabled={saving} className="flex-1 rounded-xl bg-midnight py-3 text-sm font-semibold text-white">{saving ? "Saving…" : "Save expense"}</button><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 text-sm">Cancel</button></div></form>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading expenses…</p> : items.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center"><ReceiptText className="mx-auto mb-2 text-slate-300" size={30} /><p className="font-medium text-midnight">No expenses recorded</p><p className="mt-1 text-sm text-slate-500">Record your first business expense.</p></div> : <section className="space-y-2">{items.map((item) => <article key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm"><div className="min-w-0"><h2 className="font-semibold text-midnight">{item.category}</h2><p className="truncate text-xs text-slate-500">{item.description || item.expense_date} · {item.payment_method || "Unspecified"}</p></div><p className="shrink-0 font-semibold text-midnight">{kes(item.amount)}</p></article>)}</section>}
  </main>;
}

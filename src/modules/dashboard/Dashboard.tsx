import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Boxes, CircleDollarSign, ShoppingBag, Users, Wallet, Sparkles, ArrowRight, Building2, Printer, ScanBarcode } from "lucide-react";
import { Link } from "react-router-dom";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

const kes = (n: number) => `KSh ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

type BusinessSummary = { name: string; business_type: string | null; county: string | null };

export default function Dashboard() {
  const { businessId, session } = useAuth();
  const [sales, setSales] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [customers, setCustomers] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [firstName, setFirstName] = useState("there");
  const [business, setBusiness] = useState<BusinessSummary|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId || !session?.user.id) return;
    let active = true;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, "0");
    const d = String(start.getDate()).padStart(2, "0");
    const today = `${y}-${m}-${d}`;

    Promise.all([
      neon.from("sales").select("total").eq("business_id", businessId).eq("status", "completed").gte("sold_at", start.toISOString()),
      neon.from("expenses").select("amount").eq("business_id", businessId).eq("expense_date", today),
      neon.from("customers").select("id", { count: "exact", head: true }).eq("business_id", businessId),
      neon.from("products").select("stock_quantity, low_stock_threshold").eq("business_id", businessId).eq("is_active", true),
      neon.from("profiles").select("full_name").eq("id", session.user.id).maybeSingle(),
      neon.from("businesses").select("name,business_type,county").eq("id", businessId).maybeSingle(),
    ]).then(([s, e, c, p, profile, businessResult]) => {
      if (!active) return;
      setSales((s.data ?? []).reduce((sum, row) => sum + Number(row.total), 0));
      setExpenses((e.data ?? []).reduce((sum, row) => sum + Number(row.amount), 0));
      setCustomers(c.count ?? 0);
      setLowStock((p.data ?? []).filter(row => Number(row.stock_quantity) <= Number(row.low_stock_threshold)).length);
      const fullName = profile.data?.full_name?.trim() ?? "";
      setFirstName(fullName ? fullName.split(/\s+/)[0] : "there");
      setBusiness(businessResult.data as BusinessSummary|null);
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [businessId, session?.user.id]);

  const metrics = [
    { label: "Sales today", value: kes(sales), icon: CircleDollarSign, note: "Completed transactions", tone: "bg-emerald/10 text-emerald" },
    { label: "Expenses today", value: kes(expenses), icon: Wallet, note: "Recorded today", tone: "bg-amber-50 text-amber-700" },
    { label: "Customers", value: customers.toLocaleString("en-KE"), icon: Users, note: "Your customer base", tone: "bg-sky-50 text-sky-700" },
    { label: "Low stock items", value: lowStock.toLocaleString("en-KE"), icon: Boxes, note: "Need restocking", tone: "bg-rose-50 text-rose-700" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7 p-4 sm:p-6 lg:p-8">
      <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald">Business overview</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-midnight sm:text-4xl">Hello, {firstName}.</h1><p className="mt-2 text-sm text-slate-500">Here’s what’s happening with your business today.</p></div>
        <div className="flex flex-wrap gap-2"><Link to="/sales" className="inline-flex items-center gap-2 rounded-xl bg-emerald px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald/90"><ShoppingBag size={17}/> Record a sale</Link><Link to="/stock" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-midnight hover:bg-slate-50"><Boxes size={17}/> Manage stock</Link></div>
      </section>

      {business&&<section className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald/15 bg-white p-4 shadow-sm"><span className="grid size-11 place-items-center rounded-xl bg-emerald/10 text-emerald"><Building2 size={21}/></span><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your business</p><p className="truncate font-bold text-midnight">{business.name}</p><p className="text-xs text-slate-500">{[business.business_type,business.county].filter(Boolean).join(" · ")}</p></div><Link to="/profile" className="text-xs font-semibold text-emerald hover:underline">Business profile</Link></section>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon, note, tone }) => <article key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={19}/></span></div><p className="mt-4 text-2xl font-bold tracking-tight text-midnight">{loading ? "…" : value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></article>)}</section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <article className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-bold text-midnight">Business activity</h2><p className="mt-1 text-xs text-slate-400">A quick snapshot of your daily operations</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">Today</span></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-cloud p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><ArrowUpRight size={15} className="text-emerald"/> Revenue</div><p className="mt-2 text-2xl font-bold text-midnight">{loading ? "…" : kes(sales)}</p><p className="mt-1 text-xs text-slate-400">Completed sales today</p></div><div className="rounded-xl bg-cloud p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><ArrowDownRight size={15} className="text-rose-600"/> Spending</div><p className="mt-2 text-2xl font-bold text-midnight">{loading ? "…" : kes(expenses)}</p><p className="mt-1 text-xs text-slate-400">Expenses recorded today</p></div></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><div><p className="text-xs text-slate-400">Net cash movement today</p><p className={`mt-1 text-xl font-bold ${sales-expenses>=0?"text-emerald":"text-rose-600"}`}>{loading ? "…" : kes(sales-expenses)}</p></div><Link to="/sales" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald hover:underline">View sales <ArrowRight size={14}/></Link></div></article>
        <article className="flex flex-col rounded-2xl bg-midnight p-6 text-white shadow-sm"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-gold/15 text-gold"><Sparkles size={21}/></span><div><h2 className="font-bold">Your AI business copilot</h2><p className="text-xs text-white/45">Insights grounded in your records</p></div></div><p className="mt-5 text-sm leading-6 text-white/65">Ask questions about sales, expenses, customers and stock. Get practical next steps for your business.</p><Link to="/ai" className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-midnight hover:bg-gold/90">Open AI Assistant <ArrowRight size={16}/></Link></article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Printer size={19} className="text-emerald"/><h2 className="font-bold text-midnight">Coming next: Point of Sale (POS)</h2></div><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">We’re planning a connected in-store checkout experience that links your counter directly to inventory and business reporting.</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">Future enhancement</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="flex items-center gap-2 rounded-xl bg-cloud p-3 text-xs font-medium text-slate-600"><ScanBarcode size={17} className="text-emerald"/> Barcode scanning</div><div className="flex items-center gap-2 rounded-xl bg-cloud p-3 text-xs font-medium text-slate-600"><Printer size={17} className="text-emerald"/> Receipt printing</div><div className="flex items-center gap-2 rounded-xl bg-cloud p-3 text-xs font-medium text-slate-600"><CircleDollarSign size={17} className="text-emerald"/> M-Pesa checkout</div></div></section>

      <section className="grid gap-4 md:grid-cols-2"><Link to="/customers" className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-emerald/30"><div><p className="text-sm font-semibold text-midnight">Customer relationships</p><p className="mt-1 text-xs text-slate-500">Manage customer details and grow repeat business.</p></div><span className="grid size-10 place-items-center rounded-xl bg-sky-50 text-sky-700 group-hover:translate-x-1"><Users size={18}/></span></Link><Link to="/expenses" className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-emerald/30"><div><p className="text-sm font-semibold text-midnight">Track your spending</p><p className="mt-1 text-xs text-slate-500">Keep expenses organised and understand your costs.</p></div><span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700 group-hover:translate-x-1"><Wallet size={18}/></span></Link></section>
    </div>
  );
}

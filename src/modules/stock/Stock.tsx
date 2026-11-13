import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Archive, Plus, Search } from "lucide-react";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  cost_price: number | string;
  selling_price: number | string;
  stock_quantity: number | string;
  low_stock_threshold: number | string;
  unit: string;
};

const money = (value: number | string) =>
  `KSh ${Number(value).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald";

export default function Stock() {
  const { businessId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", cost_price: "", selling_price: "", stock_quantity: "", low_stock_threshold: "5", unit: "piece" });

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data, error: queryError } = await neon.from("products")
      .select("id,name,sku,cost_price,selling_price,stock_quantity,low_stock_threshold,unit")
      .eq("business_id", businessId).eq("is_active", true).order("name");
    if (queryError) setError(queryError.message);
    else { setProducts((data ?? []) as Product[]); setError(""); }
    setLoading(false);
  }, [businessId]);

  useEffect(() => { void load(); }, [load]);

  const createProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!businessId) return;
    setSaving(true); setError("");
    const { error: insertError } = await neon.from("products").insert({
      business_id: businessId,
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      cost_price: Number(form.cost_price || 0),
      selling_price: Number(form.selling_price || 0),
      stock_quantity: Number(form.stock_quantity || 0),
      low_stock_threshold: Number(form.low_stock_threshold || 5),
      unit: form.unit.trim() || "piece",
    });
    if (insertError) setError(insertError.message);
    else {
      setForm({ name: "", sku: "", cost_price: "", selling_price: "", stock_quantity: "", low_stock_threshold: "5", unit: "piece" });
      setShowForm(false);
      await load();
    }
    setSaving(false);
  };

  const archiveProduct = async (id: string) => {
    if (!window.confirm("Remove this product from your active stock list?")) return;
    const { error: updateError } = await neon.from("products").update({ is_active: false }).eq("id", id).eq("business_id", businessId);
    if (updateError) setError(updateError.message);
    else await load();
  };

  const visible = products.filter((p) => `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="space-y-4 p-4">
      <header className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-emerald">Inventory</p><h1 className="text-2xl font-bold text-midnight">Stock</h1><p className="text-sm text-slate-500">{products.length} active products</p></div>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-xl bg-emerald px-4 py-3 text-sm font-semibold text-white"><Plus size={17} /> Add item</button>
      </header>

      <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><Search size={18} className="text-slate-400" /><input className="w-full py-3 text-sm outline-none" placeholder="Search products or SKU" value={search} onChange={(e) => setSearch(e.target.value)} /></label>

      {showForm && <form onSubmit={createProduct} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-midnight">New product</h2>
        <input className={field} placeholder="Product name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={field} placeholder="SKU (optional)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={field} type="number" min="0" step="0.01" placeholder="Cost price (KES)" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
          <input className={field} type="number" min="0" step="0.01" placeholder="Selling price (KES)" required value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
          <input className={field} type="number" min="0" step="0.001" placeholder="Opening stock" required value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
          <input className={field} type="number" min="0" step="0.001" placeholder="Low stock at" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
        </div>
        <input className={field} placeholder="Unit (e.g. piece, kg, litre)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        <div className="flex gap-2"><button disabled={saving} className="flex-1 rounded-xl bg-midnight py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save product"}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 text-sm">Cancel</button></div>
      </form>}

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading inventory…</p> : visible.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center"><Archive className="mx-auto mb-2 text-slate-300" size={30} /><p className="font-medium text-midnight">No products found</p><p className="mt-1 text-sm text-slate-500">Add your first product to start tracking stock.</p></div> : <section className="space-y-3">{visible.map((p) => {
        const low = Number(p.stock_quantity) <= Number(p.low_stock_threshold);
        return <article key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-semibold text-midnight">{p.name}</h2><p className="text-xs text-slate-500">{p.sku || "No SKU"} · {money(p.selling_price)}</p></div><button aria-label={`Archive ${p.name}`} onClick={() => void archiveProduct(p.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><Archive size={17} /></button></div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><div><p className="text-xs text-slate-500">Available stock</p><p className="text-lg font-bold text-midnight">{Number(p.stock_quantity).toLocaleString("en-KE")} <span className="text-xs font-normal text-slate-500">{p.unit}</span></p></div>{low && <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"><AlertTriangle size={13} /> Low stock</span>}</div>
        </article>;
      })}</section>}
    </main>
  );
}

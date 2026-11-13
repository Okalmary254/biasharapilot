import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ShoppingCart, Trash2, ReceiptText } from "lucide-react";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

type Product = { id: string; name: string; selling_price: number | string; stock_quantity: number | string; unit: string };
type Customer = { id: string; full_name: string };
type Sale = { id: string; receipt_number: string | null; total: number | string; status: string; sold_at: string; payment_method: string | null };
type CartLine = { product: Product; quantity: number };

const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald";
const kes = (n: number | string) => `KSh ${Number(n).toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;

export default function Sales() {
  const { businessId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const [p, c, s] = await Promise.all([
      neon.from("products").select("id,name,selling_price,stock_quantity,unit").eq("business_id", businessId).eq("is_active", true).order("name"),
      neon.from("customers").select("id,full_name").eq("business_id", businessId).order("full_name"),
      neon.from("sales").select("id,receipt_number,total,status,sold_at,payment_method").eq("business_id", businessId).order("sold_at", { ascending: false }).limit(30),
    ]);
    if (p.error || c.error || s.error) setError(p.error?.message || c.error?.message || s.error?.message || "Unable to load sales data");
    setProducts((p.data ?? []) as Product[]);
    setCustomers((c.data ?? []) as Customer[]);
    setSales((s.data ?? []) as Sale[]);
    setLoading(false);
  }, [businessId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (amountPaid === "" && cart.length) setAmountPaid(String(Math.max(0, cart.reduce((n, x) => n + Number(x.product.selling_price) * x.quantity, 0) - Number(discount || 0)))); }, [cart, discount, amountPaid]);

  const subtotal = useMemo(() => cart.reduce((n, x) => n + Number(x.product.selling_price) * x.quantity, 0), [cart]);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const selectedProduct = products.find((p) => p.id === productId);

  const addItem = () => {
    if (!selectedProduct) return;
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) { setError("Enter a valid quantity."); return; }
    const existing = cart.find((x) => x.product.id === selectedProduct.id);
    const nextQty = (existing?.quantity ?? 0) + qty;
    if (nextQty > Number(selectedProduct.stock_quantity)) { setError(`Only ${selectedProduct.stock_quantity} ${selectedProduct.unit} available.`); return; }
    setCart(existing
      ? cart.map((x) => x.product.id === selectedProduct.id ? { ...x, quantity: nextQty } : x)
      : [...cart, { product: selectedProduct, quantity: qty }]);
    setProductId(""); setQuantity("1"); setError("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!businessId || !cart.length) return;
    if (Number(discount) > subtotal) { setError("Discount cannot exceed the subtotal."); return; }
    setSaving(true); setError("");
    const { error: e } = await neon.rpc("create_sale", {
      p_business_id: businessId,
      p_items: cart.map((x) => ({ product_id: x.product.id, quantity: x.quantity })),
      p_customer_id: customerId || null,
      p_payment_method: paymentMethod,
      p_amount_paid: Number(amountPaid || 0),
      p_discount: Number(discount || 0),
    });
    if (e) setError(e.message);
    else {
      setCart([]); setCustomerId(""); setDiscount("0"); setAmountPaid(""); setPaymentMethod("cash");
      await load();
    }
    setSaving(false);
  };

  return <main className="space-y-4 p-4">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-emerald">Transactions</p><h1 className="text-2xl font-bold text-midnight">Sales</h1><p className="text-sm text-slate-500">Create a sale and update stock automatically.</p></header>

    <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-midnight"><ShoppingCart size={18} /> New sale</div>
      <div className="flex gap-2">
        <select className={field} value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Choose a product</option>{products.filter((p) => Number(p.stock_quantity) > 0).map((p) => <option key={p.id} value={p.id}>{p.name} · {kes(p.selling_price)} · {p.stock_quantity} left</option>)}</select>
        <input className={field + " max-w-24"} type="number" min="0.001" step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} aria-label="Quantity" />
        <button type="button" onClick={addItem} disabled={!productId} className="rounded-xl bg-emerald px-3 text-white disabled:opacity-40"><Plus size={19} /></button>
      </div>
      {cart.length > 0 && <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">{cart.map((x) => <div key={x.product.id} className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-midnight">{x.product.name}</p><p className="text-xs text-slate-500">{x.quantity} × {kes(x.product.selling_price)}</p></div><div className="flex items-center gap-2"><span className="text-sm font-semibold">{kes(Number(x.product.selling_price) * x.quantity)}</span><button type="button" aria-label={`Remove ${x.product.name}`} onClick={() => setCart((prev) => prev.filter((y) => y.product.id !== x.product.id))} className="p-1 text-slate-400"><Trash2 size={16} /></button></div></div>)}</div>}
      <select className={field} value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Walk-in customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select>
      <div className="grid grid-cols-2 gap-2"><input className={field} type="number" min="0" step="0.01" placeholder="Discount (KES)" value={discount} onChange={(e) => setDiscount(e.target.value)} /><input className={field} type="number" min="0" step="0.01" placeholder="Amount paid (KES)" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} /></div>
      <select className={field} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="mpesa">M-Pesa</option><option value="bank">Bank</option><option value="card">Card</option><option value="other">Other</option></select>
      <div className="flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm text-slate-500">Subtotal</span><span className="font-medium">{kes(subtotal)}</span></div>
      <div className="flex items-center justify-between"><span className="text-sm text-slate-500">Total after discount</span><span className="text-xl font-bold text-midnight">{kes(total)}</span></div>
      <button disabled={saving || !cart.length} className="w-full rounded-xl bg-midnight py-3 font-semibold text-white disabled:opacity-40">{saving ? "Processing sale…" : "Complete sale"}</button>
    </form>

    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold text-midnight">Recent sales</h2><span className="text-xs text-slate-500">Last 30</span></div>
      {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading sales…</p> : sales.length === 0 ? <div className="rounded-2xl bg-white p-8 text-center"><ReceiptText className="mx-auto mb-2 text-slate-300" size={30} /><p className="font-medium text-midnight">No sales recorded</p><p className="mt-1 text-sm text-slate-500">Your transactions will appear here.</p></div> : sales.map((s) => <article key={s.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm"><div className="min-w-0"><p className="truncate text-sm font-semibold text-midnight">{s.receipt_number || "Sale"}</p><p className="text-xs text-slate-500">{new Date(s.sold_at).toLocaleString("en-KE")} · {s.payment_method || "Payment"}</p></div><div className="text-right"><p className="font-semibold text-midnight">{kes(s.total)}</p><span className={`text-xs ${s.status === "completed" ? "text-emerald" : "text-amber-600"}`}>{s.status}</span></div></article>)}
    </section>
  </main>;
}

import { useEffect, useState } from "react";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

const kes = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;

export default function Dashboard() {
  const { businessId } = useAuth();
  const [sales, setSales] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [customers, setCustomers] = useState(0);
  const [lowStock, setLowStock] = useState(0);

  useEffect(() => {
    if (!businessId) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, "0");
    const d = String(start.getDate()).padStart(2, "0");
    const today = `${y}-${m}-${d}`;

    neon
      .from("sales")
      .select("total")
      .eq("business_id", businessId)
      .eq("status", "completed")
      .gte("sold_at", start.toISOString())
      .then(({ data }) => setSales((data ?? []).reduce((a, r) => a + Number(r.total), 0)));

    neon
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .eq("expense_date", today)
      .then(({ data }) => setExpenses((data ?? []).reduce((a, r) => a + Number(r.amount), 0)));

    neon
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .then(({ count }) => setCustomers(count ?? 0));

    neon
      .from("products")
      .select("stock_quantity, low_stock_threshold")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .then(({ data }) =>
        setLowStock(
          (data ?? []).filter((p) => Number(p.stock_quantity) <= Number(p.low_stock_threshold)).length,
        ),
      );
  }, [businessId]);

  const card = "rounded-2xl bg-white p-4 shadow-sm";

  return (
    <div className="space-y-4 p-4">
      <header className="rounded-2xl bg-midnight p-5 text-white">
        <p className="text-sm text-white/60">Today's sales</p>
        <p className="text-3xl font-bold text-gold">{kes(sales)}</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className={card}>
          <p className="text-sm text-gray-500">Expenses</p>
          <p className="text-xl font-semibold text-midnight">{kes(expenses)}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-500">Customers</p>
          <p className="text-xl font-semibold text-midnight">{customers}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-500">Stock alerts</p>
          <p className="text-xl font-semibold text-midnight">{lowStock}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-gray-500">Net today</p>
          <p className="text-xl font-semibold text-emerald">{kes(sales - expenses)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
        <p className="text-sm font-semibold text-midnight">AI Business Insight</p>
        <p className="mt-1 text-sm text-gray-600">
          Insights based on your real records arrive in Stage 3.
        </p>
      </div>
    </div>
  );
}

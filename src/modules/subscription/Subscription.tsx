import { useEffect, useMemo, useState } from "react";
import { Check, Crown, CreditCard, Sparkles, Users, Package, GitBranch, BarChart3 } from "lucide-react";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

type PlanId = "free" | "starter" | "pro" | "business";
type Subscription = {
  plan_id: PlanId;
  status: "active" | "pending" | "past_due" | "cancelled" | "expired";
  current_period_end: string | null;
};

const plans: {
  id: PlanId; name: string; price: number; tagline: string; products: string;
  ai: number; marketing: number; staff: number; branches: string; analytics: string;
  highlight?: boolean;
}[] = [
  { id: "free", name: "Free", price: 0, tagline: "A simple start for a new business.", products: "20 products", ai: 10, marketing: 2, staff: 1, branches: "1 branch", analytics: "Essential dashboard" },
  { id: "starter", name: "Starter", price: 299, tagline: "For growing shops and solo operators.", products: "100 products", ai: 100, marketing: 20, staff: 1, branches: "1 branch", analytics: "Basic analytics" },
  { id: "pro", name: "Pro", price: 799, tagline: "More insight and capacity for a busy team.", products: "Unlimited products", ai: 500, marketing: 100, staff: 3, branches: "1 branch", analytics: "Advanced analytics", highlight: true },
  { id: "business", name: "Business", price: 1499, tagline: "For established teams managing multiple locations.", products: "Unlimited products", ai: 2000, marketing: 300, staff: 10, branches: "Multiple branches", analytics: "Advanced analytics" },
];

const money = (value: number) => `KSh ${value.toLocaleString("en-KE")}`;

export default function Subscription() {
  const { businessId } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!businessId) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error: queryError } = await neon
        .from("business_subscriptions")
        .select("plan_id,status,current_period_end")
        .eq("business_id", businessId)
        .maybeSingle();
      if (!active) return;
      if (queryError) {
        setError(queryError.message);
      } else if (data) {
        setSubscription(data as Subscription);
      } else {
        // Businesses created before/after the subscription rollout start on Free.
        const { error: insertError } = await neon.from("business_subscriptions").insert({
          business_id: businessId,
          plan_id: "free",
          status: "active",
        });
        if (insertError) {
          const retry = await neon.from("business_subscriptions")
            .select("plan_id,status,current_period_end").eq("business_id", businessId).maybeSingle();
          if (retry.data) setSubscription(retry.data as Subscription);
          else setError(insertError.message);
        } else {
          setSubscription({ plan_id: "free", status: "active", current_period_end: null });
        }
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [businessId]);

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === subscription?.plan_id) ?? plans[0],
    [subscription?.plan_id],
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald">Plans & billing</p>
          <h1 className="text-2xl font-bold text-midnight sm:text-3xl">Choose the right plan</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Simple, affordable pricing in Kenyan shillings. Start free and upgrade as your business grows.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald/15 bg-white px-4 py-3 shadow-sm">
          <Crown size={18} className="text-emerald"/>
          <div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Current plan</p><p className="text-sm font-bold text-midnight">{loading ? "Checking…" : currentPlan.name}</p></div>
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{notice}</p>}

      {subscription && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-midnight p-5 text-white">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-white/50">Your subscription</p><h2 className="mt-1 text-xl font-bold">{currentPlan.name} plan</h2><p className="mt-1 text-sm text-white/60">Status: <span className="font-semibold capitalize text-emerald-200">{subscription.status.replace("_", " ")}</span></p></div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xs text-white/50">Monthly price</p><p className="text-2xl font-bold">{money(currentPlan.price)}</p></div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const selected = subscription?.plan_id === plan.id;
          return (
            <article key={plan.id} className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${plan.highlight ? "border-emerald ring-2 ring-emerald/10" : "border-slate-200"}`}>
              {plan.highlight && <span className="absolute -top-3 left-5 rounded-full bg-emerald px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Most popular</span>}
              <div className="mb-4"><h2 className="text-lg font-bold text-midnight">{plan.name}</h2><p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{plan.tagline}</p></div>
              <div className="mb-5"><span className="text-3xl font-extrabold tracking-tight text-midnight">{money(plan.price)}</span><span className="text-xs text-slate-400"> / month</span></div>
              <ul className="mb-6 flex-1 space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2"><Package size={16} className="text-emerald"/>{plan.products}</li>
                <li className="flex items-center gap-2"><Sparkles size={16} className="text-emerald"/>{plan.ai.toLocaleString("en-KE")} AI messages / month</li>
                <li className="flex items-center gap-2"><BarChart3 size={16} className="text-emerald"/>{plan.marketing} marketing generations / month</li>
                <li className="flex items-center gap-2"><Users size={16} className="text-emerald"/>{plan.staff} staff account{plan.staff === 1 ? "" : "s"}</li>
                <li className="flex items-center gap-2"><GitBranch size={16} className="text-emerald"/>{plan.branches}</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-emerald"/>{plan.analytics}</li>
              </ul>
              {selected ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald/10 py-3 text-sm font-bold text-emerald"><Check size={17}/> Current plan</div>
              ) : plan.id === "free" ? (
                <button type="button" onClick={() => setNotice("Your current subscription will remain active. Contact support if you need help changing plans.")} className="rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600">Free plan</button>
              ) : (
                <button type="button" onClick={() => setNotice("M-Pesa checkout is being connected. No payment has been taken and your plan has not been changed. Your current plan remains active.")} className="flex items-center justify-center gap-2 rounded-xl bg-midnight py-3 text-sm font-semibold text-white transition hover:bg-midnight/90"><CreditCard size={16}/> Upgrade with M-Pesa</button>
              )}
            </article>
          );
        })}
      </section>
      <p className="text-center text-xs text-slate-400">All prices are in KES and billed monthly. Paid plan activation will only happen after a verified M-Pesa payment.</p>
    </main>
  );
}

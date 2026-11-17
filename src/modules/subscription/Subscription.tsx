import { useEffect, useMemo, useState } from "react";
import { Check, Crown, CreditCard, Sparkles, Users, Package, GitBranch, BarChart3, ShieldCheck } from "lucide-react";
import { neon } from "../../services/neon/client";
import { useAuth } from "../../app/providers/useAuth";

type PlanId = "free" | "starter" | "pro" | "business";
type Plan = {
  id: PlanId;
  name: string;
  monthly_price_kes: number;
  product_limit: number | null;
  ai_messages_limit: number;
  marketing_generations_limit: number;
  staff_limit: number;
  branch_limit: number | null;
  analytics_level: "essential" | "basic" | "advanced";
};
type SubscriptionRecord = {
  plan_id: PlanId;
  status: "active" | "pending" | "past_due" | "cancelled" | "expired";
  current_period_end: string | null;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
};

const money = (value: number) => `KSh ${value.toLocaleString("en-KE")}`;

function planFeatures(plan: Plan) {
  return [
    { icon: Package, label: plan.product_limit === null ? "Unlimited products" : `${plan.product_limit} products` },
    { icon: Sparkles, label: `${plan.ai_messages_limit.toLocaleString("en-KE")} AI messages / month` },
    { icon: BarChart3, label: `${plan.marketing_generations_limit} marketing generations / month` },
    { icon: Users, label: `${plan.staff_limit} staff account${plan.staff_limit === 1 ? "" : "s"}` },
    { icon: GitBranch, label: plan.branch_limit === null ? "Multiple branches" : `${plan.branch_limit} branch${plan.branch_limit === 1 ? "" : "es"}` },
    { icon: Check, label: plan.analytics_level === "advanced" ? "Advanced analytics" : plan.analytics_level === "basic" ? "Basic analytics" : "Essential dashboard" },
  ];
}

export default function Subscription() {
  const { businessId } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [billingBusy, setBillingBusy] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      const [planResult, subscriptionResult] = await Promise.all([
        neon.from("subscription_plans")
          .select("id,name,monthly_price_kes,product_limit,ai_messages_limit,marketing_generations_limit,staff_limit,branch_limit,analytics_level")
          .eq("active", true)
          .order("monthly_price_kes", { ascending: true }),
        neon.from("business_subscriptions")
          .select("plan_id,status,current_period_end,auto_renew,cancel_at_period_end")
          .eq("business_id", businessId)
          .maybeSingle(),
      ]);
      if (!active) return;
      if (planResult.error) {
        setError(planResult.error.message);
        setLoading(false);
        return;
      }
      setPlans((planResult.data ?? []) as Plan[]);
      if (subscriptionResult.error) {
        setError(subscriptionResult.error.message);
      } else if (subscriptionResult.data) {
        setSubscription(subscriptionResult.data as SubscriptionRecord);
      } else {
        // New businesses created after the subscription rollout start on Free.
        const { error: insertError } = await neon.from("business_subscriptions").insert({
          business_id: businessId,
          plan_id: "free",
          status: "active",
        });
        if (!active) return;
        if (insertError) {
          const retry = await neon.from("business_subscriptions")
            .select("plan_id,status,current_period_end")
            .eq("business_id", businessId)
            .maybeSingle();
          if (retry.data) setSubscription(retry.data as SubscriptionRecord);
          else setError(insertError.message);
        } else {
          setSubscription({ plan_id: "free", status: "active", current_period_end: null, auto_renew: false, cancel_at_period_end: false });
        }
      }
      setLoading(false);
    })().catch((loadError: unknown) => {
      if (!active) return;
      setError(loadError instanceof Error ? loadError.message : "Unable to load subscription plans.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [businessId]);

  const setAutoRenew = async (enabled: boolean) => {
    if (!businessId) return; setBillingBusy(true); setError(""); setNotice("");
    const { error: updateError } = await neon.rpc("set_subscription_auto_renew", { p_business_id: businessId, p_enabled: enabled });
    if (updateError) setError(updateError.message);
    else { setSubscription(current => current ? { ...current, auto_renew: enabled } : current); setNotice(enabled ? "Automatic billing preference saved. Automatic charges will begin only when recurring M-Pesa billing is available." : "Automatic billing preference turned off."); }
    setBillingBusy(false);
  };

  const cancelSubscription = async () => {
    if (!businessId || !window.confirm("Cancel this paid subscription at the end of its current billing period? Your paid features remain available until then.")) return;
    setBillingBusy(true); setError(""); setNotice("");
    const { data, error: cancelError } = await neon.rpc("cancel_business_subscription", { p_business_id: businessId });
    if (cancelError) setError(cancelError.message);
    else { setSubscription(current => current ? { ...current, auto_renew: false, cancel_at_period_end: true } : current); setNotice(data ? `Cancellation scheduled. Your plan remains active until ${new Date(data).toLocaleDateString("en-KE")}.` : "Cancellation scheduled for the end of your billing period."); }
    setBillingBusy(false);
  };

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === subscription?.plan_id) ?? plans[0],
    [plans, subscription?.plan_id],
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
          <div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Current plan</p><p className="text-sm font-bold text-midnight">{loading ? "Checking…" : currentPlan?.name ?? "Unavailable"}</p></div>
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{notice}</p>}

      {subscription && currentPlan && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-midnight p-5 text-white">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-white/50">Your subscription</p><h2 className="mt-1 text-xl font-bold">{currentPlan.name} plan</h2><p className="mt-1 text-sm text-white/60">Status: <span className="font-semibold capitalize text-emerald-200">{subscription.status.replace("_", " ")}</span>{subscription.current_period_end ? ` · Renews ${new Date(subscription.current_period_end).toLocaleDateString("en-KE")}` : ""}</p></div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xs text-white/50">Monthly price</p><p className="text-2xl font-bold">{money(currentPlan.monthly_price_kes)}</p></div>
        </section>
      )}

      {subscription && currentPlan && (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div><h2 className="font-bold text-midnight">Billing preferences</h2><p className="mt-1 text-sm text-slate-500">Choose whether to renew your subscription automatically and manage cancellation.</p></div>
          <label className="flex items-start gap-3 rounded-xl bg-cloud p-4"><input type="checkbox" className="mt-1 size-4 accent-emerald" checked={Boolean(subscription.auto_renew)} disabled={billingBusy || subscription.cancel_at_period_end || subscription.plan_id === "free"} onChange={e=>void setAutoRenew(e.target.checked)}/><span><span className="block text-sm font-semibold text-midnight">Enable automatic billing</span><span className="mt-1 block text-xs leading-5 text-slate-500">Save your preference to renew automatically when recurring M-Pesa billing is enabled. No automatic payment is taken until that integration is available.</span></span></label>
          {subscription.cancel_at_period_end ? <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Cancellation is scheduled. Your current plan remains available until the end of this billing period.</p> : subscription.plan_id !== "free" && <button type="button" disabled={billingBusy} onClick={()=>void cancelSubscription()} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{billingBusy ? "Updating…" : "Cancel subscription"}</button>}
        </section>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Loading your plans…</div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const selected = subscription?.plan_id === plan.id;
            const popular = plan.id === "pro";
            return (
              <article key={plan.id} className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${popular ? "border-emerald ring-2 ring-emerald/10" : "border-slate-200"}`}>
                {popular && <span className="absolute -top-3 left-5 rounded-full bg-emerald px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Most popular</span>}
                <div className="mb-4"><h2 className="text-lg font-bold text-midnight">{plan.name}</h2><p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{plan.id === "free" ? "A simple start for a new business." : plan.id === "starter" ? "For growing shops and solo operators." : plan.id === "pro" ? "More insight and capacity for a busy team." : "For established teams managing multiple locations."}</p></div>
                <div className="mb-5"><span className="text-3xl font-extrabold tracking-tight text-midnight">{money(plan.monthly_price_kes)}</span><span className="text-xs text-slate-400"> / month</span></div>
                <ul className="mb-6 flex-1 space-y-3 text-sm text-slate-600">
                  {planFeatures(plan).map(({ icon: Icon, label }) => <li key={label} className="flex items-center gap-2"><Icon size={16} className="shrink-0 text-emerald"/>{label}</li>)}
                </ul>
                {selected ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald/10 py-3 text-sm font-bold text-emerald"><ShieldCheck size={17}/> Current plan</div>
                ) : plan.id === "free" ? (
                  <button type="button" onClick={() => setNotice("Your current paid plan remains active until its billing period ends. Contact support if you need help changing plans.")} className="rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600">Free plan</button>
                ) : (
                  <button type="button" onClick={() => setNotice("M-Pesa checkout is the next integration step. No payment has been taken and your subscription has not changed.")} className="flex items-center justify-center gap-2 rounded-xl bg-midnight py-3 text-sm font-semibold text-white transition hover:bg-midnight/90"><CreditCard size={16}/> Upgrade with M-Pesa</button>
                )}
              </article>
            );
          })}
        </section>
      )}
      <p className="text-center text-xs text-slate-400">All prices are in KES and billed monthly. Paid plans activate only after a verified M-Pesa payment.</p>
    </main>
  );
}

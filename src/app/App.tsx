import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { AuthProvider } from "./providers/AuthProvider";
import { useAuth } from "./providers/useAuth";
import AuthPage from "../modules/auth/AuthPage";
import Onboarding from "../modules/onboarding/Onboarding";
import Dashboard from "../modules/dashboard/Dashboard";
import Profile from "../modules/profile/Profile";
import Subscription from "../modules/subscription/Subscription";
import Stock from "../modules/stock/Stock";
import Sales from "../modules/sales/Sales";
import Customers from "../modules/customers/Customers";
import Expenses from "../modules/expenses/Expenses";
import AIAssistant from "../modules/ai/AIAssistant";
import Shell from "../components/layout/Shell";
import Splash from "../components/shared/Splash";

type ReadyBundle = {
  id: string;
  version?: string;
};

function LiveUpdateNotice() {
  const [bundle, setBundle] = useState<ReadyBundle | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let active = true;
    let listener: { remove: () => Promise<void> } | undefined;

    void CapacitorUpdater.addListener("updateAvailable", (event) => {
      if (!active || !event.bundle?.id) return;
      setBundle({
        id: event.bundle.id,
        version: event.bundle.version,
      });
    }).then((handle) => {
      listener = handle;
      if (!active) void handle.remove();
    }).catch((error: unknown) => {
      console.warn("Could not register live update listener:", error);
    });

    return () => {
      active = false;
      if (listener) void listener.remove();
    };
  }, []);

  const applyUpdate = async () => {
    if (!bundle || applying) return;
    setApplying(true);
    try {
      // set() activates the downloaded bundle and reloads the app.
      await CapacitorUpdater.set({ id: bundle.id });
    } catch (error) {
      console.error("Could not apply the downloaded app update:", error);
      setApplying(false);
    }
  };

  if (!bundle) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-4 right-4 z-[100] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <span aria-hidden="true" className="text-xl">↻</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">BiasharaPilot AI update ready</p>
        <p className="text-sm text-slate-600">
          {bundle.version ? `Version ${bundle.version} is ready. ` : ""}Restart to apply the improvements.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void applyUpdate()}
        disabled={applying}
        className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
      >
        {applying ? "Applying…" : "Restart"}
      </button>
    </aside>
  );
}

function Guard({ requireBusiness }: { requireBusiness: boolean }) {
  const { session, businessId, businessError, loading, refreshBusiness } = useAuth();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/auth" replace />;
  if (businessError) return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cloud p-6 text-center">
      <h1 className="text-xl font-bold text-midnight">We couldn't verify your business access</h1>
      <p className="max-w-lg text-sm text-slate-600">{businessError}</p>
      <button onClick={() => void refreshBusiness()} className="rounded-xl bg-emerald px-5 py-3 font-semibold text-white">Try again</button>
    </main>
  );
  if (requireBusiness && !businessId) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <LiveUpdateNotice />
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<Guard requireBusiness={false} />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>
          <Route element={<Guard requireBusiness />}>
            <Route element={<Shell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/ai" element={<AIAssistant />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/subscription" element={<Subscription />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

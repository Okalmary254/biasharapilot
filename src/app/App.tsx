import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import { useAuth } from "./providers/useAuth";
import AuthPage from "../modules/auth/AuthPage";
import Onboarding from "../modules/onboarding/Onboarding";
import Dashboard from "../modules/dashboard/Dashboard";
import Profile from "../modules/profile/Profile";
import Stock from "../modules/stock/Stock";
import Sales from "../modules/sales/Sales";
import Customers from "../modules/customers/Customers";
import Expenses from "../modules/expenses/Expenses";
import AIAssistant from "../modules/ai/AIAssistant";
import Shell from "../components/layout/Shell";
import Splash from "../components/shared/Splash";

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
  if (!requireBusiness && businessId) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/auth" element={<AuthPage/>}/>
    <Route element={<Guard requireBusiness={false}/>}>
      <Route path="/onboarding" element={<Onboarding/>}/>
    </Route>
    <Route element={<Guard requireBusiness/>}>
      <Route element={<Shell/>}>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/stock" element={<Stock/>}/>
        <Route path="/sales" element={<Sales/>}/>
        <Route path="/customers" element={<Customers/>}/>
        <Route path="/expenses" element={<Expenses/>}/>
        <Route path="/ai" element={<AIAssistant/>}/>
        <Route path="/profile" element={<Profile/>}/>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></BrowserRouter></AuthProvider>;
}

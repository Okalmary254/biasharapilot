import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
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


const LAST_PAGE_KEY = "biasharapilot:last-page";

function RememberLastPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, businessId, loading } = useAuth();

  useEffect(() => {
    if (loading || !session) return;
    const saved = sessionStorage.getItem(LAST_PAGE_KEY);
    if (location.pathname === "/" && businessId && saved && saved !== "/" && saved !== "/auth" && saved !== "/onboarding") {
      sessionStorage.removeItem(LAST_PAGE_KEY);
      navigate(saved, { replace: true });
      return;
    }
    if (location.pathname !== "/auth" && location.pathname !== "/onboarding") {
      sessionStorage.setItem(LAST_PAGE_KEY, location.pathname + location.search);
    }
  }, [location.pathname, location.search, session, businessId, loading, navigate]);

  return null;
}

function Guard({ requireBusiness }: { requireBusiness: boolean }) {
  const { session, businessId, loading } = useAuth();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/auth" replace />;
  if (requireBusiness && !businessId) return <Navigate to="/onboarding" replace />;
  if (!requireBusiness && businessId) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return <AuthProvider><BrowserRouter><RememberLastPage/><Routes>
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

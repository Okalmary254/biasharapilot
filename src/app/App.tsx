import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import { useAuth } from "./providers/useAuth";
import AuthPage from "../modules/auth/AuthPage";
import Onboarding from "../modules/onboarding/Onboarding";
import Dashboard from "../modules/dashboard/Dashboard";
import Profile from "../modules/profile/Profile";
import Stock from "../modules/stock/Stock";
import Customers from "../modules/customers/Customers";
import Expenses from "../modules/expenses/Expenses";
import Shell from "../components/layout/Shell";
import Splash from "../components/shared/Splash";
import ComingSoon from "../components/shared/ComingSoon";

function Guard({ requireBusiness }: { requireBusiness: boolean }) {
  const { session, businessId, loading } = useAuth();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/auth" replace />;
  if (requireBusiness && !businessId) return <Navigate to="/onboarding" replace />;
  if (!requireBusiness && businessId) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<Guard requireBusiness={false} />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>
          <Route element={<Guard requireBusiness />}>
            <Route element={<Shell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/sales" element={<ComingSoon title="Sales" />} />
              <Route path="/ai" element={<ComingSoon title="AI Assistant" />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

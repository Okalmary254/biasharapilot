import { NavLink, Outlet } from "react-router-dom";
import { Home, Package, Receipt, Sparkles, User, Users, Wallet } from "lucide-react";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/stock", icon: Package, label: "Stock" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/expenses", icon: Wallet, label: "Expenses" },
  { to: "/sales", icon: Receipt, label: "Sales" },
  { to: "/ai", icon: Sparkles, label: "AI" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function Shell() {
  return (
    <div className="min-h-screen bg-cloud pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
      <Outlet />
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-white/10 bg-midnight px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex min-w-[4.25rem] shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[11px] ${isActive ? "text-gold" : "text-white/60"}`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}


import { NavLink, Outlet } from "react-router-dom";
import { Home, Package, Receipt, Sparkles, User } from "lucide-react";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/stock", icon: Package, label: "Stock" },
  { to: "/sales", icon: Receipt, label: "Sales" },
  { to: "/ai", icon: Sparkles, label: "AI" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function Shell() {
  return (
    <div className="min-h-screen bg-cloud pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <Outlet />

      <nav className="fixed inset-x-0 bottom-0 flex justify-around bg-midnight pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs ${
                isActive ? "text-gold" : "text-white/60"
              }`
            }
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

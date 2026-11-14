import { NavLink, Outlet } from "react-router-dom";
import { Home, Package, Receipt, Sparkles, User, Users, Wallet, PanelLeftClose } from "lucide-react";

const tabs = [
  { to: "/", icon: Home, label: "Overview" },
  { to: "/stock", icon: Package, label: "Inventory" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/expenses", icon: Wallet, label: "Expenses" },
  { to: "/sales", icon: Receipt, label: "Sales" },
  { to: "/ai", icon: Sparkles, label: "AI Assistant" },
  { to: "/profile", icon: User, label: "My profile" },
];

function Brand() {
  return <div className="flex items-center gap-3 px-3 py-5">
    <div className="grid size-10 place-items-center rounded-xl bg-emerald text-lg font-black text-gold">B</div>
    <div><p className="font-bold tracking-tight text-white">Biashara<span className="text-gold">Pilot</span></p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Business suite</p></div>
  </div>;
}

export default function Shell() {
  return (
    <div className="min-h-screen bg-cloud lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-midnight px-4 lg:flex">
        <Brand />
        <div className="px-3 pb-3 pt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Workspace</div>
        <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isActive ? "bg-white/10 text-gold shadow-inner" : "text-white/60 hover:bg-white/5 hover:text-white"}`
            }>
              <Icon size={18} />{label}
              {to === "/ai" && <span className="ml-auto rounded-full bg-emerald/20 px-2 py-0.5 text-[9px] font-bold text-emerald-200">AI</span>}
            </NavLink>
          ))}
        </nav>
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-white">Built for Kenyan businesses</p>
          <p className="mt-1 text-[11px] leading-5 text-white/45">Sales, stock and business insights in one place.</p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-8 backdrop-blur lg:flex">
        <div><p className="text-xs font-semibold text-slate-400">BIASHARAPILOT WORKSPACE</p><p className="text-sm font-semibold text-midnight">Manage your business with clarity.</p></div>
        <div className="flex items-center gap-2 rounded-full border border-emerald/15 bg-emerald/5 px-3 py-1.5 text-xs font-semibold text-emerald"><span className="size-2 rounded-full bg-emerald"/>Workspace active</div>
      </header>

      <main className="min-h-screen pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-8">
        <Outlet />
      </main>

      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 flex gap-1 overflow-x-auto border-t border-white/10 bg-midnight px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:hidden">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) =>
            `flex min-w-[4.25rem] shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[11px] ${isActive ? "text-gold" : "text-white/60"}`
          }>
            <Icon size={20} />{label === "Overview" ? "Home" : label === "Inventory" ? "Stock" : label === "AI Assistant" ? "AI" : label === "My profile" ? "Profile" : label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

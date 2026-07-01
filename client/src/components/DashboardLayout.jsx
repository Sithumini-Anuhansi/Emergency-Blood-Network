import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import { LogOut, Menu, X } from "lucide-react";

const roleConfig = {
  donor:     { label: "Donor Portal",      accent: "#dc2626", bg: "bg-red-600",    light: "bg-red-50 text-red-700" },
  hospital:  { label: "Hospital Portal",   accent: "#2563eb", bg: "bg-blue-600",   light: "bg-blue-50 text-blue-700" },
  bloodbank: { label: "Blood Bank Portal", accent: "#059669", bg: "bg-emerald-600", light: "bg-emerald-50 text-emerald-700" },
  admin:     { label: "Admin Portal",      accent: "#7c3aed", bg: "bg-violet-600", light: "bg-violet-50 text-violet-700" },
};

const DashboardLayout = ({ children, navItems, activeSection, onSectionChange }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const role = roleConfig[user?.role] || roleConfig.admin;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-56" : "w-16"} flex-shrink-0 flex flex-col bg-[#0f1f3d] transition-all duration-200`}
      >
        {/* Logo area */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">
          <div className={`w-8 h-8 rounded-lg ${role.bg} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-xs">EBN</span>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-white font-semibold text-sm leading-tight">Emergency</p>
              <p className="text-white/50 text-xs leading-tight">Blood Network</p>
            </div>
          )}
        </div>

        {/* Role badge */}
        {sidebarOpen && (
          <div className="px-4 py-2 border-b border-white/10">
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${role.light}`}>
              {role.label}
            </span>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                {sidebarOpen && isActive && (
                  <div
                    className="ml-auto w-1 h-4 rounded-full"
                    style={{ backgroundColor: role.accent }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((p) => !p)}
          className="flex items-center justify-center py-3 border-t border-white/10 text-white/40 hover:text-white transition-colors"
        >
          {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: role.accent }}
            />
            <span className="text-sm font-semibold text-slate-700">
              {navItems.find((n) => n.id === activeSection)?.label || "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-700 leading-tight">{user?.fullName}</p>
              <p className="text-xs text-slate-400 leading-tight">{role.label}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
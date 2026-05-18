import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import {
  LayoutDashboard, Building2, FileText, CreditCard, Wrench,
  Mail, User, Search, LogOut, Settings, Menu, X,
  Info, Megaphone, PieChart
} from "lucide-react";

const ownerNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/properties", label: "Properties", icon: Building2 },
  { to: "/leases", label: "Leases", icon: FileText },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
  { to: "/messages", label: "Messages", icon: Mail },
  { to: "/reports", label: "Reports", icon: PieChart },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/report", label: "Report Incidents", icon: Info },
];

const tenantNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/browse", label: "Properties", icon: Search },
  { to: "/leases", label: "Leases", icon: FileText },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
  { to: "/messages", label: "Messages", icon: Mail },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/report", label: "Report Incidents", icon: Info },
];

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = user?.role === "OWNER" ? ownerNav : tenantNav;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between gap-2 px-4 py-5">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Digital Estate" className="h-8 w-8" width={32} height={32} />
          <div>
            <h1 className="text-sm font-bold leading-tight">Digital Estate</h1>
            <p className="text-[10px] uppercase tracking-widest text-secondary">Management Suite</p>
          </div>
        </div>
        <button className="md:hidden text-primary-foreground" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-secondary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-secondary"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-4">
        <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-secondary overflow-hidden">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt={`${user.firstName} ${user.lastName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium group-hover:text-secondary transition-colors">{user?.firstName} {user?.lastName}</p>
            <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
              {user?.role === "OWNER" ? "Principal Owner" : "Tenant"}
            </p>
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); logout(); }} className="text-sidebar-foreground hover:text-secondary" title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="fixed left-4 top-4 z-50 md:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - mobile: slide-in, desktop: fixed */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[220px] flex-col bg-primary text-primary-foreground transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
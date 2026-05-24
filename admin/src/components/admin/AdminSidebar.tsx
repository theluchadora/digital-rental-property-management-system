import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Receipt,
  Wrench,
  MessageSquare,
  Bell,
  LogOut,
  ShieldAlert,
  ChevronLeft,
  Menu,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Users", url: "/users", icon: Users },
  { title: "Properties", url: "/properties", icon: Building2 },
  { title: "Leases", url: "/leases", icon: FileText },
  { title: "Payments", url: "/payments", icon: Receipt },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Incidents", url: "/incidents", icon: ShieldAlert },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

export function AdminSidebar() {
  const { user, logout } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { open, setOpen } = useSidebar();

  const toggleSidebar = () => {
    setOpen(!open);
  };

  return (
    <aside 
      className={`sticky top-0 left-0 h-screen flex flex-col bg-primary text-primary-foreground border-r border-sidebar-border select-none shrink-0 transition-all duration-300 ${
        open ? "w-[220px]" : "w-[70px]"
      }`}
    >
      {/* Header with toggle button */}
      <div className={`flex items-center ${open ? "justify-between px-4" : "justify-center px-2"} py-5 shrink-0`}>
        {open ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary font-bold text-lg select-none">
                E
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight select-none">
                  Estate Admin
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-secondary select-none">
                  Control panel
                </p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="rounded-md p-1 hover:bg-sidebar-accent transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1 hover:bg-sidebar-accent transition-colors"
            title="Expand sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {items.map((item) => {
          const isActive = path === item.url || path.startsWith(item.url + "/");
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors select-none ${
                isActive
                  ? "bg-sidebar-accent text-secondary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-secondary"
              } ${!open && "justify-center"}`}
              title={!open ? item.title : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {open && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className={`border-t border-sidebar-border p-4 shrink-0 ${!open && "px-2"}`}>
        <div className={`flex items-center gap-2 group select-none ${!open ? "justify-center" : "justify-between"}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-secondary select-none shrink-0">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          {open && (
            <>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium group-hover:text-secondary transition-colors select-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground select-none">
                  {user?.role === "ADMIN" ? "Platform Admin" : "User"}
                </p>
              </div>
              <button
                onClick={logout}
                className="text-sidebar-foreground hover:text-secondary p-1 shrink-0"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
          {!open && (
            <button
              onClick={logout}
              className="text-sidebar-foreground hover:text-secondary p-1"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
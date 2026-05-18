import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col md:pl-[220px]">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
        <footer className="border-t border-border px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Digital Estate</p>
            <p>© 2024 THE DIGITAL ESTATE. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-4">
              <span className="hover:text-foreground cursor-pointer">TERMS</span>
              <span className="hover:text-foreground cursor-pointer">PRIVACY</span>
              <span className="hover:text-foreground cursor-pointer">SUPPORT</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

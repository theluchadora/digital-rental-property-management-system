import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { NotificationDropdown } from "@/components/admin/NotificationDropdown";
import { useAuth } from "@/hooks/use-auth";
import { PageLoading } from "@/components/admin/PageLoading";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/login" });
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <PageLoading
          label={loading ? "Checking session..." : "Redirecting to login..."}
        />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <AdminMainContent />
      </div>
    </SidebarProvider>
  );
}

function AdminMainContent() {
  return (
    <div className="flex flex-1 flex-col min-w-0 h-screen overflow-y-auto">
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b bg-card px-4 shrink-0">
        <div className="flex items-center gap-2">
          {/* <SidebarTrigger /> */}
          <span className="text-sm font-medium text-muted-foreground">
            Admin Console
          </span>
        </div>
        <div className="flex items-center gap-4">
          <NotificationDropdown />
        </div>
      </header>

      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}

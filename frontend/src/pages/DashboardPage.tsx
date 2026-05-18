import { useAuth } from "@/contexts/AuthContext";
import OwnerDashboard from "@/components/dashboard/OwnerDashboard";
import TenantDashboard from "@/components/dashboard/TenantDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  return user?.role === "OWNER" ? <OwnerDashboard /> : <TenantDashboard />;
}

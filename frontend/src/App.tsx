import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import OwnerPropertiesPage from "@/pages/OwnerPropertiesPage";
import PropertyDetailPage from "@/pages/PropertyDetailPage";
import AddPropertyPage from "@/pages/AddPropertyPage";
import TenantBrowsePage from "@/pages/TenantBrowsePage";
import TenantPropertyDetailPage from "@/pages/TenantPropertyDetailPage";
import UnitDetailPage from "@/pages/UnitDetailPage";
import LeasesPage from "@/pages/LeasesPage";
import LeaseDetailPage from "@/pages/LeaseDetailPage";
import CreateLeasePage from "@/pages/CreateLeasePage";
import PaymentsPage from "@/pages/PaymentsPage";
import MaintenancePage from "@/pages/MaintenancePage";
import MessagesPage from "@/pages/MessagesPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import ReportIncidentPage from "./pages/ReportIncidentPage";
import AnnouncementsPage from "@/pages/AnnouncementsPage";
import ReportsPage from "@/pages/ReportsPage";
import AddUnitsPage from "./pages/AddUnitsPage";
import EditPropertyPage from "./pages/EditPropertyPage";

const queryClient = new QueryClient();

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
      <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/properties" element={<ProtectedRoute allowedRoles={["OWNER"]}><OwnerPropertiesPage /></ProtectedRoute>} />
        <Route path="/properties/new" element={<ProtectedRoute allowedRoles={["OWNER"]}><AddPropertyPage /></ProtectedRoute>} />
        <Route path="/properties/:propertyId" element={<ProtectedRoute allowedRoles={["OWNER"]}><PropertyDetailPage /></ProtectedRoute>} />
        <Route path="/properties/:propertyId/edit" element={<ProtectedRoute allowedRoles={["OWNER"]}><EditPropertyPage /></ProtectedRoute>} />
        <Route path="/properties/:propertyId/add-units" element={<ProtectedRoute allowedRoles={["OWNER"]}><AddUnitsPage /></ProtectedRoute>}  />
        <Route path="/browse" element={<ProtectedRoute allowedRoles={["TENANT"]}><TenantBrowsePage /></ProtectedRoute>} />
        <Route path="/browse/:listingId" element={<ProtectedRoute allowedRoles={["TENANT"]}><TenantPropertyDetailPage /></ProtectedRoute>} />
        <Route path="/browse/unit/:unitId" element={<ProtectedRoute allowedRoles={["TENANT"]}><UnitDetailPage /></ProtectedRoute>} />
        <Route path="/leases" element={<LeasesPage />} />
        <Route path="/leases/new" element={<ProtectedRoute allowedRoles={["OWNER"]}><CreateLeasePage /></ProtectedRoute>} />
        <Route path="/leases/:leaseId" element={<LeaseDetailPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={["OWNER"]}><ReportsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/report" element={<ReportIncidentPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
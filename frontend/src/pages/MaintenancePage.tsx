import { useAuth } from "@/contexts/AuthContext";
import OwnerMaintenance from "@/components/maintenance/OwnerMaintenance";
import TenantMaintenance from "@/components/maintenance/TenantMaintenance";

export default function MaintenancePage() {
  const { user } = useAuth();
  return user?.role === "OWNER" ? <OwnerMaintenance /> : <TenantMaintenance />;
}



      //   {/* Tips Card */}
      //   <Card>
      //     <CardHeader>
      //       <CardTitle>Quick Tips</CardTitle>
      //     </CardHeader>
      //     <CardContent className="space-y-3">
      //       <div className="text-sm">
      //         <p className="font-semibold text-foreground">📸 Include Photos</p>
      //         <p className="text-xs text-muted-foreground mt-1">Adding photos helps understand the issue better and speeds up resolution.</p>
      //       </div>
      //       <div className="text-sm">
      //         <p className="font-semibold text-foreground">⚡ Priority Guidelines</p>
      //         <p className="text-xs text-muted-foreground mt-1">
      //           • Urgent: Emergency issues (water leaks, no heat)<br />
      //           • High: Major inconvenience<br />
      //           • Medium: Standard repair<br />
      //           • Low: Cosmetic issues
      //         </p>
      //       </div>
      //       <div className="text-sm">
      //         <p className="font-semibold text-foreground">⏱️ Response Time</p>
      //         <p className="text-xs text-muted-foreground mt-1">
      //           Urgent: Within 24 hours<br />
      //           High: Within 48 hours<br />
      //           Standard: 3-5 business days
      //         </p>
      //       </div>
      //     </CardContent>
      //   </Card>
      // </div>
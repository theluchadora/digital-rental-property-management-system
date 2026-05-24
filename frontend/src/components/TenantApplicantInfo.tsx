import { Mail, Phone, User } from "lucide-react";
import type { User as AppUser } from "@/types/api";

interface TenantApplicantInfoProps {
  tenant?: AppUser | null;
  compact?: boolean;
  /** Show only email/phone (when name is shown elsewhere) */
  contactOnly?: boolean;
}

export default function TenantApplicantInfo({ tenant, compact, contactOnly }: TenantApplicantInfoProps) {
  if (!tenant) {
    return <p className="text-sm text-muted-foreground">Applicant details unavailable</p>;
  }

  const contactLines = (
    <>
      {tenant.email && (
        <p className={`flex items-center gap-2 text-muted-foreground ${compact ? "text-xs truncate" : "text-sm"}`}>
          <Mail className={`${compact ? "h-3 w-3" : "h-4 w-4"} shrink-0`} /> {tenant.email}
        </p>
      )}
      {tenant.phoneNumber && (
        <p className={`flex items-center gap-2 text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
          <Phone className={`${compact ? "h-3 w-3" : "h-4 w-4"} shrink-0`} /> {tenant.phoneNumber}
        </p>
      )}
    </>
  );

  if (compact || contactOnly) {
    return <div className={compact ? "mt-1 space-y-0.5" : "mt-2 space-y-1"}>{contactLines}</div>;
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-secondary" />
        <span className="font-medium">
          {tenant.firstName} {tenant.lastName}
        </span>
      </div>
      {contactLines}
    </div>
  );
}

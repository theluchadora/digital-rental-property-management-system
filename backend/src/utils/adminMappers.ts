import type { PropertyStatus, UserRole } from "@prisma/client";

export type AdminAccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export const toAdminAccountStatus = (isActive: boolean): AdminAccountStatus =>
  isActive ? "ACTIVE" : "SUSPENDED";

export const fromAdminAccountStatus = (status: string): boolean =>
  status === "ACTIVE" || status === "INACTIVE";

export const mapAdminUser = (user: {
  id: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  middleName: user.middleName,
  lastName: user.lastName,
  phoneNumber: user.phoneNumber,
  role: user.role,
  accountStatus: toAdminAccountStatus(user.isActive),
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

const propertyStatusToAdmin = (status: PropertyStatus) => {
  if (status === "MAINTENANCE") return "MAINTENANCE" as const;
  if (status === "OCCUPIED") return "ACTIVE" as const;
  return "ACTIVE" as const;
};

export const adminStatusToProperty = (
  status: string
): PropertyStatus | "DELETE" => {
  switch (status) {
    case "MAINTENANCE":
      return "MAINTENANCE";
    case "INACTIVE":
      return "VACANT";
    case "DELETED":
      return "DELETE";
    default:
      return "VACANT";
  }
};

export const mapAdminProperty = (
  p: {
    id: string;
    ownerId: string;
    title: string;
    description?: string | null;
    type: string;
    status: PropertyStatus;
    city?: string | null;
    address?: string | null;
    createdAt: Date;
    updatedAt: Date;
    owner?: {
      id: string;
      email: string;
      firstName: string;
      middleName?: string | null;
      lastName: string;
      phoneNumber: string;
      role: UserRole;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  }
) => ({
  id: p.id,
  ownerId: p.ownerId,
  title: p.title,
  description: p.description ?? undefined,
  type: p.type,
  addressCity: p.city ?? "—",
  addressStreet: p.address,
  status: propertyStatusToAdmin(p.status),
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
  owner: p.owner ? mapAdminUser(p.owner) : undefined,
});

export const mapAdminLease = (lease: {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: { toString(): string };
  depositAmount?: { toString(): string } | null;
  status: string;
  moveOutNoticeDate?: Date | null;
  moveOutNoticeNote?: string | null;
  terminationReason?: string | null;
  terminatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  property: {
    id: string;
    ownerId: string;
    title: string;
    description?: string | null;
    type: string;
    status: PropertyStatus;
    city?: string | null;
    address?: string | null;
    unitNumber?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    squareFeet?: number | null;
    monthlyRent?: { toString(): string } | null;
    createdAt: Date;
    updatedAt: Date;
  };
  tenant: Parameters<typeof mapAdminUser>[0];
  documents?: Array<{
    id: string;
    leaseId: string;
    fileUrl: string;
    fileName?: string | null;
    documentType?: string | null;
    uploadedBy?: string | null;
    uploadedAt: Date;
    updatedAt: Date;
  }>;
}) => {
  const prop = lease.property;
  const leaseStatus =
    lease.status === "INITIATED" || lease.status === "AWAITINGPAYMENT"
      ? "DRAFT"
      : lease.status;

  return {
    id: lease.id,
    unitId: lease.propertyId,
    tenantId: lease.tenantId,
    startDate: lease.startDate.toISOString(),
    endDate: lease.endDate.toISOString(),
    monthlyRent: Number(lease.monthlyRent),
    depositAmount: Number(lease.depositAmount ?? 0),
    status: leaseStatus,
    moveOutNoticeDate: lease.moveOutNoticeDate?.toISOString() ?? null,
    moveOutNoticeNote: lease.moveOutNoticeNote,
    terminationReason: lease.terminationReason,
    terminatedAt: lease.terminatedAt?.toISOString() ?? null,
    createdAt: lease.createdAt.toISOString(),
    updatedAt: lease.updatedAt.toISOString(),
    unit: {
      id: prop.id,
      propertyId: lease.propertyId,
      unitIdentifier: prop.unitNumber || prop.title,
      bedrooms: prop.bedrooms ?? 0,
      bathrooms: Number(prop.bathrooms ?? 0),
      areaSqMeters: prop.squareFeet,
      rentAmount: Number(prop.monthlyRent ?? lease.monthlyRent),
      depositAmount: Number(lease.depositAmount ?? 0),
      status: prop.status,
      property: {
        id: prop.id,
        ownerId: prop.ownerId,
        title: prop.title,
        addressCity: prop.city ?? "—",
        addressStreet: prop.address,
        status: propertyStatusToAdmin(prop.status),
      },
    },
    tenant: mapAdminUser(lease.tenant),
    documents: (lease.documents ?? []).map((d) => ({
      id: d.id,
      leaseId: d.leaseId,
      documentType: d.documentType ?? "OTHER",
      filePath: d.fileUrl,
      uploadedBy: d.uploadedBy ?? "",
      createdAt: d.uploadedAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
  };
};

export const mapAdminMaintenance = (m: {
  id: string;
  propertyId: string;
  createdBy: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  notes?: string | null;
  completedDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  property: Parameters<typeof mapAdminProperty>[0];
  createdByUser: Parameters<typeof mapAdminUser>[0];
  evidence?: Array<{
    id: string;
    maintenanceId: string;
    fileUrl: string;
    uploadedBy?: string | null;
    uploadedAt: Date;
    updatedAt: Date;
  }>;
}) => ({
  id: m.id,
  unitId: m.propertyId,
  tenantId: m.createdBy,
  category: m.title,
  priority: m.priority,
  description: m.description ?? "",
  status: m.status,
  note: m.notes,
  resolvedAt: m.completedDate?.toISOString() ?? null,
  createdAt: m.createdAt.toISOString(),
  updatedAt: m.updatedAt.toISOString(),
  unit: {
    id: m.property.id,
    propertyId: m.propertyId,
    unitIdentifier: m.property.title,
    bedrooms: 0,
    bathrooms: 0,
    rentAmount: 0,
    status: m.property.status,
    amenities: [] as string[],
    property: mapAdminProperty(m.property),
  },
  tenant: mapAdminUser(m.createdByUser),
  evidence: (m.evidence ?? []).map((e) => ({
    id: e.id,
    requestId: e.maintenanceId,
    filePath: e.fileUrl,
    uploadedBy: e.uploadedBy ?? "",
    createdAt: e.uploadedAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  })),
});

export type Role = "OWNER" | "TENANT" | "ADMIN";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phoneNumber?: string;
  role: Role;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PropertySummary {
  id: string;
  ownerId: string;
  title: string;
  addressCity: string;
  addressStreet?: string | null;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "DELETED";
}

export interface Property extends PropertySummary {
  description?: string;
  type: "BUILDING" | "VEHICLE";
  addressSubCity?: string;
  addressWoreda?: string;
  addressHouseNumber?: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
}

export interface RentalUnitSummary {
  id: string;
  propertyId: string;
  unitIdentifier: string;
  bedrooms: number;
  bathrooms: number;
  areaSqMeters?: number | null;
  rentAmount: number;
  depositAmount?: number | null;
  status: "VACANT" | "OCCUPIED" | "MAINTENANCE" | "UNAVAILABLE";
  description?: string | null;
  floorNumber?: number | null;
  amenities: string[];
  property: PropertySummary;
}

export interface LeaseDocument {
  id: string;
  leaseId: string;
  documentType: string;
  filePath: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lease {
  id: string;
  unitId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
  status: "DRAFT" | "ACTIVE" | "TERMINATED" | "EXPIRED";
  moveOutNoticeDate?: string | null;
  moveOutNoticeNote?: string | null;
  terminationReason?: string | null;
  terminatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  unit: RentalUnitSummary;
  tenant: User;
  documents: LeaseDocument[];
}

export interface PaymentReceipt {
  id: string;
  invoiceId: string;
  filePath: string;
  transactionRef?: string | null;
  paymentMethod?: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  leaseId: string;
  billingMonth: string;
  amountDue: number;
  dueDate: string;
  status: "UNPAID" | "PENDING_REVIEW" | "PAID" | "OVERDUE";
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lease: Lease;
  receipts: PaymentReceipt[];
  reviewer?: User;
}

export interface MaintenanceEvidence {
  id: string;
  requestId: string;
  filePath: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequest {
  id: string;
  unitId: string;
  tenantId: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  note?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  unit: RentalUnitSummary;
  tenant: User;
  resolver?: User;
  evidence: MaintenanceEvidence[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  content: string;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender: User;
  receiver: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: "MESSAGE" | "ANNOUNCEMENT" | "MAINTENANCE" | "INVOICE" | "SYSTEM";
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface AdminStats {
  totalUsers: number;
  totalOwners: number;
  totalTenants: number;
  totalProperties: number;
  totalLeases: number;
  activeLeases: number;
  totalRevenue: number;
  pendingInvoices: number;
  openMaintenance: number;
  unreadNotifications: number;
  monthlyRevenue: { month: string; revenue: number }[];
  usersByRole: { role: string; count: number }[];
  maintenanceByStatus: { status: string; count: number }[];
}

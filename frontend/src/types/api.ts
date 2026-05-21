// ===== Enums =====
export type UserRole = "OWNER" | "TENANT" | "ADMIN";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type PropertyType = "BUILDING" | "UNIT" | "HOUSE" | "VEHICLE";
export type PropertyStatus = "VACANT" | "OCCUPIED" | "MAINTENANCE";
export type FuelType = "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID";
export type UnitStatus = "VACANT" | "OCCUPIED" | "MAINTENANCE" | "UNAVAILABLE";
export type LeaseStatus = "INITIATED" | "AWAITINGPAYMENT" | "DRAFT" | "ACTIVE" | "TERMINATED" | "EXPIRED";
export type InvoiceStatus = "UNPAID" | "PENDING_REVIEW" | "PAID" | "OVERDUE";
export type MaintenanceStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "OWNER_REJECTED" | "TENANT_REJECTED" | "CANCELLED" | "CLOSED";
export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type NotificationType = "MESSAGE" | "ANNOUNCEMENT" | "MAINTENANCE" | "INVOICE" | "SYSTEM";
export type BuildingType = "APARTMENT" | "HOUSE" | "COMMERCIAL" | "OFFICE" | "WAREHOUSE";
export type VehicleType = "SEDAN" | "SUV" | "TRUCK" | "MOTORCYCLE" | "VAN" | "BUS";
export type TransmissionType = "MANUAL" | "AUTOMATIC";


// ===== User =====
export interface User {
  id: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  profileImageUrl?: string | null; 
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// // ===== Property =====
// export interface BuildingDetails {
//   buildingType: BuildingType;
//   totalFloors: number;
//   totalUnits: number;
//   hasParking: boolean;
//   hasElevator: boolean;
//   hasSecurity: boolean;
//   yearBuilt?: number;
//   amenities?: string[];
// }

// export interface VehicleDetails {
//   plateNumber: string;
//   vehicleType: VehicleType;
//   brand: string;
//   model: string;
//   manufactureYear: number;
//   color: string;
//   transmissionType: TransmissionType;
//   fuelType: FuelType;
//   engineCapacity?: string;
//   mileage?: number;
// }

// export interface PropertyMedia {
//   id: string;
//   propertyId: string;
//   unitId?: string | null;
//   filePath: string;
//   mediaType: string;
//   isPrimary: boolean;
//   description?: string;
// }

// export interface PropertySummary {
//   id: string;
//   ownerId: string;
//   title: string;
//   type?: PropertyType;
//   addressCity: string;
//   addressStreet?: string | null;
//   status: PropertyStatus;
//   owner?: Partial<User>;
// }

// export interface Property {
//   id: string;
//   ownerId: string;
//   title: string;
//   description?: string;
//   type: PropertyType;
//   status: PropertyStatus;
//   addressCity: string;
//   addressStreet?: string;
//   addressSubCity?: string;
//   addressWoreda?: string;
//   addressHouseNumber?: string;
//   buildingDetails?: BuildingDetails | null;
//   vehicleDetails?: VehicleDetails | null;
//   media?: PropertyMedia[];
//   rentalUnits?: RentalUnit[];
//   owner?: User;
//   createdAt: string;
//   updatedAt?: string;
// }

// // ===== Rental Unit =====
// export interface RentalUnit {
//   id: string;
//   propertyId: string;
//   unitIdentifier: string;
//   bedrooms: number;
//   bathrooms: number;
//   areaSqMeters?: number | null;
//   rentAmount: number;
//   depositAmount?: number | null;
//   status: UnitStatus;
//   description?: string | null;
//   floorNumber?: number | null;
//   amenities?: string[];
//   property?: PropertySummary;
//   currentLease?: { id: string; status: LeaseStatus } | null;
//   createdAt?: string;
//   updatedAt?: string;
// }

// // ===== Lease =====
// export interface LeaseDocument {
//   id: string;
//   leaseId: string;
//   documentType: string;
//   filePath: string;
//   uploadedBy: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface Lease {
//   id: string;
//   unitId: string;
//   tenantId: string;
//   startDate: string;
//   endDate: string;
//   monthlyRent: number;
//   depositAmount: number;
//   status: LeaseStatus;
//   moveOutNoticeDate?: string | null;
//   moveOutNoticeNote?: string | null;
//   terminationReason?: string | null;
//   terminatedAt?: string | null;
//   createdAt: string;
//   updatedAt: string;
//   unit?: RentalUnit;
//   tenant?: User;
//   documents?: LeaseDocument[];
//   invoices?: Invoice[];
// }

// // ===== Invoice =====
// export interface PaymentReceipt {
//   id: string;
//   invoiceId: string;
//   filePath: string;
//   transactionRef?: string | null;
//   paymentMethod?: string | null;
//   uploadedBy: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface Invoice {
//   id: string;
//   leaseId: string;
//   billingMonth: string;
//   amountDue: number;
//   dueDate: string;
//   status: InvoiceStatus;
//   reviewNote?: string | null;
//   reviewedBy?: string | null;
//   reviewedAt?: string | null;
//   createdAt: string;
//   updatedAt: string;
//   lease?: Lease;
//   receipts?: PaymentReceipt[];
//   reviewer?: User;
// }

// // ===== Maintenance =====
// export interface MaintenanceEvidence {
//   id: string;
//   requestId: string;
//   filePath: string;
//   uploadedBy: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface MaintenanceRequest {
//   id: string;
//   unitId: string;
//   tenantId: string;
//   category: string;
//   priority: MaintenancePriority;
//   description: string;
//   status: MaintenanceStatus;
//   note?: string | null;
//   resolvedAt?: string | null;
//   resolvedBy?: string | null;
//   createdAt: string;
//   updatedAt: string;
//   unit?: RentalUnit;
//   tenant?: User;
//   resolver?: User;
//   evidence?: MaintenanceEvidence[];
// }

// ===== Messaging =====
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  content: string;
  conversationId: string;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  receiver?: User;
  isOptimistic?: boolean;
}

export interface Conversation {
  id: string;
  participantAId: string;
  participantBId: string;
  propertyId?: string | null;
  lastMessageId?: string | null;
  participantA: User;
  participantB: User;
  lastMessage?: Message;
  property?: Property;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  ownerId: string;
  propertyId?: string | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  property?: Property;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== Pagination =====
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}




// types/api.ts
// types/api.ts


export interface PropertyPhoto {
  id: string;
  propertyId: string;
  url: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  type: PropertyType;
  status: PropertyStatus;
  hasUnits: boolean;
  parentId?: string;
  
  // Location (for BUILDING, HOUSE, UNIT - NULL for VEHICLE)
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  
  // Unit specific (only for type: UNIT)
  unitNumber?: string;
  floorNumber?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  hasGarage?: boolean;
  hasGarden?: boolean;
  
  // Building specific (only for type: BUILDING)
  totalUnits?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGym?: boolean;
  hasPool?: boolean;
  hasSecurity?: boolean;
  yearBuilt?: number;
  
  // Vehicle specific (only for type: VEHICLE)
  plateNumber?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  mileage?: number;
  fuelType?: FuelType;
  seats?: number;
  
  // Pricing (for all rentable types)
  monthlyRent?: number;
  paidEvery?: number;
  minLeaseMonth?: number;
  latefee?: number;
  
  // Additional info
  features?: any;
  rules?: string;
  notes?: string;
  
  // Relations
  photos?: PropertyPhoto[];
  units?: Property[];
  parent?: Property;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyPayload {
  title: string;
  description?: string;
  type: PropertyType;
  status?: PropertyStatus;
  hasUnits: boolean;
  parentId?: string;
  
  // Location
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  
  // Unit specific
  unitNumber?: string;
  floorNumber?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  hasGarage?: boolean;
  hasGarden?: boolean;
  
  // Building specific
  totalUnits?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGym?: boolean;
  hasPool?: boolean;
  hasSecurity?: boolean;
  yearBuilt?: number;
  
  // Vehicle specific
  plateNumber?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  mileage?: number;
  fuelType?: FuelType;
  seats?: number;
  
  // Pricing
  monthlyRent?: number;
  paidEvery?: number;
  minLeaseMonth?: number;
  latefee?: number;
  
  // Additional
  features?: any;
  rules?: string;
  notes?: string;
  
  photos?: string[];
}

export interface UpdatePropertyPayload {
  title?: string;
  description?: string;
  status?: PropertyStatus;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  unitNumber?: string;
  floorNumber?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  hasGarage?: boolean;
  hasGarden?: boolean;
  totalUnits?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGym?: boolean;
  hasPool?: boolean;
  hasSecurity?: boolean;
  yearBuilt?: number;
  plateNumber?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  mileage?: number;
  fuelType?: FuelType;
  seats?: number;
  monthlyRent?: number;
  paidEvery?: number;
  minLeaseMonth?: number;
  latefee?: number;
  features?: any;
  rules?: string;
  notes?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}
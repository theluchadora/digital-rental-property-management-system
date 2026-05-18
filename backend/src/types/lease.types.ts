import { User } from "./user.types";
import { Property } from "./property.types";
import { Invoice } from "./invoice.types";

export enum LeaseStatus {
  ACTIVE = "ACTIVE",
  DRAFT = "DRAFT",
  EXPIRED = "EXPIRED",
  TERMINATED = "TERMINATED",
}

export interface Lease {
  id: string;
  propertyId: string;
  property?: Property;
  tenantId: string;
  tenant?: User;
  paidEvery: number;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  moveInDate: Date;
  moveOutDate: Date;
  status: LeaseStatus;
  invoices?: Invoice[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaseCreateInput {
  propertyId: string;
  tenantId: string;
  paidEvery: number;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  moveInDate: Date;
  moveOutDate: Date;
  status?: LeaseStatus;
}

export interface LeaseUpdateInput {
  paidEvery?: number;
  startDate?: Date;
  endDate?: Date;
  monthlyRent?: number;
  moveInDate?: Date;
  moveOutDate?: Date;
  status?: LeaseStatus;
}

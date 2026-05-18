import { User } from "./user.types";
import { Property } from "./property.types";

export enum MaintenanceStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum MaintenancePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface Maintenance {
  id: string;
  propertyId: string;
  property?: Property;
  createdBy: string;
  createdByUser?: User;
  title: string;
  description?: string | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  scheduledDate?: Date | null;
  completedDate?: Date | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceCreateInput {
  propertyId: string;
  createdBy: string;
  title: string;
  description?: string;
  priority?: MaintenancePriority;
  scheduledDate?: Date;
  estimatedCost?: number;
  notes?: string;
}

export interface MaintenanceUpdateInput {
  title?: string;
  description?: string;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  scheduledDate?: Date;
  completedDate?: Date;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
}

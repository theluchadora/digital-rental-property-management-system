import { User } from "./user.types";
import { Lease } from "./lease.types";
import { Maintenance } from "./maintenance.types";

export enum PropertyType {
  BUILDING = "BUILDING",
  UNIT = "UNIT",
  HOUSE = "HOUSE",
  VEHICLE = "VEHICLE",
}

export enum FuelType {
  PETROL = "PETROL",
  DIESEL = "DIESEL",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID",
}

// =====================================================
// PROPERTY BASE
// =====================================================

export interface PropertyBase {
  id: string;
  ownerId: string;
  title: string;
  description?: string | null;
  type: PropertyType;
  isActive: boolean;
  hasUnits: boolean;
  monthlyRent?: number | null;
  paidEvery?: number | null;
  features?: Record<string, any> | null;
  rules?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// PROPERTY SPECIALTY TYPES
// =====================================================

/** Location information for BUILDING, HOUSE, UNIT types */
export interface PropertyLocation {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

/** Unit-specific fields (for PropertyType.UNIT) */
export interface UnitSpecifics {
  unitNumber?: string | null;
  floorNumber?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFeet?: number | null;
  hasGarage?: boolean;
  hasGarden?: boolean;
}

/** Building-specific fields (for PropertyType.BUILDING) */
export interface BuildingSpecifics {
  totalUnits?: number | null;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGym?: boolean;
  hasPool?: boolean;
  hasSecurity?: boolean;
  yearBuilt?: number | null;
}

/** Vehicle-specific fields (for PropertyType.VEHICLE) */
export interface VehicleSpecifics {
  plateNumber?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  mileage?: number | null;
  fuelType?: FuelType | null;
  seats?: number | null;
}

/** Self-referencing hierarchy for buildings with units */
export interface PropertyHierarchy {
  parentId?: string | null;
  parent?: Property | null;
  units?: Property[];
}

// =====================================================
// COMPLETE PROPERTY TYPE
// =====================================================

export interface Property
  extends PropertyBase,
    PropertyLocation,
    UnitSpecifics,
    BuildingSpecifics,
    VehicleSpecifics,
    PropertyHierarchy {
  owner?: User;
  photos?: PropertyPhoto[];
  leases?: Lease[];
  maintenance?: Maintenance[];
}

// =====================================================
// PROPERTY PHOTO
// =====================================================

export interface PropertyPhoto {
  id: string;
  propertyId: string;
  property?: Property;
  url: string;
  uploadedAt: Date;
  updatedAt: Date;
}

export interface PropertyPhotoCreateInput {
  propertyId: string;
  url: string;
}

// =====================================================
// INPUT TYPES
// =====================================================

export interface PropertyCreateInput {
  ownerId: string;
  title: string;
  description?: string;
  type: PropertyType;
  isActive?: boolean;
  hasUnits?: boolean;
  parentId?: string;
  // Location
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Unit specifics
  unitNumber?: string;
  floorNumber?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  hasGarage?: boolean;
  hasGarden?: boolean;
  // Building specifics
  totalUnits?: number;
  hasElevator?: boolean;
  hasParking?: boolean;
  hasGym?: boolean;
  hasPool?: boolean;
  hasSecurity?: boolean;
  yearBuilt?: number;
  // Vehicle specifics
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
  features?: Record<string, any>;
  rules?: string;
  notes?: string;
}

export interface PropertyUpdateInput extends Partial<PropertyCreateInput> {}

// =====================================================
// UNIT-SPECIFIC INPUT TYPES
// =====================================================

export interface UnitCreateInput
  extends Omit<PropertyCreateInput, "type"> {
  type: PropertyType.UNIT;
  parentId: string; // Required for units
  unitNumber: string; // Required for units
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
}

export interface BuildingCreateInput
  extends Omit<PropertyCreateInput, "type"> {
  type: PropertyType.BUILDING;
  totalUnits?: number;
}

export interface VehicleCreateInput
  extends Omit<PropertyCreateInput, "type"> {
  type: PropertyType.VEHICLE;
  plateNumber: string; // Required for vehicles
  brand: string; // Required for vehicles
  model: string; // Required for vehicles
}

export interface HouseCreateInput
  extends Omit<PropertyCreateInput, "type"> {
  type: PropertyType.HOUSE;
  address: string; // Required for houses
  city: string; // Required for houses
  state: string; // Required for houses
}

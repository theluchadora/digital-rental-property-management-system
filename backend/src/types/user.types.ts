export enum UserRole {
  TENANT = "TENANT",
  OWNER = "OWNER",
  ADMIN = "ADMIN",
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  profileImageUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  role?: UserRole;
}

export interface UserUpdateInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  isActive?: boolean;
  lastLoginAt?: Date;
}

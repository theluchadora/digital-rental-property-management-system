import prisma from "../config/db";
import { Prisma, User } from "@prisma/client";

/**
 * Create a new user
 */
export const createUser = async (
  data: Prisma.UserCreateInput
): Promise<User> => {
  return prisma.user.create({
    data,
  });
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
  });
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Get all users
 */
export const getAllUsers = async (): Promise<User[]> => {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Update user
 */
export const updateUser = async (
  id: string,
  data: Prisma.UserUpdateInput
): Promise<User> => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

/**
 * Delete user
 */
export const deleteUser = async (id: string): Promise<User> => {
  return prisma.user.delete({
    where: { id },
  });
};


// Search users by name or email
export const searchUsers = async (query: string, excludeUserId?: string): Promise<User[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.user.findMany({
    where: {
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      accountStatus: "ACTIVE",
      OR: [
        { email: { contains: trimmed, mode: "insensitive" } },
        { firstName: { contains: trimmed, mode: "insensitive" } },
        { lastName: { contains: trimmed, mode: "insensitive" } },
        { phoneNumber: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });
};
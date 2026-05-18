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


//search user by name 
export const searchUsers = async (query: string): Promise<User[]> => {
   const firstHalf = query.split(" ")[0];
   const secondHalf = query.split(" ")[1] || "";
  return prisma.user.findMany({
    where: {
      OR: [
        { firstName: { contains: firstHalf, mode: "insensitive" } },
        { lastName: { contains: firstHalf, mode: "insensitive" } },
        { firstName: { contains: secondHalf, mode: "insensitive" } },
        { lastName: { contains: secondHalf, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}